import { render } from "@react-email/render";
import { AlertEmail, AlertEmailCall } from "./alert-email.js";

export async function renderAlertEmail({
  calls,
  dashboardUrl,
  kind,
  projectName,
  thresholdMs,
  totalCount
}: {
  calls: AlertEmailCall[];
  dashboardUrl: string;
  kind: "errors" | "latency";
  projectName: string;
  thresholdMs?: number;
  totalCount: number;
}) {
  const email = (
    <AlertEmail
      calls={calls}
      dashboardUrl={dashboardUrl}
      kind={kind}
      projectName={projectName}
      thresholdMs={thresholdMs}
      totalCount={totalCount}
    />
  );

  return {
    html: await render(email),
    text: await render(email, { plainText: true })
  };
}
