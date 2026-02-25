# Deploying LeadCall AI to Coolify

App Reference ID: `2e950173-09ba-49f6-bcbf-a1240f20c0ee`

## Prerequisites

- Coolify instance running (e.g. on your VPS)
- GitHub repo containing this codebase
- Domain or sslip.io subdomain ready

---

## Step 1 — Create Application in Coolify

1. Coolify → **Projects** → **New Application**
2. Source: **GitHub** → select your repo
3. Branch: `main` (or `master`)
4. Build Pack: **Nixpacks** (or Dockerfile if you add one)

---

## Step 2 — Build & Start Commands

| Setting | Value |
|---|---|
| **Build Command** | `npm run build` |
| **Start Command** | `npm start` |
| **Port** | `3030` |
| **Node Version** | 20 |

---

## Step 3 — Environment Variables

Add these in Coolify → Application → **Environment Variables**:

```
N8N_DEMO_WEBHOOK=https://your-n8n.example.com/webhook/leadcall-demo
VAPI_API_KEY=your_vapi_api_key
VAPI_ASSISTANT_ID=your_vapi_assistant_id
VAPI_PHONE_NUMBER_ID=your_vapi_phone_number_id
VAPI_WEBHOOK_TOKEN=your_random_secret
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://leadcall.yourdomain.com
```

> Optional SMTP variables if not using n8n for email:
> `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

---

## Step 4 — Persistent Volume (data directory)

The app stores leads and call records in `data/leads.json` and `data/calls.json`.
To persist these across deployments:

1. Coolify → Application → **Persistent Storage**
2. Add volume:
   - **Host path**: `/data/leadcall-ai`
   - **Container path**: `/app/data`

---

## Step 5 — Health Check

| Setting | Value |
|---|---|
| **Health Check Path** | `/api/demo/submit` (POST — returns 400 on bad input = alive) |
| Or simpler | `/` (GET — landing page) |
| **Interval** | 30s |
| **Timeout** | 10s |

---

## Step 6 — Domain & SSL

1. Coolify → Application → **Domains**
2. Add your domain, e.g. `leadcall.yourdomain.com`
3. Enable **Let's Encrypt** for automatic SSL

---

## Step 7 — Deploy

1. Click **Deploy** in Coolify
2. Watch build logs
3. Verify at `https://leadcall.yourdomain.com`

---

## Vapi Webhook URL (after deploy)

Set this in your Vapi assistant settings:

```
https://leadcall.yourdomain.com/api/webhooks/vapi
```

With header:

```
Authorization: Bearer YOUR_VAPI_WEBHOOK_TOKEN
```
