import { render } from "@react-email/render";
import type { AlertEmailCall } from "./alert-email.js";
import { OneTimeAlertEmail } from "./one-time-alert-email.js";

export async function renderOneTimeAlertEmail({
  calls,
  dashboardUrl,
  kind,
  projectName,
  totalCount
}: {
  calls: AlertEmailCall[];
  dashboardUrl: string;
  kind: "errors" | "latency";
  projectName: string;
  totalCount: number;
}) {
  const email = (
    <OneTimeAlertEmail
      calls={calls}
      dashboardUrl={dashboardUrl}
      kind={kind}
      projectName={projectName}
      totalCount={totalCount}
    />
  );

  return {
    html: await render(email),
    text: await render(email, { plainText: true })
  };
}
