"""
Round-robin lead assignment (F3.2 availability + F3.3 distribution).

Usage
-----
    from api.assignment import assign_lead

    opp = Opportunity.objects.create(workspace=ws, name="...", contact=c)
    owner = assign_lead(opp)          # -> User, or None if nobody is eligible

Rules
-----
* Candidates come ONLY from the opportunity's own workspace (tenant isolation).
* A user is eligible iff:
    - is_active, and
    - status == Available  (Busy / On leave / Offline never receive leads), and
    - open_lead_count < max_open_leads
  where "open" means an owned opportunity whose stage is not Won / Lost.
* Round-robin = the eligible user who was auto-assigned a lead LEAST recently
  gets the next one (never-assigned users first, ties broken by user id).
  The cursor is `User.last_assigned_at`.
* Every (re)assignment starts the acknowledgement timer (`assigned_at`), clears
  `acknowledged_at`, and appends the user to `assignment_trail`.
* Concurrency: eligible user rows are locked (SELECT ... FOR UPDATE) inside a
  transaction. (SQLite ignores row locks; Postgres honours them.)
"""
from datetime import datetime, timezone as dt_timezone

from django.db import transaction
from django.db.models import Count
from django.utils import timezone

from .models import AuditLog, Opportunity, User

# Sorts before any real timestamp, so never-assigned users go first.
_EPOCH = datetime.min.replace(tzinfo=dt_timezone.utc)

# Stages that no longer count against an employee's capacity.
CLOSED_STAGES = (Opportunity.Stage.WON, Opportunity.Stage.LOST)


def eligible_assignees(
    workspace_id,
    *,
    lock=False,
    exclude_user_ids=(),
    roles=None,
    enforce_capacity=True,
):
    """
    Users in `workspace_id` who can take a lead right now, next-in-line first.

    exclude_user_ids  -- users to skip (e.g. everyone who already held the lead)
    roles             -- restrict to these User.Role values (None = any role)
    enforce_capacity  -- apply max_open_leads (managers in the escalation
                         fallback tier bypass it)
    lock              -- row-lock candidates; call inside transaction.atomic
    """
    # Cheap filters first. This is the query we lock; no aggregates allowed
    # in it because Postgres forbids FOR UPDATE with GROUP BY.
    candidates = User.objects.filter(
        workspace_id=workspace_id,
        is_active=True,
        status=User.Status.AVAILABLE,
    )
    if exclude_user_ids:
        candidates = candidates.exclude(pk__in=[int(i) for i in exclude_user_ids])
    if roles:
        candidates = candidates.filter(role__in=roles)
    if lock:
        candidates = candidates.select_for_update(of=("self",))
    candidates = list(candidates)
    if not candidates:
        return []

    if enforce_capacity:
        open_counts = dict(
            Opportunity.objects.filter(
                workspace_id=workspace_id,
                owner_id__in=[u.pk for u in candidates],
            )
            .exclude(stage__in=CLOSED_STAGES)
            .values_list("owner_id")
            .annotate(n=Count("pk"))
            .values_list("owner_id", "n")
        )
        candidates = [u for u in candidates if open_counts.get(u.pk, 0) < u.max_open_leads]

    # Round-robin order: never-assigned first, then least recently assigned.
    candidates.sort(key=lambda u: (u.last_assigned_at or _EPOCH, u.pk))
    return candidates


def apply_assignment(opportunity, user, *, reason, now=None, request=None, extra_fields=()):
    """
    Give `opportunity` to `user` and (re)start its acknowledgement timer.

    Must be called inside transaction.atomic(). Shared by first-time assignment,
    escalation and Recovery Queue claims. `extra_fields` lists additional
    Opportunity fields the caller already mutated and wants saved too.
    """
    now = now or timezone.now()
    before = {
        "owner": str(opportunity.owner_id) if opportunity.owner_id else None,
        "in_recovery_queue": opportunity.in_recovery_queue,
    }

    opportunity.owner = user
    opportunity.assigned_at = now
    opportunity.acknowledged_at = None
    opportunity.assignment_trail = [*opportunity.assignment_trail, str(user.pk)]
    opportunity.in_recovery_queue = False
    opportunity.recovery_reason = ""
    opportunity.recovery_entered_at = None
    # TenantModel.save() re-checks that the owner is in the same workspace.
    opportunity.save(
        update_fields=[
            "owner", "assigned_at", "acknowledged_at", "assignment_trail",
            "in_recovery_queue", "recovery_reason", "recovery_entered_at",
            "updated_at", *extra_fields,
        ]
    )
    User.objects.filter(pk=user.pk).update(last_assigned_at=now)

    AuditLog.record(
        workspace_id=opportunity.workspace_id,
        actor=None,  # system action -> actor_repr "system"
        action=AuditLog.Action.UPDATE,
        target=opportunity,
        before=before,
        after={"owner": str(user.pk), "reason": reason},
        request=request,
    )


def assign_lead(opportunity, *, reassign=False, request=None):
    """
    Assign `opportunity` to the next eligible employee in its workspace.

    Returns the chosen User, or None when nobody is eligible (the opportunity
    is left unassigned for an admin / a later retry).

    If the opportunity already has an owner it is left alone and that owner is
    returned, unless reassign=True.
    """
    if opportunity.owner_id and not reassign:
        return opportunity.owner

    with transaction.atomic():
        queue = eligible_assignees(opportunity.workspace_id, lock=True)
        if not queue:
            return None
        chosen = queue[0]
        apply_assignment(opportunity, chosen, reason="round_robin_assignment", request=request)
    return chosen
