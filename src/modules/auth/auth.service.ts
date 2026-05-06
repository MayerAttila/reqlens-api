import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env, prisma } from "../../config/index.js";
import {
  renderResetPasswordEmail,
  renderVerifyEmail
} from "../../emails/render-auth-email.js";
import { sendEmail } from "../../utils/email.js";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ url, user }) => {
      const email = await renderResetPasswordEmail(url);

      await sendEmail({
        html: email.html,
        subject: "Reset your Reqlens password",
        text: email.text,
        to: user.email
      });
    }
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ url, user }) => {
      const email = await renderVerifyEmail(url);

      await sendEmail({
        html: email.html,
        subject: "Verify your Reqlens email",
        text: email.text,
        to: user.email
      });
    }
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
