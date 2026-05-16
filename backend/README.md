# DiteUp Backend API

Express 5 + TypeScript + Prisma + PostgreSQL.

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Copy + edit env
cp .env.example .env
# Edit DATABASE_URL and generate JWT secrets:
#   openssl rand -hex 48   (run twice — once for access, once for refresh)

# 3. Generate Prisma client + run migrations
npx prisma generate
npx prisma migrate dev --name init

# 4. Run dev server (hot reload via tsx)
npm run dev
```

Server runs at `http://localhost:4000`. Health check: `GET /health`. DB health: `GET /health/db`.

## Available endpoints

### Auth (`/v1/auth`)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/signup` | — | Email + password. Sends OTP. Anti-enumeration safe. |
| POST | `/verify-email` | — | Consumes OTP, issues tokens. |
| POST | `/resend-otp` | — | EMAIL_VERIFY or PASSWORD_RESET. 60s cooldown. 3/hour/email. |
| POST | `/login` | — | 5 failures → 30-min lock. |
| POST | `/refresh` | — | Reads refresh token from cookie or body. |
| POST | `/logout` | required | Bumps `tokenVersion` (invalidates all sessions). |
| POST | `/forgot-password` | — | Sends OTP if email exists; same response shape regardless. |
| POST | `/reset-password` | — | OTP + new password → fresh tokens. |
| GET | `/me` | required | Current user profile. |

Cookies set: `dt_access` (15 min) + `dt_refresh` (30 or 60 days, refresh-route-scoped, httpOnly).

## Project layout

```
src/
├── config/        # env validation (Zod)
├── controllers/   # thin HTTP layer
├── emails/        # transactional templates
├── jobs/          # background jobs (cron, queue) — Phase 10
├── middleware/    # auth, errorHandler, rateLimit, requestContext, validate
├── routes/        # Express routers (one per resource)
├── services/      # business logic (auth, email, … razorpay, storage)
├── types/         # shared type definitions
├── utils/         # primitives: jwt, password, otp, errors, logger, prisma
├── validators/    # Zod request schemas
└── index.ts       # server entry
```

## Testing locally without external services

- **Email** — leave `RESEND_API_KEY` empty. Emails (including OTP codes) print to the terminal and write to the `EmailLog` table.
- **Razorpay** — leave the keys empty until Phase 6.
- **R2/S3** — leave the keys empty until Phase 7.

## Useful commands

```bash
npm run typecheck       # tsc --noEmit (full TypeScript check)
npm run prisma:studio   # browse the DB at http://localhost:5555
npm run prisma:reset    # nuke + remigrate (destructive)
```

## Next phases

See `../TASKS.md` for the live build plan. Phase 3 (`/me/*` profile + addresses) is next.
