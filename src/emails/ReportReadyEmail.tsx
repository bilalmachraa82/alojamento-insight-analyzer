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

interface ReportReadyEmailProps {
  userName?: string;
  userEmail?: string;
  propertyName?: string;
  reportUrl?: string;
  submissionId?: string;
  reportType?: 'basic' | 'premium';
}

export const ReportReadyEmail = ({
  userName = 'User',
  userEmail = 'user@example.com',
  propertyName = 'Your Property',
  reportUrl = 'https://app.alojamento-insight.com/report',
  submissionId = 'SUB-12345',
  reportType = 'premium',
}: ReportReadyEmailProps) => {
  const previewText = `Your ${reportType === 'premium' ? 'Premium ' : ''}Report for ${propertyName} is ready!`;

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
            <Heading style={h2}>Your Report is Ready!</Heading>

            <Text style={text}>
              Hi {userName},
            </Text>

            <Text style={text}>
              Great news! We've completed the analysis for <strong>{propertyName}</strong>,
              and your {reportType === 'premium' ? 'premium ' : ''}report is now available.
            </Text>

            {reportType === 'premium' && (
              <Section style={highlightBox}>
                <Text style={highlightText}>
                  Your premium report includes:
                </Text>
                <ul style={list}>
                  <li style={listItem}>Comprehensive performance analysis</li>
                  <li style={listItem}>Competitive benchmarking</li>
                  <li style={listItem}>Revenue optimization recommendations</li>
                  <li style={listItem}>Market trends and insights</li>
                  <li style={listItem}>Downloadable PDF report</li>
                </ul>
              </Section>
            )}

            <Section style={infoBox}>
              <Text style={infoLabel}>Submission ID:</Text>
              <Text style={infoValue}>{submissionId}</Text>

              <Text style={infoLabel}>Property:</Text>
              <Text style={infoValue}>{propertyName}</Text>

              <Text style={infoLabel}>Report Type:</Text>
              <Text style={infoValue}>
                {reportType === 'premium' ? 'Premium Analysis' : 'Basic Analysis'}
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={reportUrl}>
                View Your Report
              </Button>
            </Section>

            <Text style={text}>
              This report is available for download for the next 30 days. We recommend
              downloading it for your records.
            </Text>

            <Hr style={hr} />

            <Text style={helpText}>
              Need help understanding your report?{' '}
              <Link href="mailto:support@alojamento-insight.com" style={link}>
                Contact our team
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
              This report was generated based on your submission. If you didn't request this
              analysis, please contact our support team.
            </Text>
            <Text style={footerText}>
              <Link href={`https://app.alojamento-insight.com/unsubscribe?email=${userEmail}`} style={footerLink}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href="https://app.alojamento-insight.com/preferences" style={footerLink}>
                Email Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReportReadyEmail;

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
  backgroundColor: '#10b981',
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

const h2 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 20px',
};

const text = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const highlightBox = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #d1fae5',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const highlightText = {
  color: '#065f46',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const list = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '0',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '8px',
};

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '12px 0 4px 0',
};

const infoValue = {
  color: '#1f2937',
  fontSize: '16px',
  margin: '0 0 8px 0',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '32px 0',
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

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
};
