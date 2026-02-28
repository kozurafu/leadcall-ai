# n8n Workflow Mapping — LeadCall AI

App Reference ID: `2e950173-09ba-49f6-bcbf-a1240f20c0ee`

## Overview

LeadCall AI uses a single n8n webhook URL (`N8N_DEMO_WEBHOOK`) for two events:
1. **New lead submitted** — forward lead data, optionally send confirmation email
2. **Call completed** — receive call summary + transcript, send summary email to lead

The `event` field in the payload distinguishes these two cases.

---

## Webhook 1 — New Lead Submitted

**Triggered by:** `POST /api/demo/submit`

### Payload

```json
{
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-25T10:30:00.000Z",
  "name": "Jane Smith",
  "phone": "+353 1 234 5678",
  "email": "jane@acme.com",
  "companyName": "Acme Ltd",
  "consent": true,
  "source": "leadcall-ai-demo"
}
```

> Note: `event` field is absent for new leads. Use a Switch node to route by presence of `event`.

### Suggested n8n Nodes (New Lead)

```
[Webhook Trigger]
  → [Switch: has "event" field?]
      → NO: new lead branch
          → [Send Email (confirmation to lead)]
          → [Add to Google Sheets / CRM (optional)]
      → YES: call completed branch (see below)
```

---

## Webhook 2 — Call Completed

**Triggered by:** `POST /api/webhooks/vapi` (forwarded to n8n)

### Payload (updated 2026-02-28)

n8n now owns the email template. The webhook sends raw data — n8n builds the HTML and sends via SMTP.

```json
{
  "event": "call_completed",
  "callId": "vapi-call-id-xyz",
  "leadId": "550e8400-e29b-41d4-a716-446655440000",
  "to": "jane@acme.com",
  "customerName": "Jane Smith",
  "companyName": "Acme Ltd",
  "phone": "+353 1 234 5678",
  "summary": "Jane expressed strong interest in solar panels and battery storage...",
  "transcript": "AI: Hi Jane...\nUser: Oh hi, yes...",
  "structuredData": {
    "business_type": "Retail",
    "wants_follow_up": true,
    "follow_up_time_preference": "Thursday 2pm",
    "qualification_score": 8,
    "pain_points": "Missing inbound calls",
    "recommended_next_step": "Book demo"
  },
  "duration": 185,
  "endedReason": "assistant-ended-call"
}
```

### Suggested n8n Nodes (Call Completed)

```
[Switch: event === "call_completed"]
  → [Send Email node]
      To: {{ $json.email }}
      Subject: Your LeadCall AI demo call summary
      Body (HTML):
        Hi {{ $json.customerName }},

        Thank you for speaking with our AI assistant today.

        Call Summary:
        {{ $json.summary }}

        What we noted:
        - Solar Panels: {{ $json.qualificationOutcomes.solarPanels }}
        - Battery Storage: {{ $json.qualificationOutcomes.batteryStorage }}
        - EDDI Diverter: {{ $json.qualificationOutcomes.eddiDiverter }}
        - EV Charger: {{ $json.qualificationOutcomes.evCharger }}

        We'll be in touch shortly to discuss next steps.

        — LeadCall AI Team
  → [Append to Google Sheets (optional)]
  → [Slack notification (optional)]
```

---

## Qualification Goals Reference

The Vapi call is configured with these qualification goals in metadata:

```json
{
  "qualificationGoals": [
    "solar_panels",
    "battery_storage",
    "eddi_diverter",
    "ev_charger"
  ]
}
```

Map these to your n8n workflow fields as needed.

---

## Testing the Webhook

### Simulate a new lead:

```bash
curl -X POST https://your-n8n.example.com/webhook/leadcall-demo \
  -H "Content-Type: application/json" \
  -d '{
    "leadId": "test-001",
    "timestamp": "2026-02-25T10:00:00.000Z",
    "name": "Test User",
    "phone": "+353 1 234 5678",
    "email": "test@example.com",
    "companyName": "Test Co",
    "consent": true,
    "source": "leadcall-ai-demo"
  }'
```

### Simulate a call completed event:

```bash
curl -X POST https://your-n8n.example.com/webhook/leadcall-demo \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_completed",
    "callId": "vapi-test-001",
    "leadId": "test-001",
    "email": "test@example.com",
    "customerName": "Test User",
    "companyName": "Test Co",
    "summary": "Test call summary.",
    "qualificationOutcomes": {}
  }'
```
