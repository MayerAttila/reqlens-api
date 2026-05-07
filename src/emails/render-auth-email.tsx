import { render } from "@react-email/render";
import { ProjectInviteEmail } from "./project-invite.js";
import { ResetPasswordEmail } from "./reset-password.js";
import { VerifyEmail } from "./verify-email.js";

export async function renderVerifyEmail(url: string) {
  const email = <VerifyEmail url={url} />;

  return {
    html: await render(email),
    text: await render(email, { plainText: true })
  };
}

export async function renderResetPasswordEmail(url: string) {
  const email = <ResetPasswordEmail url={url} />;

  return {
    html: await render(email),
    text: await render(email, { plainText: true })
  };
}

export async function renderProjectInviteEmail({
  inviterName,
  projectName,
  url
}: {
  inviterName: string;
  projectName: string;
  url: string;
}) {
  const email = (
    <ProjectInviteEmail
      inviterName={inviterName}
      projectName={projectName}
      url={url}
    />
  );

  return {
    html: await render(email),
    text: await render(email, { plainText: true })
  };
}
