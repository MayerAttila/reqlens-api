import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text
} from "@react-email/components";
import type { AlertEmailCall } from "./alert-email.js";

export type OneTimeAlertEmailProps = {
  calls?: AlertEmailCall[];
  dashboardUrl: string;
  kind: "errors" | "latency";
  projectName: string;
  totalCount?: number;
};

export function OneTimeAlertEmail({
  calls,
  dashboardUrl = "http://localhost:3000/dashboard/errors",
  kind = "errors",
  projectName = "Example project",
  totalCount
}: OneTimeAlertEmailProps) {
  const isLatency = kind === "latency";
  const alertCalls = calls ?? (isLatency ? previewSlowCalls : previewErrorCalls);
  const alertCount = totalCount ?? alertCalls.length;
  const title = isLatency
    ? `Slow API calls in ${projectName}`
    : `API errors in ${projectName}`;
  const preview = isLatency
    ? `${alertCount} slow call${alertCount === 1 ? "" : "s"} detected in ${projectName}.`
    : `${alertCount} error call${alertCount === 1 ? "" : "s"} detected in ${projectName}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Reqlens</Text>
          <Text style={isLatency ? styles.latencyBadge : styles.errorBadge}>
            {isLatency ? "Latency alert" : "Error alert"}
          </Text>
          <Heading style={styles.heading}>{title}</Heading>
          <Text style={styles.text}>
            {alertCount} {isLatency ? "slow" : "errored"} API{" "}
            {alertCount === 1 ? "request" : "requests"} arrived in a new ingest
            batch.
          </Text>

          <Section style={styles.calls}>
            {alertCalls.map((call, index) => (
              <CallRow
                call={call}
                isLatency={isLatency}
                key={`${call.method}-${call.path}-${index}`}
              />
            ))}
          </Section>

          <Section style={styles.buttonWrap}>
            <Button href={dashboardUrl} style={styles.button}>
              Open in Reqlens
            </Button>
          </Section>
          <Text style={styles.footer}>
            Immediate alerts are enabled for this project. Recipient settings are
            managed in Reqlens.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function CallRow({
  call,
  isLatency
}: {
  call: AlertEmailCall;
  isLatency: boolean;
}) {
  return (
    <Section style={styles.callRow}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={styles.callTable}>
        <tbody>
          <tr>
            <td style={styles.routeCell}>
              <Text style={styles.route}>
                {call.method} {call.path}
              </Text>
            </td>
            <td style={styles.signalCell}>
              <Text
                style={isLatency ? styles.latencySignal : getStatusStyle(call.statusCode)}
              >
                {isLatency ? `${call.durationMs} ms` : `HTTP ${call.statusCode}`}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
      <Text style={styles.meta}>
        {isLatency ? `HTTP ${call.statusCode}` : `${call.durationMs} ms`} /{" "}
        {formatTimestamp(call.timestamp)}
      </Text>
    </Section>
  );
}

function getStatusStyle(statusCode: number) {
  return statusCode >= 500 ? styles.statusCritical : styles.statusWarning;
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

const previewErrorCalls: AlertEmailCall[] = [
  {
    durationMs: 2,
    method: "POST",
    path: "/demo/post/error",
    statusCode: 422,
    timestamp: new Date().toISOString()
  }
];

const previewSlowCalls: AlertEmailCall[] = [
  {
    durationMs: 763,
    method: "POST",
    path: "/demo/post/slow",
    statusCode: 201,
    timestamp: new Date().toISOString()
  }
];

const styles = {
  body: {
    backgroundColor: "#111216",
    color: "#f8f8f8",
    fontFamily: "Arial, sans-serif",
    padding: "16px"
  },
  brand: {
    color: "#a566e8",
    fontSize: "12px",
    letterSpacing: "4px",
    margin: "0 0 16px",
    textTransform: "uppercase" as const
  },
  button: {
    backgroundColor: "#9b5cdb",
    borderRadius: "14px",
    color: "#ffffff",
    display: "inline-block",
    fontWeight: 700,
    padding: "14px 18px",
    textDecoration: "none"
  },
  buttonWrap: {
    margin: "24px 0 0"
  },
  callRow: {
    backgroundColor: "#131419",
    border: "1px solid #323641",
    borderRadius: "16px",
    margin: "0 0 10px",
    padding: "14px"
  },
  callTable: {
    borderCollapse: "collapse" as const,
    tableLayout: "fixed" as const,
    width: "100%"
  },
  calls: {
    margin: "22px 0 0"
  },
  container: {
    backgroundColor: "#1b1c22",
    borderRadius: "24px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "24px 20px"
  },
  errorBadge: {
    backgroundColor: "#3a1f25",
    borderRadius: "999px",
    color: "#ff9b9b",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 0 16px",
    padding: "7px 11px"
  },
  footer: {
    color: "#8e92a3",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: "24px 0 0"
  },
  heading: {
    color: "#f8f8f8",
    fontSize: "28px",
    lineHeight: "1.15",
    margin: "0 0 12px"
  },
  latencyBadge: {
    backgroundColor: "#432916",
    borderRadius: "999px",
    color: "#ffbf85",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 0 16px",
    padding: "7px 11px"
  },
  latencySignal: {
    backgroundColor: "#442815",
    borderRadius: "999px",
    color: "#ffc18a",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0",
    padding: "5px 8px"
  },
  meta: {
    color: "#9da3b5",
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0"
  },
  route: {
    color: "#f8f8f8",
    fontSize: "15px",
    fontWeight: 700,
    lineHeight: "1.45",
    margin: "0",
    wordBreak: "break-word" as const
  },
  routeCell: {
    padding: "0 10px 0 0",
    verticalAlign: "top" as const
  },
  signalCell: {
    padding: "0",
    textAlign: "right" as const,
    verticalAlign: "top" as const,
    width: "92px"
  },
  statusCritical: {
    backgroundColor: "#4a2025",
    borderRadius: "999px",
    color: "#ff9b9b",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 8px 0 0",
    padding: "5px 8px"
  },
  statusWarning: {
    backgroundColor: "#433514",
    borderRadius: "999px",
    color: "#ffe066",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 8px 0 0",
    padding: "5px 8px"
  },
  text: {
    color: "#b8bbc8",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0"
  }
};

export default OneTimeAlertEmail;
