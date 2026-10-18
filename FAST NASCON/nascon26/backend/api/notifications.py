"""
Notification triggers for escalation events.

The receivers below write in-app Notification rows. To add email / Slack /
webhooks, add another receiver on the same signals (or call a Celery task from
these) -- nothing else needs to change.
"""
import logging

from django.dispatch import receiver

from .escalation import lead_escalated, lead_moved_to_recovery
from .models import Notification, User
from .tasks import send_escalation_alert_task

logger = logging.getLogger(__name__)


def _notify(opportunity, recipient, kind, message):
    Notification.objects.create(
        workspace_id=opportunity.workspace_id,
        recipient=recipient,
        opportunity=opportunity,
        kind=kind,
        message=message[:255],
    )


@receiver(lead_escalated)
def notify_on_escalation(sender, opportunity, from_user, to_user, escalation_count, **kwargs):
    _notify(
        opportunity, to_user, Notification.Kind.LEAD_ESCALATED_TO_YOU,
        f'Lead "{opportunity.name}" was escalated to you (escalation #{escalation_count}). '
        "Please acknowledge it.",
    )
    if from_user is not None:
        _notify(
            opportunity, from_user, Notification.Kind.LEAD_REASSIGNED_AWAY,
            f'Lead "{opportunity.name}" was reassigned because it was not acknowledged in time.',
        )


@receiver(lead_moved_to_recovery)
def notify_on_recovery(sender, opportunity, from_user, reason, **kwargs):
    label = opportunity.get_recovery_reason_display()
    managers = User.objects.filter(
        workspace_id=opportunity.workspace_id,
        is_active=True,
        role__in=[User.Role.OWNER, User.Role.ADMIN],
    )
    for manager in managers:
        _notify(
            opportunity, manager, Notification.Kind.LEAD_IN_RECOVERY,
            f'Lead "{opportunity.name}" moved to the Recovery Queue: {label}.',
        )
    if from_user is not None:
        _notify(
            opportunity, from_user, Notification.Kind.LEAD_REASSIGNED_AWAY,
            f'Lead "{opportunity.name}" was taken from you and moved to the Recovery Queue.',
        )


@receiver(lead_escalated)
def alert_externally_on_escalation(sender, opportunity, to_user, escalation_count, **kwargs):
    """Slack / Telegram / email to the NEW owner, sent by a Celery task."""
    try:
        send_escalation_alert_task.delay(str(opportunity.pk), to_user.pk, escalation_count)
    except Exception:  # noqa: BLE001 - e.g. broker down; the in-app Notification still exists
        logger.exception("Could not queue external escalation alert for %s", opportunity.pk)
