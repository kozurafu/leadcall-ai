# CLAUDE.md — LeadCall AI

## Project Overview
AI-powered lead qualification SaaS demo. Visitor fills a form → Vapi AI agent calls them → conversation analysed → qualified lead email sent to business owner. n8n is the central orchestrator (clone workflow per customer). Deployed on Coolify (62.171.142.50). Port 3030.

## Commands
```bash
npm run dev          # Dev server on port 3030
npm run build        # Production build
npm run start        # Start production server
```

## Architecture
```
Next.js 14 (App Router) — landing page + API routes

Flow:
1. Visitor fills demo form (name, email, phone, company)
2. POST /api/demo/submit → sends data to n8n webhook + triggers Vapi call (fire-and-forget)
3. Vapi AI agent calls the visitor, qualifies them via conversation
4. Vapi sends end-of-call report to n8n webhook (via kozura.xyz HTTPS proxy)
5. n8n merges form data + Vapi analysis → sends branded HTML email to business owner

src/app/
├── page.tsx                    → Landing page ("Stop Chasing Leads. Let AI Do It For You!")
├── demo/page.tsx               → Demo form page
├── api/
│   ├── demo/submit/route.ts    → Form submission handler. Sends to n8n + triggers Vapi call
│   └── webhooks/vapi/route.ts  → Vapi callback handler (merges form data + AI analysis → email)

docs/
├── N8N-MAPPING.md              → n8n workflow field mapping documentation
├── DEPLOY-COOLIFY.md           → Coolify deployment notes
└── VAPI-PROMPT.md              → Vapi assistant prompt/config
```

## Key Files
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Landing page with hero, features, CTA |
| `src/app/demo/page.tsx` | Demo form (name, email, phone, company, industry) |
| `src/app/api/demo/submit/route.ts` | Core handler: validates form → POST to n8n demo webhook → fire-and-forget Vapi call with `variableValues` containing form data |
| `src/app/api/webhooks/vapi/route.ts` | Vapi end-of-call callback: merges `variableValues` + `structuredData` → generates branded HTML email → sends via nodemailer |
| `docs/N8N-MAPPING.md` | Documents how n8n workflow extracts data from Vapi callbacks |

## Patterns & Conventions
- **Fire-and-forget Vapi call**: Form returns 200 immediately. Vapi call triggers async in background.
- **Triple-fallback data extraction** (in n8n): `variableValues` → `metadata` → `call.customer` for maximum resilience.
- **n8n as orchestrator**: The app sends webhooks to n8n. n8n handles the business logic. To add a new customer, clone the n8n workflow — no code changes needed.
- **Vapi callbacks route through kozura.xyz**: Vapi requires HTTPS for webhooks. kozura.xyz reverse-proxies to n8n.

## Environment Variables
| Var | Required | Description |
|-----|----------|-------------|
| `VAPI_API_KEY` | Yes | Vapi API key for triggering calls |
| `VAPI_ASSISTANT_ID` | Yes | Vapi assistant ID (`059e5707-...`) |
| `VAPI_PHONE_NUMBER_ID` | Yes | Vapi phone number ID for outbound calls |
| `N8N_DEMO_WEBHOOK` | Yes | n8n webhook URL for demo form submissions |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | For direct email | SMTP config (Brevo) |

## Gotchas & Known Issues
- **No SSL on app**: App runs HTTP only. FQDN `leadcall.kozura.xyz` has no DNS record yet. Vapi callbacks go through kozura.xyz (which has SSL).
- **n8n API updates**: When updating n8n workflows via API (PUT), strip `activeVersionId`, `triggerCount`, `shared`, etc. Only send `{nodes, connections, settings, name}` or you get 400.
- **Vapi `firstMessageMode`**: Set to `assistant-waits-for-user` — agent waits for the human to speak first (more natural).
- **Docker networking**: App connects to n8n via `--network yo4oo4c084g88swkowoc8gkc` custom Docker network on Coolify.

## Dependencies & Integrations
- **Vapi AI** — outbound AI phone calls (assistant ID: `059e5707`)
- **n8n** — workflow orchestrator (webhook: `kozura.xyz/webhook/leadcall-ai-demo`)
- **Brevo SMTP** — transactional email delivery
- **Coolify** — deployment platform (app UUID: `okg4gks008k4ko8ckow4cwwo`)
- **kozura.xyz** — HTTPS reverse proxy for Vapi callbacks
