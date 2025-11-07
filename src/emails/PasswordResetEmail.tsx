import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  userName?: string;
  userEmail?: string;
  resetUrl?: string;
  expiryHours?: number;
}

export const PasswordResetEmail = ({
  userName = 'User',
  userEmail = 'user@example.com',
  resetUrl = 'https://app.alojamento-insight.com/reset-password',
  expiryHours = 24,
}: PasswordResetEmailProps) => {
  const previewText = 'Reset your password for Alojamento Insight Analyzer';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>Alojamento Insight Analyzer</Heading>
          </Section>

          <Section style={content}>
            <Section style={warningBadge}>
              <Text style={warningIcon}>🔒</Text>
              <Heading style={h2}>Password Reset Request</Heading>
            </Section>

            <Text style={text}>
              Hi {userName},
            </Text>

            <Text style={text}>
              We received a request to reset the password for your account
              ({userEmail}). If you made this request, click the button below to reset
              your password:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>⏰ This link will expire in {expiryHours} hours</strong>
              </Text>
              <Text style={warningSubtext}>
                For security reasons, password reset links are only valid for a limited time.
              </Text>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              If the button doesn't work, you can copy and paste this link into your browser:
            </Text>

            <Text style={urlText}>
              {resetUrl}
            </Text>

            <Hr style={hr} />

            <Section style={securityBox}>
              <Text style={securityTitle}>
                <strong>Didn't request this?</strong>
              </Text>
              <Text style={securityText}>
                If you didn't request a password reset, you can safely ignore this email.
                Your password will not be changed, and no further action is required.
              </Text>
              <Text style={securityText}>
                However, if you're concerned about the security of your account, we recommend:
              </Text>
              <ul style={list}>
                <li style={listItem}>
                  Changing your password immediately
                </li>
                <li style={listItem}>
                  Enabling two-factor authentication
                </li>
                <li style={listItem}>
                  Reviewing your recent account activity
                </li>
              </ul>
            </Section>

            <Text style={helpText}>
              Need help?{' '}
              <Link href="mailto:support@alojamento-insight.com" style={link}>
                Contact our support team
              </Link>
            </Text>

            <Text style={text}>
              Best regards,
              <br />
              The Alojamento Insight Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated security email. This email cannot receive replies.
            </Text>
            <Text style={footerText}>
              Alojamento Insight Analyzer • Security Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#ef4444',
  padding: '24px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  padding: '0',
};

const content = {
  padding: '0 48px',
};

const warningBadge = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const warningIcon = {
  backgroundColor: '#fbbf24',
  borderRadius: '50%',
  display: 'inline-block',
  fontSize: '32px',
  width: '64px',
  height: '64px',
  lineHeight: '64px',
  margin: '0 auto 16px',
};

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#ef4444',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const warningBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const warningText = {
  color: '#92400e',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const warningSubtext = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
};

const urlText = {
  color: '#2563eb',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  wordBreak: 'break-all' as const,
  backgroundColor: '#f3f4f6',
  padding: '12px',
  borderRadius: '4px',
};

const securityBox = {
  backgroundColor: '#fef2f2',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const securityTitle = {
  color: '#991b1b',
  fontSize: '16px',
  margin: '0 0 12px 0',
};

const securityText = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
};

const list = {
  color: '#7f1d1d',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '4px',
};

const helpText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '16px 0',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const footer = {
  borderTop: '1px solid #e5e7eb',
  margin: '32px 48px 0',
  padding: '24px 0 0',
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
  textAlign: 'center' as const,
};
