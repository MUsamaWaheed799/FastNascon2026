"""Celery tasks for lead acknowledgement / escalation (F3.4 / F3.5 / F3.7)."""
import logging

from celery import shared_task

from .escalation import escalate_lead, process_overdue_leads

logger = logging.getLogger(__name__)


@shared_task(name="api.scan_unacknowledged_leads", ignore_result=True)
def scan_unacknowledged_leads():
    """
    Periodic sweep (Celery beat, every minute -- see CELERY_BEAT_SCHEDULE).

    Finds leads still unacknowledged after their workspace's window and
    escalates them / moves them to the Recovery Queue. Idempotent: overlapping
    runs are harmless because each lead is row-locked and re-checked.
    """
    stats = process_overdue_leads()
    if any(stats.values()):
        logger.info("Lead escalation sweep: %s", stats)
    return stats


@shared_task(name="api.escalate_lead", ignore_result=True)
def escalate_lead_task(opportunity_id):
    """Escalate a single lead on demand (e.g. from an admin action)."""
    return escalate_lead(opportunity_id)


@shared_task(name="api.send_escalation_alert", ignore_result=True)
def send_escalation_alert_task(opportunity_id, user_id, escalation_count):
    """Deliver the Slack / Telegram / email alert off the request path."""
    from .alerts import send_escalation_alert
    from .models import Opportunity, User

    opp = Opportunity.objects.filter(pk=opportunity_id).first()
    user = User.objects.filter(pk=user_id, is_active=True).first()
    if opp is None or user is None:
        return {}
    return send_escalation_alert(user, opp, escalation_count)
