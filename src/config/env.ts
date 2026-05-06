import { existsSync, readFileSync } from "node:fs";

loadDotEnv();

export const env = {
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "dev_better_auth_secret_change_me",
  betterAuthUrl: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  databaseUrl: requireEnv("DATABASE_URL"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3001),
  reqlensAutoCreateDevProject: process.env.REQLENS_AUTO_CREATE_DEV_PROJECT !== "false",
  reqlensDevApiKey: process.env.REQLENS_DEV_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "Reqlens <onboarding@resend.dev>",
  resendReplyToEmail: process.env.RESEND_REPLY_TO_EMAIL,
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000"
};

function loadDotEnv(path = ".env"): void {
  if (!existsSync(path)) {
    return;
  }

  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    process.env[key] ??= value;
  }
}

function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}
