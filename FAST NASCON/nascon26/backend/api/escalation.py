"""
Lead acknowledgement, escalation chain and Recovery Queue (F3.4 / F3.5 / F3.7).

Lifecycle of a lead
-------------------
1. assign_lead() gives it to an employee and starts the timer (`assigned_at`).
2. The owner calls acknowledge_lead() within the workspace's
   `ack_window_minutes`. Moving the stage past "Lead" counts as acknowledging.
3. If not, the periodic sweep (process_overdue_leads) escalates it:
      tier 1: next eligible EMPLOYEE (role=user), round-robin, skipping anyone
              who already held the lead
      tier 2: an available MANAGER (owner/admin), capacity limit waived
   and restarts the timer for the new holder.
4. The lead goes to the Recovery Queue (owner cleared, `in_recovery_queue`)
   when ANY of these is true:
      * escalation_count has reached workspace.max_escalations
      * nobody is left in the chain (tier 1 and tier 2 both empty)
      * it has sat unacknowledged for >= STALE_WINDOWS windows (the sweep was
        down, or kept failing) -- "unacknowledged beyond multiple windows"
   An admin takes it back out with claim_recovery_lead().
5. Every escalation / recovery fires a Django signal (lead_escalated /
   lead_moved_to_recovery); api/notifications.py turns those into Notification rows.
"""
import logging
from datetime import timedelta

from django.db import transaction
from django.dispatch import Signal
from django.utils import timezone

from .assignment import apply_assignment, eligible_assignees
from .models import AuditLog, Opportunity, User, Workspace

logger = logging.getLogger(__name__)

# Unacknowledged for this many full windows => straight to Recovery Queue.
STALE_WINDOWS = 2
# Max leads handled per workspace per sweep (the next sweep picks up the rest).
SWEEP_BATCH_SIZE = 200

# Signals (sent after the DB transaction commits).
#   lead_escalated:        opportunity, from_user, to_user, escalation_count
#   lead_moved_to_recovery: opportunity, from_user, reason
lead_escalated = Signal()
lead_moved_to_recovery = Signal()

SKIPPED, ESCALATED, RECOVERY = "skipped", "escalated", "recovery"


# --------------------------------------------------------------------------
# Owner-facing actions
# --------------------------------------------------------------------------
def acknowledge_lead(opportunity, user, *, now=None):
    """
    Stop the timer. Only the current owner may acknowledge. Idempotent.
    Returns True if `user` now holds an acknowledged lead, else False.
    """
    now = now or timezone.now()
    with transaction.atomic():
        opp = Opportunity.objects.select_for_update(of=("self",)).get(pk=opportunity.pk)
        if opp.owner_id != user.pk or opp.in_recovery_queue:
            return False
        if opp.acknowledged_at is None:
            opp.acknowledged_at = now
            opp.save(update_fields=["acknowledged_at", "updated_at"])
    opportunity.acknowledged_at = opp.acknowledged_at
    return True


def claim_recovery_lead(opportunity, user, *, now=None):
    """
    Take a lead out of the Recovery Queue. The claimer owns it immediately and
    it counts as acknowledged. Returns False if it isn't claimable.
    """
    now = now or timezone.now()
    with transaction.atomic():
        opp = Opportunity.objects.select_for_update(of=("self",)).get(pk=opportunity.pk)
        if not opp.in_recovery_queue or opp.workspace_id != user.workspace_id or not user.is_active:
            return False
        apply_assignment(opp, user, reason="recovery_claim", now=now)
        opp.acknowledged_at = now
        opp.save(update_fields=["acknowledged_at", "updated_at"])
    opportunity.refresh_from_db()
    return True


# --------------------------------------------------------------------------
# Escalation engine
# --------------------------------------------------------------------------
def _next_in_chain(opp):
    """Tier 1: eligible employees. Tier 2: available managers. Else None."""
    tried = opp.assignment_trail
    employees = eligible_assignees(
        opp.workspace_id, lock=True, exclude_user_ids=tried, roles=[User.Role.USER]
    )
    if employees:
        return employees[0]
    managers = eligible_assignees(
        opp.workspace_id,
        lock=True,
        exclude_user_ids=tried,
        roles=[User.Role.OWNER, User.Role.ADMIN],
        enforce_capacity=False,
    )
    return managers[0] if managers else None


def _move_to_recovery(opp, reason, now):
    from_user = opp.owner
    before = {"owner": str(opp.owner_id) if opp.owner_id else None, "in_recovery_queue": False}
    opp.owner = None
    opp.in_recovery_queue = True
    opp.recovery_reason = reason
    opp.recovery_entered_at = now
    opp.save(update_fields=[
        "owner", "in_recovery_queue", "recovery_reason", "recovery_entered_at", "updated_at",
    ])
    AuditLog.record(
        workspace_id=opp.workspace_id,
        actor=None,
        action=AuditLog.Action.UPDATE,
        target=opp,
        before=before,
        after={"owner": None, "in_recovery_queue": True, "reason": reason},
    )
    transaction.on_commit(
        lambda: lead_moved_to_recovery.send(
            sender=Opportunity, opportunity=opp, from_user=from_user, reason=reason
        )
    )


def escalate_lead(opportunity_id, *, now=None):
    """
    Escalate ONE lead if (and only if) it is still overdue. Safe to call
    concurrently / repeatedly: it row-locks the lead, re-checks every condition
    under the lock, and skips leads another worker is already handling.

    Returns SKIPPED, ESCALATED or RECOVERY.
    """
    now = now or timezone.now()
    with transaction.atomic():
        opp = (
            Opportunity.objects.select_for_update(skip_locked=True, of=("self",))
            .filter(pk=opportunity_id)
            .first()
        )
        if opp is None:  # gone, or locked by another worker
            return SKIPPED

        workspace = Workspace.objects.get(pk=opp.workspace_id)
        window = timedelta(minutes=workspace.ack_window_minutes)

        still_overdue = (
            opp.stage == Opportunity.Stage.LEAD
            and opp.owner_id is not None
            and opp.assigned_at is not None
            and opp.acknowledged_at is None
            and not opp.in_recovery_queue
            and now - opp.assigned_at >= window
        )
        if not still_overdue:
            return SKIPPED

        # --- Recovery conditions ------------------------------------------
        if opp.escalation_count >= workspace.max_escalations:
            _move_to_recovery(opp, Opportunity.RecoveryReason.MAX_ESCALATIONS, now)
            return RECOVERY
        if now - opp.assigned_at >= window * STALE_WINDOWS:
            _move_to_recovery(opp, Opportunity.RecoveryReason.STALE, now)
            return RECOVERY
        nxt = _next_in_chain(opp)
        if nxt is None:
            _move_to_recovery(opp, Opportunity.RecoveryReason.NO_ELIGIBLE, now)
            return RECOVERY

        # --- Escalate to the next person in the chain ----------------------
        from_user = opp.owner
        opp.escalation_count += 1
        opp.last_escalated_at = now
        apply_assignment(
            opp, nxt, reason="escalation", now=now,
            extra_fields=("escalation_count", "last_escalated_at"),
        )
        count = opp.escalation_count
        transaction.on_commit(
            lambda: lead_escalated.send(
                sender=Opportunity, opportunity=opp, from_user=from_user,
                to_user=nxt, escalation_count=count,
            )
        )
        return ESCALATED


def process_overdue_leads(*, now=None):
    """
    Sweep every active workspace for leads past their acknowledgement window
    and escalate each one. Returns counts, e.g. {"escalated": 3, "recovery": 1,
    "skipped": 0, "errors": 0}. One bad lead / workspace never blocks the rest.
    """
    now = now or timezone.now()
    stats = {ESCALATED: 0, RECOVERY: 0, SKIPPED: 0, "errors": 0}

    for ws in Workspace.objects.filter(is_active=True).only("id", "ack_window_minutes"):
        cutoff = now - timedelta(minutes=ws.ack_window_minutes)
        overdue_ids = list(
            Opportunity.objects.filter(
                workspace_id=ws.pk,
                stage=Opportunity.Stage.LEAD,
                owner__isnull=False,
                acknowledged_at__isnull=True,
                in_recovery_queue=False,
                assigned_at__lte=cutoff,
            )
            .order_by("assigned_at")
            .values_list("pk", flat=True)[:SWEEP_BATCH_SIZE]
        )
        for pk in overdue_ids:
            try:
                stats[escalate_lead(pk, now=now)] += 1
            except Exception:  # noqa: BLE001 - isolate failures per lead
                logger.exception("Escalation failed for opportunity %s", pk)
                stats["errors"] += 1
    return stats
