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

export type AlertEmailCall = {
  durationMs: number;
  method: string;
  path: string;
  statusCode: number;
  timestamp: string;
};

export type AlertEmailProps = {
  calls?: AlertEmailCall[];
  dashboardUrl: string;
  kind: "errors" | "latency" | "mixed";
  projectName: string;
  thresholdMs?: number;
  totalCount?: number;
};

export function AlertEmail({
  calls,
  dashboardUrl = "http://localhost:3000/dashboard/errors",
  kind = "mixed",
  projectName = "Example project",
  thresholdMs = 750,
  totalCount
}: AlertEmailProps) {
  const isLatency = kind === "latency";
  const isMixed = kind === "mixed";
  const slowCalls = isMixed
    ? previewSlowCalls
    : isLatency
      ? calls ?? previewSlowCalls
      : [];
  const errorCalls = isMixed
    ? previewErrorCalls
    : isLatency
      ? []
      : calls ?? previewErrorCalls;
  const slowCount = isMixed ? slowCalls.length : isLatency ? totalCount ?? slowCalls.length : 0;
  const errorCount = isMixed ? errorCalls.length : isLatency ? 0 : totalCount ?? errorCalls.length;
  const alertCount = slowCount + errorCount;
  const title = isMixed
    ? `Problematic API calls in ${projectName}`
    : isLatency
      ? `Slow API calls in ${projectName}`
      : `API errors in ${projectName}`;
  const preview = isMixed
    ? `${alertCount} problematic API call${alertCount === 1 ? "" : "s"} in ${projectName}.`
    : isLatency
      ? `${slowCount} slow API call${slowCount === 1 ? "" : "s"} in ${projectName}.`
      : `${errorCount} errored API call${errorCount === 1 ? "" : "s"} in ${projectName}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Reqlens</Text>
          {isMixed ? null : (
            <Text style={isLatency ? styles.badgeLatency : styles.badgeError}>
              {isLatency ? "Latency alert" : "Error alert"}
            </Text>
          )}
          <Heading style={styles.heading}>{title}</Heading>

          <SummaryRow
            errorCount={errorCalls.length > 0 ? errorCount : undefined}
            slowCount={slowCalls.length > 0 ? slowCount : undefined}
          />

          {errorCalls.length > 0 ? (
            <AlertSection calls={errorCalls} isLatency={false} thresholdMs={thresholdMs} />
          ) : null}
          {slowCalls.length > 0 ? (
            <AlertSection calls={slowCalls} isLatency thresholdMs={thresholdMs} />
          ) : null}

          <Section style={styles.buttonWrap}>
            <Button href={dashboardUrl} style={styles.button}>
              View in Reqlens
            </Button>
          </Section>

          <Text style={styles.footer}>
            You received this email because alerts are enabled for this project.
            Manage recipients and thresholds from project settings.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function SummaryRow({
  errorCount,
  slowCount
}: {
  errorCount?: number;
  slowCount?: number;
}) {
  return (
    <Section style={styles.summaryRow}>
      <table cellPadding="0" cellSpacing="0" role="presentation" style={styles.summaryTable}>
        <tbody>
          <tr>
            {slowCount !== undefined ? (
              <SummaryMetric label="Slow calls" value={String(slowCount)} />
            ) : null}
            {errorCount !== undefined ? (
              <SummaryMetric label="Errored calls" value={String(errorCount)} />
            ) : null}
          </tr>
        </tbody>
      </table>
    </Section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <td style={styles.summaryCell}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </td>
  );
}

function AlertSection({
  calls,
  isLatency,
  thresholdMs
}: {
  calls: AlertEmailCall[];
  isLatency: boolean;
  thresholdMs: number;
}) {
  return (
    <Section style={isLatency ? styles.latencySection : styles.errorSection}>
      <Text style={isLatency ? styles.sectionLabelLatency : styles.sectionLabelError}>
        {isLatency ? "Slow calls" : "Error calls"}
      </Text>

      <Section style={styles.callList}>
        <table cellPadding="0" cellSpacing="0" role="presentation" style={styles.callTable}>
          <thead>
            <tr>
              <th style={styles.tableHeaderRequest}>Request</th>
              <th style={styles.tableHeaderSignal}>
                {isLatency ? "Latency" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call, index) => (
              <AlertCallRow
                call={call}
                isLatency={isLatency}
                key={`${call.method}-${call.path}-${index}`}
              />
            ))}
          </tbody>
        </table>
      </Section>
    </Section>
  );
}

function AlertCallRow({
  call,
  isLatency
}: {
  call: AlertEmailCall;
  isLatency: boolean;
}) {
  return (
    <tr>
      <td style={isLatency ? styles.tableCellLatency : styles.tableCellError}>
        <Text style={styles.route}>
          {call.method} {call.path}
        </Text>
        <Text style={styles.cellMeta}>
          {isLatency ? `HTTP ${call.statusCode}` : `${call.durationMs} ms`} /{" "}
          {formatTimestamp(call.timestamp)}
        </Text>
      </td>
      <td style={isLatency ? styles.tableSignalCellLatency : styles.tableSignalCellError}>
        <span style={isLatency ? styles.latencySignal : getStatusStyle(call.statusCode)}>
          {isLatency ? `${call.durationMs} ms slow` : `HTTP ${call.statusCode}`}
        </span>
      </td>
    </tr>
  );
}

function getStatusStyle(statusCode: number) {
  if (statusCode >= 500) {
    return styles.statusCritical;
  }

  if (statusCode >= 400) {
    return styles.statusWarning;
  }

  return styles.statusOk;
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

const previewSlowCalls: AlertEmailCall[] = [
  {
    durationMs: 763,
    method: "POST",
    path: "/demo/post/slow",
    statusCode: 201,
    timestamp: new Date().toISOString()
  },
  {
    durationMs: 918,
    method: "PATCH",
    path: "/demo/patch/slow",
    statusCode: 200,
    timestamp: new Date().toISOString()
  }
];

const previewErrorCalls: AlertEmailCall[] = [
  {
    durationMs: 2,
    method: "POST",
    path: "/demo/post/error",
    statusCode: 422,
    timestamp: new Date().toISOString()
  },
  {
    durationMs: 1,
    method: "DELETE",
    path: "/demo/delete/error",
    statusCode: 403,
    timestamp: new Date().toISOString()
  }
];

const styles = {
  badgeError: {
    backgroundColor: "#3a1f25",
    borderRadius: "999px",
    color: "#ff9b9b",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 0 18px",
    padding: "7px 11px"
  },
  badgeLatency: {
    backgroundColor: "#432916",
    borderRadius: "999px",
    color: "#ffbf85",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 0 18px",
    padding: "7px 11px"
  },
  badgeMixed: {
    backgroundColor: "#2d203e",
    borderRadius: "999px",
    color: "#d5afff",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0 0 18px",
    padding: "7px 11px"
  },
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
    margin: "26px 0 0"
  },
  callList: {
    margin: "14px 0 0"
  },
  container: {
    backgroundColor: "#1b1c22",
    borderRadius: "24px",
    margin: "0 auto",
    maxWidth: "620px",
    padding: "24px 20px"
  },
  footer: {
    color: "#8e92a3",
    fontSize: "12px",
    lineHeight: "1.6",
    margin: "24px 0 0"
  },
  heading: {
    color: "#f8f8f8",
    fontSize: "30px",
    lineHeight: "1.1",
    margin: "0 0 14px"
  },
  cellMeta: {
    color: "#9da3b5",
    fontSize: "12px",
    lineHeight: "1.4",
    margin: "4px 0 0"
  },
  errorSection: {
    backgroundColor: "#191a20",
    border: "1px solid #323641",
    borderRadius: "20px",
    margin: "24px 0 0",
    padding: "16px"
  },
  latencySection: {
    backgroundColor: "#191a20",
    border: "1px solid #323641",
    borderRadius: "20px",
    margin: "24px 0 0",
    padding: "16px"
  },
  latencySignal: {
    backgroundColor: "#442815",
    borderRadius: "999px",
    color: "#ffc18a",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0",
    padding: "5px 8px",
    whiteSpace: "nowrap" as const
  },
  route: {
    color: "#f8f8f8",
    fontSize: "14px",
    fontWeight: 700,
    lineHeight: "1.4",
    margin: "0",
    wordBreak: "break-word" as const
  },
  sectionLabelError: {
    color: "#ffaaaa",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2px",
    margin: "0 0 10px",
    textTransform: "uppercase" as const
  },
  sectionLabelLatency: {
    color: "#ffc18a",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2px",
    margin: "0 0 10px",
    textTransform: "uppercase" as const
  },
  statusCritical: {
    backgroundColor: "#4a2025",
    borderRadius: "999px",
    color: "#ff9b9b",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0",
    padding: "5px 8px",
    whiteSpace: "nowrap" as const
  },
  statusOk: {
    backgroundColor: "#2b2141",
    borderRadius: "999px",
    color: "#c790ff",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0",
    padding: "5px 8px",
    whiteSpace: "nowrap" as const
  },
  statusWarning: {
    backgroundColor: "#433514",
    borderRadius: "999px",
    color: "#ffe066",
    display: "inline-block",
    fontSize: "12px",
    fontWeight: 700,
    margin: "0",
    padding: "5px 8px",
    whiteSpace: "nowrap" as const
  },
  summaryCell: {
    backgroundColor: "#22242c",
    borderRight: "8px solid #1b1c22",
    padding: "12px",
    verticalAlign: "top" as const,
    width: "50%"
  },
  summaryRow: {
    margin: "24px 0 0"
  },
  summaryLabel: {
    color: "#9da3b5",
    fontSize: "12px",
    margin: "0 0 6px"
  },
  summaryValue: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    margin: "0",
    wordBreak: "break-word" as const
  },
  summaryTable: {
    borderCollapse: "separate" as const,
    borderSpacing: "0",
    tableLayout: "fixed" as const,
    width: "100%"
  },
  callTable: {
    borderCollapse: "separate" as const,
    borderSpacing: "0",
    tableLayout: "fixed" as const,
    width: "100%"
  },
  tableCellError: {
    backgroundColor: "#131419",
    borderBottom: "1px solid #323641",
    color: "#c2c5d0",
    fontSize: "12px",
    lineHeight: "1.45",
    padding: "10px 8px",
    verticalAlign: "middle" as const
  },
  tableCellLatency: {
    backgroundColor: "#131419",
    borderBottom: "1px solid #323641",
    color: "#c2c5d0",
    fontSize: "12px",
    lineHeight: "1.45",
    padding: "10px 8px",
    verticalAlign: "middle" as const
  },
  tableHeaderRequest: {
    color: "#8e92a3",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    lineHeight: "1.4",
    padding: "0 8px 8px",
    textAlign: "left" as const,
    textTransform: "uppercase" as const
  },
  tableHeaderSignal: {
    color: "#8e92a3",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1px",
    lineHeight: "1.4",
    padding: "0 0 8px 8px",
    textAlign: "right" as const,
    textTransform: "uppercase" as const,
    width: "108px"
  },
  tableSignalCellError: {
    backgroundColor: "#131419",
    borderBottom: "1px solid #323641",
    color: "#c2c5d0",
    fontSize: "12px",
    lineHeight: "1.45",
    padding: "10px 0 10px 8px",
    textAlign: "right" as const,
    verticalAlign: "middle" as const,
    width: "108px"
  },
  tableSignalCellLatency: {
    backgroundColor: "#131419",
    borderBottom: "1px solid #323641",
    color: "#c2c5d0",
    fontSize: "12px",
    lineHeight: "1.45",
    padding: "10px 0 10px 8px",
    textAlign: "right" as const,
    verticalAlign: "middle" as const,
    width: "108px"
  },
  text: {
    color: "#b8bbc8",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0"
  }
};

export default AlertEmail;
