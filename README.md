# LeadCall AI

> AI-powered appointment setting and lead qualification — demo platform.
>
> App Reference ID: `2e950173-09ba-49f6-bcbf-a1240f20c0ee`

## What This Is

LeadCall AI is a production-ready demo showcasing an AI outbound calling service:

1. Prospect fills the landing page form.
2. The system stores the lead and optionally triggers a **Vapi** AI phone call within 60 seconds.
3. Vapi calls back with summary/transcript via webhook.
4. Summary is emailed to the lead via **n8n** (or SMTP fallback).
5. The `/demo/status` page shows all leads and call outcomes.

---

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS**
- **Vapi** — AI voice calling
- **n8n** — webhook orchestration + email delivery
- Local JSON storage (`data/leads.json`, `data/calls.json`)

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy and fill in environment variables
cp .env.example .env.local

# 3. Run in development
npm run dev
# App runs at http://localhost:3030
```

---

## Environment Variables

See `.env.example` for all required and optional variables.

| Variable | Required | Description |
|---|---|---|
| `N8N_DEMO_WEBHOOK` | Recommended | n8n webhook URL for lead + call summary delivery |
| `VAPI_API_KEY` | Optional | Enables live AI outbound calls |
| `VAPI_ASSISTANT_ID` | Optional | Your Vapi assistant ID |
| `VAPI_PHONE_NUMBER_ID` | Optional | Vapi phone number to call from |
| `VAPI_WEBHOOK_TOKEN` | Optional | Token to verify Vapi webhook callbacks |
| `SMTP_*` | Optional | SMTP fallback if n8n is not configured |

---

## Pages & Endpoints

| Route | Description |
|---|---|
| `/` | Landing page with demo form |
| `/demo/status` | Admin-lite view of leads + call outcomes |
| `POST /api/demo/submit` | Submit lead, trigger n8n + Vapi |
| `POST /api/webhooks/vapi` | Receive Vapi call outcomes |

---

## Build

```bash
npm run build
npm start
```

---

## Deployment

See [docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md) for Coolify deployment instructions.

---

## Git Push Instructions

This repo was initialised locally. To push to a remote:

```bash
# GitHub example
git remote add origin git@github.com:YOUR_ORG/leadcall-ai.git
git branch -M main
git push -u origin main
```

---

## Docs Index

- [docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md) — Coolify deployment guide
- [docs/N8N-MAPPING.md](docs/N8N-MAPPING.md) — n8n webhook payloads and workflow nodes
- [docs/VAPI-PROMPT.md](docs/VAPI-PROMPT.md) — Vapi assistant script for qualification
