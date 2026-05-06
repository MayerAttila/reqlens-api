import { Resend } from "resend";
import { env } from "../config/index.js";

type SendEmailInput = {
  html: string;
  subject: string;
  text: string;
  to: string;
};

const resend = env.resendApiKey ? new Resend(env.resendApiKey) : null;

export async function sendEmail({ html, subject, text, to }: SendEmailInput) {
  if (!resend) {
    const message = `[email] Resend is not configured. Skipping "${subject}" to ${to}.`;

    if (env.nodeEnv === "production") {
      throw new Error(message);
    }

    console.warn(message);
    return;
  }

  const { error } = await resend.emails.send({
    from: env.resendFromEmail,
    html,
    replyTo: env.resendReplyToEmail,
    subject,
    text,
    to
  });

  if (error) {
    throw new Error(`Resend failed to send "${subject}" to ${to}: ${error.message}`);
  }
}
