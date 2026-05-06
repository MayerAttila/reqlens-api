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

export type AuthEmailProps = {
  body: string;
  ctaLabel: string;
  preview: string;
  title: string;
  url: string;
};

export function AuthEmail({
  body,
  ctaLabel,
  preview,
  title,
  url
}: AuthEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Text style={styles.brand}>Reqlens</Text>
          <Heading style={styles.heading}>{title}</Heading>
          <Text style={styles.text}>{body}</Text>
          <Section style={styles.buttonWrap}>
            <Button href={url} style={styles.button}>
              {ctaLabel}
            </Button>
          </Section>
          <Text style={styles.footer}>
            If the button does not work, open this link: {url}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    backgroundColor: "#111216",
    color: "#f8f8f8",
    fontFamily: "Arial, sans-serif",
    padding: "32px"
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
    margin: "24px 0"
  },
  container: {
    backgroundColor: "#1b1c22",
    borderRadius: "24px",
    margin: "0 auto",
    maxWidth: "560px",
    padding: "32px"
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
    lineHeight: "1.1",
    margin: "0 0 16px"
  },
  text: {
    color: "#b8bbc8",
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 24px"
  }
};
