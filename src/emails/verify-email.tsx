import { AuthEmail } from "./auth-email.js";

export type VerifyEmailProps = {
  url: string;
};

export function VerifyEmail({
  url = "http://localhost:3001/api/auth/verify-email?token=preview"
}: VerifyEmailProps) {
  return (
    <AuthEmail
      body="Confirm your email address so your Reqlens account is ready for account recovery and security emails."
      ctaLabel="Verify email"
      preview="Verify your Reqlens email."
      title="Verify your email"
      url={url}
    />
  );
}

export default VerifyEmail;
