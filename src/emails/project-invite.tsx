import { AuthEmail } from "./auth-email.js";

export type ProjectInviteEmailProps = {
  inviterName: string;
  projectName: string;
  url: string;
};

export function ProjectInviteEmail({
  inviterName = "A Reqlens user",
  projectName = "Example project",
  url = "http://localhost:3000/accept-invite?token=preview"
}: ProjectInviteEmailProps) {
  return (
    <AuthEmail
      body={`${inviterName} invited you to collaborate on "${projectName}" in Reqlens. Accept the invite to see this project on your dashboard.`}
      ctaLabel="Accept invite"
      preview={`You were invited to ${projectName}.`}
      title="Project invite"
      url={url}
    />
  );
}

export default ProjectInviteEmail;
