# Deploy on Render

The web service **coal-erp-web** is configured for Docker deploy from this repo.

**Live URL (after successful deploy):** https://coal-erp-web.onrender.com  
**Dashboard:** https://dashboard.render.com/web/srv-d8uqqfok1i2s73e9e3pg

## One-time: PostgreSQL

Render’s free tier allows **one free Postgres** per workspace. Choose one:

### Option A — New Render Postgres (recommended)

1. Add a payment method at https://dashboard.render.com/billing (required for `basic-256mb`, ~$6/mo).
2. Open [Blueprint deploy](https://dashboard.render.com/blueprint/new?repo=https://github.com/shahronit/Coal-ERP-Web) and click **Apply** (creates `coal-erp-db` + wires `DATABASE_URL`).

### Option B — External Postgres (free)

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) free Postgres. In the **coal-erp-web** service → **Environment**, set:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Postgres connection string (with `?sslmode=require` if external) |
| `DATABASE_PROVIDER` | `postgres` |

Then **Save, rebuild, and deploy**.

### Option C — Link existing Render Postgres

In **coal-erp-web** → **Environment** → **Add from Database**, select your Postgres instance. Render injects `DATABASE_URL` automatically.

## Deploy / redeploy

Auto-deploy is on for `main`. Manual redeploy:

```bash
render deploys create srv-d8uqqfok1i2s73e9e3pg --confirm
```

## Default login

After first successful deploy (empty DB): `superadmin@tradecrm.com` / `Demo@123`

## Validate Blueprint locally

```bash
render blueprints validate render.yaml
```
