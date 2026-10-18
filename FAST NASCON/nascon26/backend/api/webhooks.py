"""
Third-party webhooks (plain Django views: no DRF auth, no CSRF -- the request
signature IS the authentication).

    POST /api/webhooks/twilio/   Twilio WhatsApp (sandbox) inbound messages
    POST /api/webhooks/stripe/   Stripe Checkout payment events (test mode)

Security rules shared by both:
  * the signing secret must be configured, otherwise the endpoint refuses
    traffic (503) instead of silently accepting unsigned requests;
  * signatures are checked in constant time BEFORE any parsing or DB access;
  * both are idempotent -- providers retry, so replays must be harmless.

Settings used (see core/settings_additions.py):
  TWILIO_AUTH_TOKEN, TWILIO_WEBHOOK_URL (public URL, needed behind ngrok/proxy),
  TWILIO_DEFAULT_WORKSPACE_SLUG, STRIPE_WEBHOOK_SECRET
"""
import base64
import hashlib
import hmac
import json
import logging
import re
import time
import uuid
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .assignment import assign_lead
from .models import (
    AuditLog, Contact, Conversation, Message, Opportunity, Payment, WebhookEvent,
    Workspace, snapshot_instance,
)

logger = logging.getLogger(__name__)


# ==========================================================================
# Twilio WhatsApp
# ==========================================================================
def twilio_signature(url, params, auth_token):
    """Twilio's scheme: HMAC-SHA1(token, url + each POST param as key+value, keys sorted), base64."""
    data = url
    for key in sorted(params.keys()):
        for value in sorted(params.getlist(key)):
            data += key + value
    digest = hmac.new(auth_token.encode(), data.encode(), hashlib.sha1).digest()
    return base64.b64encode(digest).decode()


def _digits(value):
    return re.sub(r"\D", "", value or "")


def _strip_whatsapp_prefix(value):
    return (value or "").removeprefix("whatsapp:")


def _workspace_for_number(to_number):
    """Route by the Twilio number that received the message; fall back to the default workspace."""
    digits = _digits(_strip_whatsapp_prefix(to_number))
    if digits:
        ws = Workspace.objects.filter(is_active=True, whatsapp_number=f"+{digits}").first()
        if ws:
            return ws
    slug = getattr(settings, "TWILIO_DEFAULT_WORKSPACE_SLUG", "")
    if slug:
        return Workspace.objects.filter(is_active=True, slug=slug).first()
    return None


def find_contact_by_phone(workspace_id, phone):
    """
    Match a phone to an existing Contact in this workspace.
    Exact digits first, then the last 10 digits (so "0300 1234567" matches "+92 300 1234567").
    Oldest contact wins if several match.
    """
    digits = _digits(phone)
    if not digits:
        return None
    base = Contact.objects.filter(workspace_id=workspace_id).order_by("created_at")
    exact = base.filter(phone_normalized=digits).first()
    if exact or len(digits) < 10:
        return exact
    return base.filter(phone_normalized__endswith=digits[-10:]).first()


def ingest_whatsapp_message(workspace, from_number, profile_name, body, media, message_sid, sent_at=None):
    """
    Save one inbound WhatsApp message, creating Contact + lead for unknown numbers.
    Returns (message, new_lead_created); message is None if this sid was already stored.
    """
    phone = f"+{_digits(from_number)}"
    with transaction.atomic():
        # Serialise ingestion per workspace so two first messages from one new
        # number can't create two contacts (row lock; no-op on SQLite).
        Workspace.objects.select_for_update().only("pk").get(pk=workspace.pk)

        if message_sid and Message.objects.filter(workspace=workspace, external_id=message_sid).exists():
            return None, False

        contact = find_contact_by_phone(workspace.pk, phone)
        new_lead = contact is None
        if new_lead:
            name = (profile_name or "").strip()[:120] or phone
            contact = Contact.objects.create(workspace=workspace, first_name=name, phone=phone)
            lead = Opportunity.objects.create(
                workspace=workspace, contact=contact, name=f"WhatsApp lead: {name}"[:255],
                stage=Opportunity.Stage.LEAD,
            )
            for obj in (contact, lead):
                AuditLog.record(
                    workspace_id=workspace.pk, actor=None, action=AuditLog.Action.CREATE,
                    target=obj, after={**snapshot_instance(obj), "source": "whatsapp_webhook"},
                )
            assign_lead(lead)  # round-robin + starts the acknowledgement timer

        conversation, _ = Conversation.objects.get_or_create(
            workspace=workspace, contact=contact, channel=Conversation.Channel.WHATSAPP
        )
        sent_at = sent_at or timezone.now()
        message = Message.objects.create(
            workspace=workspace, conversation=conversation, direction=Message.Direction.INBOUND,
            body=body, media=media, external_id=message_sid or "", sent_at=sent_at,
        )
        Conversation.objects.filter(pk=conversation.pk).update(last_message_at=sent_at)
    return message, new_lead


@csrf_exempt
@require_POST
def twilio_webhook(request):
    token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
    if not token:
        logger.error("Twilio webhook hit but TWILIO_AUTH_TOKEN is not configured")
        return HttpResponse("Webhook not configured", status=503)

    # Twilio signs the exact public URL it called; behind ngrok/a proxy Django
    # can't know that, so allow pinning it.
    url = getattr(settings, "TWILIO_WEBHOOK_URL", "") or request.build_absolute_uri()
    expected = twilio_signature(url, request.POST, token)
    if not hmac.compare_digest(expected, request.headers.get("X-Twilio-Signature", "")):
        logger.warning("Rejected Twilio webhook with bad signature")
        return HttpResponse("Invalid signature", status=403)

    empty_twiml = HttpResponse("<Response></Response>", content_type="text/xml")
    form = request.POST

    from_number = form.get("From", "")
    if not from_number.startswith("whatsapp:"):
        return empty_twiml  # plain SMS etc. -- not handled here

    workspace = _workspace_for_number(form.get("To", ""))
    if workspace is None:
        logger.error("No workspace for WhatsApp number %r (set Workspace.whatsapp_number "
                     "or TWILIO_DEFAULT_WORKSPACE_SLUG)", form.get("To"))
        return empty_twiml  # 200 so Twilio doesn't retry a config problem forever

    media = []
    for i in range(int(form.get("NumMedia", "0") or 0)):
        if form.get(f"MediaUrl{i}"):
            media.append({"url": form[f"MediaUrl{i}"], "content_type": form.get(f"MediaContentType{i}", "")})

    sid = form.get("MessageSid", "")
    try:
        ingest_whatsapp_message(
            workspace, _strip_whatsapp_prefix(from_number), form.get("ProfileName", ""),
            form.get("Body", ""), media, sid,
        )
    except IntegrityError:
        # A concurrent retry of the same MessageSid won the race => duplicate, fine.
        if not (sid and Message.objects.filter(workspace=workspace, external_id=sid).exists()):
            raise
    return empty_twiml


# ==========================================================================
# Stripe
# ==========================================================================
STRIPE_TOLERANCE_SECONDS = 300
STRIPE_HANDLED_EVENTS = {
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
    "checkout.session.async_payment_failed",
}
# Currencies Stripe expresses without minor units (amount_total is already whole units).
ZERO_DECIMAL_CURRENCIES = {
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf",
    "ugx", "vnd", "vuv", "xaf", "xof", "xpf",
}


def verify_stripe_signature(payload, header, secret, *, now=None, tolerance=STRIPE_TOLERANCE_SECONDS):
    """
    Stripe scheme: header "t=<unix>,v1=<hex>[,v1=<hex>...]"; v1 = HMAC-SHA256(secret, f"{t}.{payload}").
    Rejects timestamps outside `tolerance` to stop replays of captured requests.
    """
    pairs = [p.split("=", 1) for p in (header or "").split(",") if "=" in p]
    timestamps = [v for k, v in pairs if k.strip() == "t"]
    signatures = [v for k, v in pairs if k.strip() == "v1"]
    if not timestamps or not signatures:
        return False
    try:
        ts = int(timestamps[0])
    except ValueError:
        return False
    if abs((now if now is not None else time.time()) - ts) > tolerance:
        return False
    expected = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
    return any(hmac.compare_digest(expected, sig) for sig in signatures)


def _money(amount_minor, currency):
    amount_minor = Decimal(amount_minor or 0)
    if (currency or "").lower() in ZERO_DECIMAL_CURRENCIES:
        return amount_minor
    return amount_minor / 100


def _payment_status_for(event_type, session):
    if event_type == "checkout.session.async_payment_succeeded":
        return Payment.Status.PAID
    if event_type == "checkout.session.async_payment_failed":
        return Payment.Status.FAILED
    # checkout.session.completed: delayed methods (e.g. bank debit) arrive "unpaid"
    if session.get("payment_status") in ("paid", "no_payment_required"):
        return Payment.Status.PAID
    return Payment.Status.PENDING


def refresh_opportunity_payments(opp):
    """Recompute payment_status / amount_collected from Payment rows (source of truth)."""
    payments = list(opp.payments.all())
    collected = sum(
        (p.amount for p in payments
         if p.status == Payment.Status.PAID and p.currency.upper() == (opp.currency or "").upper()),
        Decimal("0"),
    )
    paid_times = [p.paid_at for p in payments if p.status == Payment.Status.PAID and p.paid_at]

    if collected > 0 and opp.value and collected < opp.value:
        status = Opportunity.PaymentStatus.PARTIAL
    elif collected > 0 or any(p.status == Payment.Status.PAID for p in payments):
        status = Opportunity.PaymentStatus.PAID
    elif any(p.status == Payment.Status.PENDING for p in payments):
        status = Opportunity.PaymentStatus.PENDING
    elif any(p.status == Payment.Status.FAILED for p in payments):
        status = Opportunity.PaymentStatus.FAILED
    else:
        status = Opportunity.PaymentStatus.UNPAID

    before = {"payment_status": opp.payment_status, "amount_collected": str(opp.amount_collected)}
    opp.payment_status = status
    opp.amount_collected = collected
    opp.last_paid_at = max(paid_times) if paid_times else None
    opp.save(update_fields=["payment_status", "amount_collected", "last_paid_at", "updated_at"])
    after = {"payment_status": status, "amount_collected": str(collected)}
    if before != after:
        AuditLog.record(
            workspace_id=opp.workspace_id, actor=None, action=AuditLog.Action.UPDATE,
            target=opp, before=before, after={**after, "source": "stripe_webhook"},
        )


def _apply_checkout_event(event):
    """Apply one checkout event to its Opportunity. Caller wraps this in a transaction."""
    event_type = event["type"]
    session = event["data"]["object"]
    meta = session.get("metadata") or {}
    raw_id = meta.get("opportunity_id") or session.get("client_reference_id") or ""
    try:
        opp_id = uuid.UUID(raw_id)
    except ValueError:
        logger.warning("Stripe event %s has no valid opportunity id (%r)", event["id"], raw_id)
        return "ignored"

    # Lock the opportunity so concurrent events for it apply one at a time.
    opp = Opportunity.objects.select_for_update(of=("self",)).filter(pk=opp_id).first()
    if opp is None:
        logger.warning("Stripe event %s references unknown opportunity %s", event["id"], opp_id)
        return "ignored"
    if meta.get("workspace_id") and meta["workspace_id"] != str(opp.workspace_id):
        logger.warning("Stripe event %s workspace mismatch for opportunity %s", event["id"], opp_id)
        return "ignored"

    status = _payment_status_for(event_type, session)
    currency = (session.get("currency") or opp.currency or "usd").upper()[:3]
    amount = _money(session.get("amount_total"), currency)
    paid_at = datetime.fromtimestamp(event.get("created") or time.time(), tz=dt_timezone.utc)

    payment = Payment.objects.filter(workspace_id=opp.workspace_id, stripe_session_id=session["id"]).first()
    if payment is None:
        Payment.objects.create(
            workspace_id=opp.workspace_id, opportunity=opp, stripe_session_id=session["id"],
            stripe_payment_intent=session.get("payment_intent") or "", amount=amount,
            currency=currency, status=status,
            paid_at=paid_at if status == Payment.Status.PAID else None,
        )
    elif payment.status != Payment.Status.PAID:  # events can arrive out of order: never un-pay
        payment.status = status
        payment.amount = amount
        payment.currency = currency
        payment.stripe_payment_intent = session.get("payment_intent") or payment.stripe_payment_intent
        if status == Payment.Status.PAID:
            payment.paid_at = paid_at
        payment.save()

    refresh_opportunity_payments(opp)
    return status


@csrf_exempt
@require_POST
def stripe_webhook(request):
    secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")
    if not secret:
        logger.error("Stripe webhook hit but STRIPE_WEBHOOK_SECRET is not configured")
        return JsonResponse({"error": "webhook not configured"}, status=503)

    payload = request.body  # raw bytes: the signature covers them exactly
    if not verify_stripe_signature(payload, request.headers.get("Stripe-Signature", ""), secret):
        logger.warning("Rejected Stripe webhook with bad signature")
        return JsonResponse({"error": "invalid signature"}, status=400)

    try:
        event = json.loads(payload)
        event_id, event_type = event["id"], event["type"]
    except (ValueError, KeyError, TypeError):
        return JsonResponse({"error": "invalid payload"}, status=400)

    if event_type not in STRIPE_HANDLED_EVENTS:
        return JsonResponse({"status": "ignored"})  # 2xx so Stripe stops retrying it

    with transaction.atomic():
        # Idempotency: the unique (provider, event_id) row is written in the SAME
        # transaction as the business update. A replay finds it and does nothing;
        # if processing fails, the row rolls back and Stripe's retry reprocesses.
        _, created = WebhookEvent.objects.get_or_create(
            provider="stripe", event_id=event_id, defaults={"event_type": event_type}
        )
        if not created:
            return JsonResponse({"status": "duplicate"})
        result = _apply_checkout_event(event)
    return JsonResponse({"status": result})
