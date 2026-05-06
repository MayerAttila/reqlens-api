import { AuthEmail } from "./auth-email.js";

export type ResetPasswordEmailProps = {
  url: string;
};

export function ResetPasswordEmail({
  url = "http://localhost:3001/api/auth/reset-password/preview"
}: ResetPasswordEmailProps) {
  return (
    <AuthEmail
      body="Use this secure link to reset your Reqlens account password. The link will expire automatically."
      ctaLabel="Reset password"
      preview="Reset your Reqlens password."
      title="Reset your password"
      url={url}
    />
  );
}

export default ResetPasswordEmail;
