import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env, prisma } from "../../config/index.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true
  },
  secret: env.betterAuthSecret,
  baseURL: env.betterAuthUrl,
  trustedOrigins: [env.webOrigin]
});

export async function getSession(headers: Record<string, string | string[] | undefined>) {
  const cookie = headers.cookie;

  return auth.api.getSession({
    headers: new Headers({
      cookie: Array.isArray(cookie) ? cookie.join("; ") : cookie ?? ""
    })
  });
}
