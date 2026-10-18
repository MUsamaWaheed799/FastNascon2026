"""Webhook + alert tests. Run: python manage.py test api.test_webhooks"""
import hashlib
import hmac
import json
import time
from decimal import Decimal
from unittest import mock

from django.core import mail
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from .alerts import send_escalation_alert
from .models import (
    Contact, Conversation, Message, Opportunity, Payment, User, WebhookEvent, Workspace,
)
from .webhooks import twilio_signature, verify_stripe_signature

TWILIO_URL = "https://example.ngrok.app/api/webhooks/twilio/"
TOKEN = "twilio-secret"
WHSEC = "whsec_test"


class TwilioSignatureVector(TestCase):
    def test_matches_twilio_documented_example(self):
        from django.http import QueryDict
        q = QueryDict("", mutable=True)
        for k, v in {"CallSid": "CA1234567890ABCDE", "Caller": "+14158675310", "Digits": "1234",
                     "From": "+14158675310", "To": "+18005551212"}.items():
            q[k] = v
        sig = twilio_signature("https://mycompany.com/myapp.php?foo=1&bar=2", q, "12345")
        self.assertEqual(sig, "GvWf1cFY/Q7PnoempGyD5oXAezc=")


@override_settings(TWILIO_AUTH_TOKEN=TOKEN, TWILIO_WEBHOOK_URL=TWILIO_URL, TWILIO_DEFAULT_WORKSPACE_SLUG="")
class TwilioWebhookTests(TestCase):
    def setUp(self):
        self.ws = Workspace.objects.create(name="A", slug="a", whatsapp_number="whatsapp:+1 415 523 8886")
        self.agent = User.objects.create(username="agent", workspace=self.ws)
        self.client = Client()

    def post(self, data, *, sign=True, token=TOKEN):
        from django.http import QueryDict
        q = QueryDict("", mutable=True)
        for k, v in data.items():
            q[k] = v
        sig = twilio_signature(TWILIO_URL, q, token) if sign else "bogus"
        return self.client.post("/api/webhooks/twilio/", data, HTTP_X_TWILIO_SIGNATURE=sig)

    def msg(self, **kw):
        base = {"MessageSid": "SM1", "From": "whatsapp:+923001234567", "To": "whatsapp:+14155238886",
                "Body": "Hi, pricing?", "ProfileName": "Ali Khan", "NumMedia": "0"}
        return {**base, **kw}

    def test_workspace_number_is_normalised(self):
        self.assertEqual(self.ws.whatsapp_number, "+14155238886")

    def test_bad_or_missing_signature_rejected_and_nothing_saved(self):
        self.assertEqual(self.post(self.msg(), sign=False).status_code, 403)
        self.assertEqual(self.post(self.msg(), token="wrong").status_code, 403)
        self.assertEqual(self.client.post("/api/webhooks/twilio/", self.msg()).status_code, 403)
        self.assertFalse(Message.objects.exists() or Contact.objects.exists())

    def test_get_not_allowed_and_unconfigured_refuses(self):
        self.assertEqual(self.client.get("/api/webhooks/twilio/").status_code, 405)
        with override_settings(TWILIO_AUTH_TOKEN=""):
            self.assertEqual(self.post(self.msg()).status_code, 503)

    def test_unknown_number_creates_contact_lead_assigned_conversation_message(self):
        r = self.post(self.msg(NumMedia="1", MediaUrl0="https://api.twilio.com/m/1", MediaContentType0="image/jpeg"))
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r["Content-Type"], "text/xml")
        c = Contact.objects.get()
        self.assertEqual((c.first_name, c.phone, c.workspace), ("Ali Khan", "+923001234567", self.ws))
        lead = Opportunity.objects.get()
        self.assertEqual((lead.contact, lead.stage, lead.owner), (c, "lead", self.agent))
        self.assertIsNotNone(lead.assigned_at)  # acknowledgement timer running
        m = Message.objects.get()
        self.assertEqual((m.direction, m.body, m.external_id), ("in", "Hi, pricing?", "SM1"))
        self.assertEqual(m.media, [{"url": "https://api.twilio.com/m/1", "content_type": "image/jpeg"}])
        self.assertEqual(m.conversation.contact, c)

    def test_known_number_reuses_contact_no_new_lead(self):
        self.post(self.msg())
        self.post(self.msg(MessageSid="SM2", Body="second"))
        self.assertEqual((Contact.objects.count(), Opportunity.objects.count(), Conversation.objects.count()), (1, 1, 1))
        self.assertEqual(Message.objects.count(), 2)

    def test_matches_existing_contact_with_differently_formatted_phone(self):
        existing = Contact.objects.create(workspace=self.ws, first_name="Old", phone="0300-1234567")
        self.post(self.msg())
        self.assertEqual(Contact.objects.count(), 1)
        self.assertEqual(Message.objects.get().conversation.contact, existing)
        self.assertFalse(Opportunity.objects.exists())  # existing contact: no auto-lead

    def test_other_workspace_contact_never_matched(self):
        other = Workspace.objects.create(name="B", slug="b")
        Contact.objects.create(workspace=other, first_name="Theirs", phone="+923001234567")
        self.post(self.msg())
        self.assertEqual(Contact.objects.filter(workspace=self.ws).count(), 1)
        self.assertEqual(Message.objects.get().workspace, self.ws)

    def test_replayed_message_sid_is_idempotent(self):
        for _ in range(3):
            self.assertEqual(self.post(self.msg()).status_code, 200)
        self.assertEqual((Message.objects.count(), Contact.objects.count(), Opportunity.objects.count()), (1, 1, 1))

    def test_non_whatsapp_ignored(self):
        self.assertEqual(self.post(self.msg(From="+923001234567")).status_code, 200)
        self.assertFalse(Message.objects.exists())

    def test_default_workspace_fallback_and_no_workspace(self):
        data = self.msg(To="whatsapp:+10000000000")
        self.post(data)
        self.assertFalse(Message.objects.exists())  # unroutable -> 200 but nothing saved
        with override_settings(TWILIO_DEFAULT_WORKSPACE_SLUG="a"):
            self.post(data)
        self.assertEqual(Message.objects.get().workspace, self.ws)


def stripe_event(event_id="evt_1", etype="checkout.session.completed", session_id="cs_1", opp=None,
                 amount=5000, currency="usd", payment_status="paid", meta=True, created=None):
    session = {"id": session_id, "payment_status": payment_status, "amount_total": amount,
               "currency": currency, "payment_intent": "pi_1",
               "client_reference_id": str(opp.pk) if opp else None,
               "metadata": {"opportunity_id": str(opp.pk)} if (opp and meta) else {}}
    return {"id": event_id, "type": etype, "created": created or int(time.time()), "data": {"object": session}}


@override_settings(STRIPE_WEBHOOK_SECRET=WHSEC)
class StripeWebhookTests(TestCase):
    def setUp(self):
        self.ws = Workspace.objects.create(name="A", slug="a")
        c = Contact.objects.create(workspace=self.ws, first_name="X")
        self.opp = Opportunity.objects.create(workspace=self.ws, contact=c, name="Deal", value=Decimal("100.00"))
        self.client = Client()

    def send(self, event, *, secret=WHSEC, ts=None):
        payload = json.dumps(event).encode()
        ts = ts or int(time.time())
        sig = hmac.new(secret.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
        return self.client.post("/api/webhooks/stripe/", payload, content_type="application/json",
                                HTTP_STRIPE_SIGNATURE=f"t={ts},v1={sig}")

    def refresh(self):
        self.opp.refresh_from_db(); return self.opp

    def test_signature_checks(self):
        body = b'{"a":1}'; ts = int(time.time())
        good = hmac.new(b"s", f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
        self.assertTrue(verify_stripe_signature(body, f"t={ts},v1={good}", "s"))
        self.assertTrue(verify_stripe_signature(body, f"t={ts},v1=dead,v1={good}", "s"))  # rotated secrets
        self.assertFalse(verify_stripe_signature(body, f"t={ts},v1={good}", "other"))
        self.assertFalse(verify_stripe_signature(b'{"a":2}', f"t={ts},v1={good}", "s"))  # tampered
        self.assertFalse(verify_stripe_signature(body, f"t={ts - 1000},v1={good}", "s", now=ts))  # replay
        self.assertFalse(verify_stripe_signature(body, "garbage", "s"))
        self.assertFalse(verify_stripe_signature(body, "", "s"))

    def test_bad_signature_400_and_nothing_changes(self):
        r = self.send(stripe_event(opp=self.opp), secret="wrong")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(self.client.post("/api/webhooks/stripe/", b"{}", content_type="application/json").status_code, 400)
        self.assertEqual(self.refresh().payment_status, "unpaid")

    def test_unconfigured_secret_refuses(self):
        with override_settings(STRIPE_WEBHOOK_SECRET=""):
            self.assertEqual(self.send(stripe_event(opp=self.opp)).status_code, 503)

    def test_paid_full_updates_opportunity(self):
        r = self.send(stripe_event(opp=self.opp, amount=10000))
        self.assertEqual((r.status_code, r.json()["status"]), (200, "paid"))
        o = self.refresh()
        self.assertEqual((o.payment_status, o.amount_collected), ("paid", Decimal("100.00")))
        self.assertIsNotNone(o.last_paid_at)
        self.assertEqual(Payment.objects.get().stripe_session_id, "cs_1")

    def test_partial_payment_then_second_session_completes(self):
        self.send(stripe_event(opp=self.opp, amount=4000))
        self.assertEqual((self.refresh().payment_status, self.opp.amount_collected), ("partial", Decimal("40.00")))
        self.send(stripe_event(event_id="evt_2", session_id="cs_2", opp=self.opp, amount=6000))
        self.assertEqual((self.refresh().payment_status, self.opp.amount_collected), ("paid", Decimal("100.00")))

    def test_duplicate_event_is_idempotent(self):
        ev = stripe_event(opp=self.opp, amount=10000)
        self.assertEqual(self.send(ev).json()["status"], "paid")
        for _ in range(3):
            self.assertEqual(self.send(ev).json()["status"], "duplicate")
        self.assertEqual((self.refresh().amount_collected, Payment.objects.count(), WebhookEvent.objects.count()),
                         (Decimal("100.00"), 1, 1))

    def test_same_session_different_event_does_not_double_count(self):
        self.send(stripe_event(opp=self.opp, amount=10000))
        self.send(stripe_event(event_id="evt_other", etype="checkout.session.async_payment_succeeded", opp=self.opp, amount=10000))
        self.assertEqual((self.refresh().amount_collected, Payment.objects.count()), (Decimal("100.00"), 1))

    def test_delayed_payment_pending_then_succeeded_then_failed_cannot_unpay(self):
        self.send(stripe_event(opp=self.opp, amount=10000, payment_status="unpaid"))
        self.assertEqual((self.refresh().payment_status, self.opp.amount_collected), ("pending", 0))
        self.send(stripe_event(event_id="evt_2", etype="checkout.session.async_payment_succeeded", opp=self.opp, amount=10000))
        self.assertEqual(self.refresh().payment_status, "paid")
        self.send(stripe_event(event_id="evt_3", etype="checkout.session.async_payment_failed", opp=self.opp, amount=10000))
        self.assertEqual((self.refresh().payment_status, self.opp.amount_collected), ("paid", Decimal("100.00")))

    def test_async_failure(self):
        self.send(stripe_event(opp=self.opp, payment_status="unpaid"))
        self.send(stripe_event(event_id="evt_2", etype="checkout.session.async_payment_failed", opp=self.opp))
        self.assertEqual(self.refresh().payment_status, "failed")

    def test_client_reference_id_fallback_and_zero_decimal(self):
        self.opp.currency = "JPY"; self.opp.value = Decimal("5000"); self.opp.save()
        self.send(stripe_event(opp=self.opp, amount=5000, currency="jpy", meta=False))
        self.assertEqual((self.refresh().amount_collected, self.opp.payment_status), (Decimal("5000"), "paid"))

    def test_currency_mismatch_not_counted_as_revenue(self):
        self.send(stripe_event(opp=self.opp, amount=10000, currency="eur"))
        self.assertEqual(self.refresh().amount_collected, 0)

    def test_unknown_opportunity_and_unhandled_type_return_200(self):
        ghost = mock.Mock(pk="3c0c4a3e-0000-4000-8000-000000000000")
        self.assertEqual(self.send(stripe_event(opp=ghost)).json()["status"], "ignored")
        r = self.send({"id": "evt_x", "type": "customer.created", "data": {"object": {}}})
        self.assertEqual((r.status_code, r.json()["status"]), (200, "ignored"))

    def test_malformed_json_400(self):
        payload = b"not json"; ts = int(time.time())
        sig = hmac.new(WHSEC.encode(), f"{ts}.".encode() + payload, hashlib.sha256).hexdigest()
        r = self.client.post("/api/webhooks/stripe/", payload, content_type="application/json",
                             HTTP_STRIPE_SIGNATURE=f"t={ts},v1={sig}")
        self.assertEqual(r.status_code, 400)


@override_settings(SLACK_WEBHOOK_URL="https://hooks.slack.test/T/B/x", TELEGRAM_BOT_TOKEN="123:abc",
                   EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", FRONTEND_BASE_URL="https://crm.test")
class EscalationAlertTests(TestCase):
    def setUp(self):
        self.ws = Workspace.objects.create(name="A", slug="a")
        self.user = User.objects.create(username="u", workspace=self.ws, email="u@x.com",
                                        telegram_chat_id="999", slack_user_id="U123")
        c = Contact.objects.create(workspace=self.ws, first_name="X")
        self.opp = Opportunity.objects.create(workspace=self.ws, contact=c, name="Big deal")

    def test_all_channels_fire(self):
        sent = []
        class R:  # minimal urlopen context manager
            status = 200
            def __enter__(s): return s
            def __exit__(s, *a): return False
        def fake(req, timeout): sent.append((req.full_url, json.loads(req.data))); return R()
        with mock.patch("urllib.request.urlopen", fake):
            res = send_escalation_alert(self.user, self.opp, 2)
        self.assertEqual(res, {"slack": True, "telegram": True, "email": True})
        slack, tg = sent
        self.assertIn("<@U123>", slack[1]["text"]); self.assertIn("Big deal", slack[1]["text"])
        self.assertEqual((tg[0], tg[1]["chat_id"]), ("https://api.telegram.org/bot123:abc/sendMessage", "999"))
        self.assertEqual(mail.outbox[0].to, ["u@x.com"])
        self.assertIn(f"https://crm.test/opportunities/{self.opp.pk}", mail.outbox[0].body)

    def test_one_failing_channel_does_not_block_others(self):
        with mock.patch("urllib.request.urlopen", side_effect=OSError("down")):
            res = send_escalation_alert(self.user, self.opp, 1)
        self.assertEqual(res, {"slack": False, "telegram": False, "email": True})

    def test_nothing_configured_for_user_is_a_noop(self):
        u = User.objects.create(username="bare", workspace=self.ws)
        with override_settings(SLACK_WEBHOOK_URL="", TELEGRAM_BOT_TOKEN=""):
            self.assertEqual(send_escalation_alert(u, self.opp, 1), {})
