# EC2 production security — diteup.com

Runbook for the live EC2 box serving [https://diteup.com/](https://diteup.com/).

---

## 1. Deploy the code changes (do this first)

SSH into EC2, pull latest, rebuild, restart:

```bash
cd /path/to/Dite_up   # your repo on the server

git pull

# Backend
cd backend
npm ci
npm run build
# restart API (adjust to your process manager)
pm2 restart diteup-api   # or: sudo systemctl restart diteup-api

# Frontend (Next.js)
cd ../frontend
npm ci
npm run build
pm2 restart diteup-web   # or: sudo systemctl restart diteup-web
```

**Note:** After deploy, all users are logged out once (access tokens now include `tokenVersion`). Normal — they log in again.

---

## 2. Backend `.env` on EC2 (required)

Edit `backend/.env` on the server:

```bash
NODE_ENV=production

# Must match live site exactly (no trailing slash)
CORS_ORIGIN=https://diteup.com

# Strong unique secrets (never reuse dev values)
JWT_ACCESS_SECRET=<openssl rand -hex 48>
JWT_REFRESH_SECRET=<openssl rand -hex 48>

# Health probe — blocks public /health/db without header
HEALTHCHECK_SECRET=<openssl rand -hex 24>

# Payments & email (from dashboards)
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

RESEND_API_KEY=re_...
RESEND_WEBHOOK_SECRET=whsec_...   # from Resend → Webhooks → signing secret

# Encrypt admin-stored secrets (Razorpay/Meta in admin UI)
SETTINGS_ENCRYPTION_KEY=<openssl rand -hex 32>

PUBLIC_SITE_URL=https://diteup.com

# Optional but recommended
SENTRY_DSN=...
```

Generate secrets on the server:

```bash
openssl rand -hex 48   # JWT
openssl rand -hex 24   # HEALTHCHECK_SECRET
openssl rand -hex 32   # SETTINGS_ENCRYPTION_KEY
```

Restart API after editing `.env`.

---

## 3. Frontend `.env` on EC2

```bash
NODE_ENV=production
API_INTERNAL_URL=http://127.0.0.1:4000    # or your API port
NEXT_PUBLIC_API_URL=https://diteup.com      # if browser calls API directly
API_PROXY_TARGET=http://127.0.0.1:4000      # Next rewrite to API

# Meta pixel fallback if not set in admin Settings → Meta ads
# NEXT_PUBLIC_META_PIXEL_ID=
```

---

## 4. Nginx (recommended hardening)

If nginx sits in front of Node on EC2:

### Block public DB health check

```nginx
# Inside your server { } block for diteup.com

location = /health/db {
    return 404;
}

# Optional: allow only localhost monitoring (curl from same box)
# location = /health/db {
#     allow 127.0.0.1;
#     deny all;
#     proxy_pass http://127.0.0.1:4000;
#     proxy_set_header X-Health-Secret "YOUR_HEALTHCHECK_SECRET";
# }
```

Reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Rate limit auth endpoints (replaces Redis for single EC2)

```nginx
# In http { } block (once)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=120r/m;

# In server { } for API location
location /v1/auth/login {
    limit_req burst=5 nodelay;
    limit_req zone=auth_limit;
    proxy_pass http://127.0.0.1:4000;
    # ... usual proxy headers
}

location /v1/ {
    limit_req burst=40 nodelay;
    limit_req zone=api_limit;
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

---

## 5. Firewall (UFW)

Only expose what the internet needs:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'    # 80 + 443
sudo ufw enable
sudo ufw status
```

Postgres and Redis (if added later) must **not** be open to `0.0.0.0` — bind to `127.0.0.1` only.

---

## 6. SSL

Ensure cert covers `diteup.com` + `www.diteup.com`:

```bash
sudo certbot --nginx -d diteup.com -d www.diteup.com
```

Force HTTPS redirect in nginx if not already.

---

## 7. Resend webhook URL

In [Resend dashboard](https://resend.com/webhooks):

- **Endpoint:** `https://diteup.com/v1/webhooks/resend` (or your API subdomain if API is separate)
- Copy **signing secret** → `RESEND_WEBHOOK_SECRET` in backend `.env`
- Events: `email.bounced`, `email.complained`, `email.delivery_delayed` (at minimum bounces/complaints)

---

## 8. Razorpay webhook

In Razorpay Dashboard → Webhooks:

- **URL:** `https://diteup.com/v1/webhooks/razorpay` (must hit API, not Next static)
- **Secret** → `RAZORPAY_WEBHOOK_SECRET`
- Event: `payment.captured`

If API is on a subdomain, use `https://api.diteup.com/v1/webhooks/razorpay` and set `CORS_ORIGIN` accordingly.

---

## 9. Smoke tests after deploy

```bash
# DB health hidden from public
curl -s -o /dev/null -w "%{http_code}\n" https://diteup.com/health/db
# Expect: 404

# With secret (from server only)
curl -s -H "X-Health-Secret: YOUR_SECRET" https://diteup.com/health/db
# Expect: {"ok":true,"db":"up"}

# Admin without cookie
curl -s -o /dev/null -w "%{http_code}\n" https://diteup.com/v1/admin/dashboard/stats
# Expect: 401

# Site loads
curl -s -o /dev/null -w "%{http_code}\n" https://diteup.com/
# Expect: 200
```

Browser: login → logout → confirm admin/customer API calls fail immediately (no 15‑min stale session).

---

## 10. Optional later: Redis rate limits

Only needed if you run **multiple API instances**. On a single EC2, nginx limits above are enough.

If you add Redis later, set `REDIS_URL=redis://127.0.0.1:6379` and ask dev to wire the rate-limit middleware (requires `redis` npm package).

---

## What changed in code (2026-05-31)

| Item | Fix |
|------|-----|
| Logout still valid 15 min | Access JWT now carries `tv` (tokenVersion); invalid immediately after logout |
| CSRF / missing Origin | Production rejects cookie-auth mutating requests without trusted Origin/Referer |
| `/health/db` public | Requires `X-Health-Secret` when `HEALTHCHECK_SECRET` set in production |
| Guest token Referer leak | Site-wide `Referrer-Policy: strict-origin-when-cross-origin`; order pages `no-referrer` |
| Resend webhook | Svix signature verification (set `RESEND_WEBHOOK_SECRET`) |

Rate limiting across replicas: **nginx on EC2** (section 4) — no code change until Redis is approved.
