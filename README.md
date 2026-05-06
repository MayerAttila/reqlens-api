# reqlens-api

Backend service for Reqlens.

Initial responsibilities:

- Receive SDK logs at `POST /ingest`.
- Validate project API keys.
- Store request logs in PostgreSQL.
- Serve dashboard APIs.
- Send auth emails through Resend.

Local dev:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Email preview:

```bash
npm run email:dev
```

Open `http://localhost:3002` to preview the React Email templates.

`REQLENS_AUTO_CREATE_DEV_PROJECT=true` lets the first valid dev API key create a local `Dev Project` automatically.

Required env:

```txt
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reqlens?schema=public
WEB_ORIGIN=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_SECRET=dev_better_auth_secret_change_me
REQLENS_DEV_API_KEY=dev_key
REQLENS_AUTO_CREATE_DEV_PROJECT=true
PORT=3001
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL="Reqlens <onboarding@resend.dev>"
RESEND_REPLY_TO_EMAIL=support@example.com
```

Resend setup:

- Use `onboarding@resend.dev` only for quick local testing.
- For real emails, verify your sending domain in Resend and set `RESEND_FROM_EMAIL` to something like `Reqlens <auth@your-domain.com>`.
- If `RESEND_API_KEY` is missing in development, emails are skipped and logged in the API terminal. In production, missing Resend config throws an error.
