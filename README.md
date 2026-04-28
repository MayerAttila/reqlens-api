# reqlens-api

Backend service for Reqlens.

Initial responsibilities:

- Receive SDK logs at `POST /ingest`.
- Validate project API keys.
- Store request logs in PostgreSQL.
- Serve dashboard APIs later.

Local dev:

```bash
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

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
```
