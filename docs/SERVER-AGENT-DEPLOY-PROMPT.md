# AI Server Agent Prompt — DiteUp Production Fix (Site Mode + Latest Code)

Copy everything below the line into your AI agent that has SSH access to the diteup.com EC2 server.

---

## PROMPT START

You are connected to the **production EC2 server** for **DiteUp** ([https://diteup.com](https://diteup.com)). The repo is a monorepo with:

- `backend/` — Express 5 + Prisma + PostgreSQL (API on port **4000**, pm2 name likely **`diteup-api`**)
- `frontend/` — Next.js 14 (pm2 name likely **`diteup-web`**)
- Nginx terminates SSL and proxies to Next.js; Next rewrites `/v1/*` → backend via `API_PROXY_TARGET`

### Problem

Site-wide mode (admin countdown banner: Coming Soon / Under Maintenance / Sale) was added in code but **does not show on production** because:

1. **`GET https://diteup.com/v1/site/mode` returns 404** — production API is missing the new route (backend not redeployed).
2. **`GET https://diteup.com/v1/products/featured` works** — so nginx + old API are fine; only backend is stale.
3. Frontend must also be on latest code (uses client-side fetch from `/v1/site/mode` via `SiteModeProvider`).

Your job: **pull latest code, rebuild both services, verify env, smoke-test, report results.** Do not delete secrets or `.env` files.

---

### Step 1 — Locate project and check current state

```bash
# Find repo (adjust path if different)
ls -la ~/Dite_up /var/www/Dite_up /home/*/Dite_up 2>/dev/null

cd /path/to/Dite_up   # use actual path

git status
git log -1 --oneline
git fetch origin
git pull origin main   # or master — use the live branch name

# Check what's running
pm2 list
# or: systemctl status diteup-api diteup-web

# Diagnose BEFORE deploy
curl -sS -o /dev/null -w "%{http_code}" https://diteup.com/v1/products/featured
curl -sS https://diteup.com/v1/site/mode
curl -sS -o /dev/null -w "%{http_code}" https://diteup.com/v1/site/mode
```

Expected **before** fix: featured = `200`, site/mode = `404` or missing JSON.

---

### Step 2 — Verify environment variables (do NOT overwrite secrets)

**Backend** `backend/.env` must include at minimum:

```env
NODE_ENV=production
DATABASE_URL=...
CORS_ORIGIN=https://diteup.com
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
PUBLIC_SITE_URL=https://diteup.com
SETTINGS_ENCRYPTION_KEY=...   # ≥16 chars, for admin settings
```

**Frontend** `frontend/.env` or `frontend/.env.local` (production):

```env
NODE_ENV=production
API_INTERNAL_URL=http://127.0.0.1:4000
API_PROXY_TARGET=http://127.0.0.1:4000
NEXT_PUBLIC_API_URL=https://diteup.com
```

If `API_PROXY_TARGET` is missing, add it — Next.js uses it in `next.config.mjs` to proxy `/v1/*` to Express.

Do **not** commit `.env` to git. Only add missing keys; never rotate JWT secrets unless asked.

---

### Step 3 — Deploy backend (critical)

```bash
cd /path/to/Dite_up/backend

npm ci
npx prisma generate
npx prisma migrate deploy    # apply any pending migrations — safe for prod
npm run build

pm2 restart diteup-api
# OR: sudo systemctl restart diteup-api

# Wait a few seconds, then verify locally
curl -sS http://127.0.0.1:4000/health
curl -sS http://127.0.0.1:4000/v1/site/mode
```

Expected backend response for site mode:

```json
{"siteMode":{"active":false,"reason":null,"endsAt":null,"headline":"","message":null,"blocksCheckout":false}}
```

(or `active: true` if admin already saved site mode in DB)

---

### Step 4 — Deploy frontend

```bash
cd /path/to/Dite_up/frontend

npm ci
npm run build

pm2 restart diteup-web
# OR: sudo systemctl restart diteup-web
```

If build fails on ESLint (e.g. unused import in `SiteHeaderBar.tsx`), fix only that lint error and rebuild — do not disable lint globally.

---

### Step 5 — Public smoke tests (must all pass)

```bash
# Site mode endpoint (was 404)
curl -sS https://diteup.com/v1/site/mode | head -c 500

# Featured product still works
curl -sS -o /dev/null -w "featured: %{http_code}\n" https://diteup.com/v1/products/featured

# Homepage loads
curl -sS -o /dev/null -w "home: %{http_code}\n" https://diteup.com/

# Admin settings API (optional — needs auth cookie)
curl -sS -o /dev/null -w "admin login page: %{http_code}\n" https://diteup.com/admin/login
```

**Manual check (describe in report):**

1. Log into `https://diteup.com/admin` → **Settings → Site-wide mode**
2. Enable **Coming soon**, set end time **2+ hours in future**, Save
3. Confirm toast: “Site mode saved…”
4. Open `https://diteup.com/` in incognito — header should show countdown (not “Free shipping” strip)
5. Open product page — buy buttons disabled when mode blocks checkout
6. Switch to **Sale** mode — buy buttons enabled again

---

### Step 6 — If site/mode still 404 after backend restart

Check nginx is proxying `/v1` to backend, not only to Next:

```bash
sudo nginx -T 2>/dev/null | grep -A5 "location.*/v1"
```

Next.js rewrite handles `/v1` when request hits Next on port 3000. If nginx sends `/v1` directly to port 4000, that is also fine **if backend has the route**.

Confirm backend code includes route (on server):

```bash
grep -r "site/mode" /path/to/Dite_up/backend/src/routes/
```

Should show `router.get("/site/mode", siteController.getSiteMode);` in `catalog.ts`.

If route exists but 404 persists: wrong pm2 process / wrong cwd / old `dist/` — delete `backend/dist`, rebuild, restart.

---

### Step 7 — Report back

Return a short report with:

- Git commit SHA deployed
- pm2 restart output / any errors
- `curl https://diteup.com/v1/site/mode` full JSON
- Whether admin site mode banner appears on homepage
- Any env vars you had to add (names only, not values)
- Anything still broken

**Do not:** force-push git, drop database, expose secrets in logs, or change DNS/SSL unless broken.

## PROMPT END
