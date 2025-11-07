import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface WelcomeEmailProps {
  userName?: string;
  userEmail?: string;
  loginUrl?: string;
}

export const WelcomeEmail = ({
  userName = 'User',
  userEmail = 'user@example.com',
  loginUrl = 'https://app.alojamento-insight.com/login',
}: WelcomeEmailProps) => {
  const previewText = `Welcome to Alojamento Insight Analyzer, ${userName}!`;

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
            <Heading style={h2}>Welcome aboard, {userName}!</Heading>

            <Text style={text}>
              Thank you for joining Alojamento Insight Analyzer. We're excited to help you
              optimize your property's performance with data-driven insights.
            </Text>

            <Text style={text}>
              With your account, you can:
            </Text>

            <ul style={list}>
              <li style={listItem}>
                <strong>Analyze Properties:</strong> Get comprehensive diagnostics for your
                vacation rentals
              </li>
              <li style={listItem}>
                <strong>Track Performance:</strong> Monitor key metrics like occupancy, ADR,
                and RevPAR
              </li>
              <li style={listItem}>
                <strong>Competitive Intelligence:</strong> See how you stack up against
                competitors
              </li>
              <li style={listItem}>
                <strong>Premium Reports:</strong> Generate detailed PDF reports with actionable
                recommendations
              </li>
            </ul>

            <Section style={buttonContainer}>
              <Button style={button} href={loginUrl}>
                Get Started
              </Button>
            </Section>

            <Text style={text}>
              If you have any questions, our support team is here to help at{' '}
              <Link href="mailto:support@alojamento-insight.com" style={link}>
                support@alojamento-insight.com
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
              You're receiving this email because you created an account at Alojamento Insight
              Analyzer.
            </Text>
            <Text style={footerText}>
              <Link href={`${loginUrl}/unsubscribe?email=${userEmail}`} style={footerLink}>
                Unsubscribe
              </Link>
              {' • '}
              <Link href={`${loginUrl}/preferences`} style={footerLink}>
                Email Preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
  backgroundColor: '#2563eb',
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

const list = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  paddingLeft: '20px',
};

const listItem = {
  marginBottom: '12px',
};

const buttonContainer = {
  padding: '27px 0',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
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
