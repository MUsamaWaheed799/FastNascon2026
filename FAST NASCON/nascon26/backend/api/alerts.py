"""
External escalation alerts: Slack incoming webhook, Telegram bot, and email.

send_escalation_alert() tries every channel that is configured for the user and
never raises: one dead channel must not block the others (or the escalation
sweep). It returns {"slack": True/False, "telegram": ..., "email": ...} for the
channels it attempted.

Config (settings / env):
  SLACK_WEBHOOK_URL      Slack "Incoming Webhook" URL (posts to its channel; the
                         user is @mentioned if User.slack_user_id is set)
  TELEGRAM_BOT_TOKEN     bot token; needs User.telegram_chat_id (user must have
                         pressed Start on the bot first)
  EMAIL_*, DEFAULT_FROM_EMAIL   standard Django email; uses User.email
  FRONTEND_BASE_URL      optional, adds a deep link to the lead
"""
import json
import logging
import urllib.request

from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)
HTTP_TIMEOUT = 5  # seconds; alerts must never hang the worker


def _post_json(url, payload):
    req = urllib.request.Request(
        url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
        if not 200 <= resp.status < 300:
            raise RuntimeError(f"HTTP {resp.status}")


def build_alert_text(user, opportunity, escalation_count):
    text = (
        f'Lead "{opportunity.name}" was escalated to you (escalation #{escalation_count}) '
        "because it was not acknowledged in time. Please acknowledge it now."
    )
    base = getattr(settings, "FRONTEND_BASE_URL", "")
    if base:
        text += f"\n{base.rstrip('/')}/opportunities/{opportunity.pk}"
    return text


def send_escalation_alert(user, opportunity, escalation_count):
    text = build_alert_text(user, opportunity, escalation_count)
    results = {}

    slack_url = getattr(settings, "SLACK_WEBHOOK_URL", "")
    if slack_url:
        mention = f"<@{user.slack_user_id}> " if user.slack_user_id else f"{user.get_username()}: "
        results["slack"] = _attempt("slack", lambda: _post_json(slack_url, {"text": mention + text}))

    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    if bot_token and user.telegram_chat_id:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        results["telegram"] = _attempt(
            "telegram", lambda: _post_json(url, {"chat_id": user.telegram_chat_id, "text": text})
        )

    if user.email:
        results["email"] = _attempt(
            "email",
            lambda: send_mail(
                subject=f"Lead escalated to you: {opportunity.name}",
                message=text,
                from_email=None,  # DEFAULT_FROM_EMAIL
                recipient_list=[user.email],
                fail_silently=False,
            ),
        )
    return results


def _attempt(channel, fn):
    try:
        fn()
        return True
    except Exception:  # noqa: BLE001 - isolate channel failures; never log secrets/URLs
        logger.exception("Escalation alert via %s failed", channel)
        return False
