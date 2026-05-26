# Reqlens API

Backend service for Reqlens. It handles authentication, project management, request-log ingest, dashboard data, project settings, SDK config sync, and email delivery.

## Responsibilities

- `POST /ingest` receives SDK request logs.
- Project API keys are validated by hash.
- PostgreSQL stores users, projects, settings, invites, and request logs.
- Dashboard routes serve projects, requests, problems, statistics data, and settings.
- React Email templates render auth, invite, immediate alert, and daily digest emails.
- Resend sends production emails.
- SDK config endpoints keep project latency settings synced with middleware.

## Stack

- Express
- TypeScript
- Prisma 7
- PostgreSQL
- Better Auth
- React Email
- Resend
- Zod

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

Default API URL: `http://localhost:3001`

## Environment

```txt
PORT=3001
WEB_ORIGIN=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=dev_better_auth_secret_change_me
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reqlens?schema=public

REQLENS_DEV_API_KEY=dev_key
REQLENS_AUTO_CREATE_DEV_PROJECT=true

RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Reqlens <onboarding@resend.dev>"
RESEND_REPLY_TO_EMAIL=support@example.com
```

Notes:

- `REQLENS_AUTO_CREATE_DEV_PROJECT=true` lets the dev key create a local `Dev Project`.
- In development, missing Resend config logs/skips emails.
- In production, missing email config should be treated as a deployment issue.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with `tsx watch` |
| `npm run build` | Compile TypeScript |
| `npm run typecheck` | Typecheck without emitting files |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma development migrations |
| `npm run db:deploy` | Apply migrations in deployed environments |
| `npm run db:studio` | Open Prisma Studio |
| `npm run email:dev` | Run React Email preview server on port `3002` |
| `npm run email:export` | Export email templates |

## Key Routes

| Route | Purpose |
| --- | --- |
| `/api/auth/*` | Better Auth routes |
| `POST /ingest` | Receive SDK request-log batches |
| `GET /logs` | Project-grouped request logs |
| `GET /logs/entries` | Paginated request/problem table data |
| `GET /logs/:logId` | Request/response payload detail |
| `GET /projects` | List accessible projects |
| `POST /projects` | Create project and API key |
| `PATCH /projects/:projectId/settings` | Save project alert settings |
| `GET /projects/:projectId/api-key` | Reveal encrypted API key |
| `POST /projects/:projectId/api-key/regenerate` | Rotate project API key |
| `GET /settings` | Load account settings |
| `PATCH /settings` | Save account settings and defaults |
| `GET /sdk/config` | SDK project config |
| `GET /sdk/config/stream` | Live SDK config updates |

## Ingest Payload

```json
{
  "logs": [
    {
      "method": "POST",
      "path": "/api/orders",
      "statusCode": 422,
      "durationMs": 18,
      "requestBody": { "demo": true },
      "responseBody": { "error": "Invalid order" },
      "timestamp": "2026-05-26T10:00:00.000Z"
    }
  ]
}
```

Limits:

- `logs` must contain `1` to `100` items.
- `statusCode` must be `100` to `599`.
- `timestamp` must be ISO datetime.

## Email Preview

```bash
npm run email:dev
```

Open `http://localhost:3002`.

## Production Notes

- Use `npm run db:deploy` for migrations.
- Set a strong `BETTER_AUTH_SECRET`.
- Verify a sending domain in Resend.
- Set `WEB_ORIGIN` to the deployed web URL.
- Keep `DATABASE_URL` private.
