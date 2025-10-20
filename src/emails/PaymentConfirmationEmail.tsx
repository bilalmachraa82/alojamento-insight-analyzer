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

interface PaymentConfirmationEmailProps {
  userName?: string;
  userEmail?: string;
  amount?: number;
  currency?: string;
  paymentDate?: string;
  paymentMethod?: string;
  transactionId?: string;
  planName?: string;
  invoiceUrl?: string;
}

export const PaymentConfirmationEmail = ({
  userName = 'User',
  userEmail = 'user@example.com',
  amount = 29.99,
  currency = 'EUR',
  paymentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }),
  paymentMethod = 'Credit Card ending in 4242',
  transactionId = 'TXN-12345',
  planName = 'Premium Plan',
  invoiceUrl = 'https://app.alojamento-insight.com/invoice',
}: PaymentConfirmationEmailProps) => {
  const previewText = `Payment confirmation for ${planName} - ${currency} ${amount.toFixed(2)}`;
  const formattedAmount = `${currency} ${amount.toFixed(2)}`;

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
            <Section style={successBadge}>
              <Text style={successIcon}>✓</Text>
              <Heading style={h2}>Payment Successful</Heading>
            </Section>

            <Text style={text}>
              Hi {userName},
            </Text>

            <Text style={text}>
              Thank you for your payment! This confirms that we've successfully received
              your payment for <strong>{planName}</strong>.
            </Text>

            <Section style={amountBox}>
              <Text style={amountLabel}>Amount Paid</Text>
              <Text style={amountValue}>{formattedAmount}</Text>
            </Section>

            <Section style={infoBox}>
              <table style={infoTable}>
                <tbody>
                  <tr>
                    <td style={infoLabel}>Transaction ID:</td>
                    <td style={infoValue}>{transactionId}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Payment Date:</td>
                    <td style={infoValue}>{paymentDate}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Payment Method:</td>
                    <td style={infoValue}>{paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style={infoLabel}>Plan:</td>
                    <td style={infoValue}>{planName}</td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href={invoiceUrl}>
                Download Invoice
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={text}>
              <strong>What's next?</strong>
            </Text>

            <ul style={list}>
              <li style={listItem}>
                Your {planName} features are now active
              </li>
              <li style={listItem}>
                You can access premium reports and advanced analytics
              </li>
              <li style={listItem}>
                Your invoice has been sent and is available for download
              </li>
            </ul>

            <Text style={helpText}>
              If you have any questions about your payment or plan, please{' '}
              <Link href="mailto:billing@alojamento-insight.com" style={link}>
                contact our billing team
              </Link>
            </Text>

            <Text style={text}>
              Thank you for choosing Alojamento Insight Analyzer!
            </Text>

            <Text style={text}>
              Best regards,
              <br />
              The Alojamento Insight Team
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              This is a receipt for your payment. Keep this email for your records.
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

export default PaymentConfirmationEmail;

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
  backgroundColor: '#7c3aed',
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

const successBadge = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const successIcon = {
  backgroundColor: '#10b981',
  borderRadius: '50%',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '32px',
  fontWeight: 'bold',
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

const amountBox = {
  backgroundColor: '#f0fdf4',
  border: '2px solid #10b981',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const amountLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const amountValue = {
  color: '#10b981',
  fontSize: '36px',
  fontWeight: 'bold',
  margin: '0',
};

const infoBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const infoTable = {
  width: '100%',
};

const infoLabel = {
  color: '#6b7280',
  fontSize: '14px',
  fontWeight: 'bold',
  padding: '8px 0',
  width: '40%',
};

const infoValue = {
  color: '#1f2937',
  fontSize: '14px',
  padding: '8px 0',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#7c3aed',
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

const list = {
  color: '#4b5563',
  fontSize: '15px',
  lineHeight: '22px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '8px',
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
