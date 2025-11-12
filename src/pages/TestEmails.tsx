import React, { useState } from 'react';
import { render } from '@react-email/render';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import WelcomeEmail from '@/emails/WelcomeEmail';
import ReportReadyEmail from '@/emails/ReportReadyEmail';
import PaymentConfirmationEmail from '@/emails/PaymentConfirmationEmail';
import PasswordResetEmail from '@/emails/PasswordResetEmail';
import { emailService } from '@/services/emailService';
import MetaTags from '@/components/SEO/MetaTags';

export default function TestEmails() {
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testName, setTestName] = useState('John Doe');
  const [sending, setSending] = useState<string | null>(null);

  const emailTemplates = [
    {
      id: 'welcome',
      name: 'Welcome Email',
      description: 'Sent when a new user signs up',
      component: WelcomeEmail,
      previewProps: {
        userName: testName,
        userEmail: testEmail,
        loginUrl: window.location.origin,
      },
    },
    {
      id: 'report-ready',
      name: 'Report Ready Email',
      description: 'Sent when a property analysis report is complete',
      component: ReportReadyEmail,
      previewProps: {
        userName: testName,
        userEmail: testEmail,
        propertyName: 'Villa do Mar - Lagos',
        reportUrl: `${window.location.origin}/report/123`,
        submissionId: 'SUB-12345',
        reportType: 'premium' as const,
      },
    },
    {
      id: 'payment-confirmation',
      name: 'Payment Confirmation Email',
      description: 'Sent after a successful payment',
      component: PaymentConfirmationEmail,
      previewProps: {
        userName: testName,
        userEmail: testEmail,
        amount: 29.99,
        currency: 'EUR',
        transactionId: 'TXN-98765',
        planName: 'Premium Plan',
        paymentMethod: 'Credit Card ending in 4242',
        invoiceUrl: `${window.location.origin}/invoices/123`,
      },
    },
    {
      id: 'password-reset',
      name: 'Password Reset Email',
      description: 'Sent when a user requests a password reset',
      component: PasswordResetEmail,
      previewProps: {
        userName: testName,
        userEmail: testEmail,
        resetUrl: `${window.location.origin}/reset-password?token=abc123`,
        expiryHours: 24,
      },
    },
  ];

  const handleSendTestEmail = async (templateId: string) => {
    if (!testEmail || !testName) {
      toast.error('Please enter a test email and name');
      return;
    }

    setSending(templateId);

    try {
      let result;

      switch (templateId) {
        case 'welcome':
          result = await emailService.sendWelcomeEmail({
            email: testEmail,
            name: testName,
          });
          break;
        case 'report-ready':
          result = await emailService.sendReportReadyEmail(
            { email: testEmail, name: testName },
            {
              id: 'SUB-12345',
              propertyName: 'Villa do Mar - Lagos',
              reportUrl: `${window.location.origin}/report/123`,
              reportType: 'premium',
            }
          );
          break;
        case 'payment-confirmation':
          result = await emailService.sendPaymentConfirmationEmail(
            { email: testEmail, name: testName },
            {
              amount: 29.99,
              currency: 'EUR',
              transactionId: 'TXN-98765',
              planName: 'Premium Plan',
              paymentMethod: 'Credit Card ending in 4242',
              invoiceUrl: `${window.location.origin}/invoices/123`,
            }
          );
          break;
        case 'password-reset':
          result = await emailService.sendPasswordResetEmail(
            { email: testEmail, name: testName },
            'abc123'
          );
          break;
        default:
          throw new Error('Unknown template');
      }

      if (result.success) {
        toast.success(`Test email sent to ${testEmail}!`);
      } else {
        toast.error(`Failed to send email: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setSending(null);
    }
  };

  const handleCopyHTML = async (template: typeof emailTemplates[0]) => {
    const html = await render(React.createElement(template.component, template.previewProps));
    navigator.clipboard.writeText(html);
    toast.success('HTML copied to clipboard!');
  };

  const handleOpenInNewTab = async (template: typeof emailTemplates[0]) => {
    const html = await render(React.createElement(template.component, template.previewProps));
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <>
      <MetaTags
        title="Test Email Templates | Maria Faz"
        description="Internal testing page for email templates."
        noindex={true}
      />
      <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Email Templates</h1>
          <p className="text-muted-foreground">
            Preview and test all email templates used in the application
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure test data for email previews and sending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-name">Test Name</Label>
                <Input
                  id="test-name"
                  type="text"
                  placeholder="John Doe"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={emailTemplates[0].id} className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {emailTemplates.map((template) => (
              <TabsTrigger key={template.id} value={template.id}>
                {template.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {emailTemplates.map((template) => (
            <TabsContent key={template.id} value={template.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => handleOpenInNewTab(template)}
                        variant="default"
                      >
                        Open Preview
                      </Button>
                      <Button
                        onClick={() => handleSendTestEmail(template.id)}
                        variant="outline"
                        disabled={sending === template.id}
                      >
                        {sending === template.id ? 'Sending...' : 'Send Test Email'}
                      </Button>
                      <Button
                        onClick={() => handleCopyHTML(template)}
                        variant="outline"
                      >
                        Copy HTML
                      </Button>
                    </div>

                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2 border-b">
                        <p className="text-sm font-medium">Email Preview</p>
                      </div>
                      <div className="bg-gray-50 p-4" style={{ maxHeight: '600px', overflow: 'auto' }}>
                        <iframe
                          title={`${template.name} Preview`}
                          srcDoc={""}
                          style={{
                            width: '100%',
                            minHeight: '500px',
                            border: 'none',
                            backgroundColor: 'white',
                          }}
                        />
                      </div>
                    </div>

                    <div className="border rounded-lg">
                      <div className="bg-muted px-4 py-2 border-b">
                        <p className="text-sm font-medium">Template Properties</p>
                      </div>
                      <div className="p-4">
                        <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
                          {JSON.stringify(template.previewProps, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Email Notification System</CardTitle>
            <CardDescription>
              Information about the email notification system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Resend API integration for reliable email delivery</li>
                  <li>Automatic retry logic with exponential backoff</li>
                  <li>Rate limiting to prevent API throttling</li>
                  <li>Email preference management and opt-out support</li>
                  <li>Delivery tracking in the database</li>
                  <li>Beautiful, responsive HTML email templates</li>
                  <li>Plain text fallback support</li>
                  <li>Multiple language support (English and Portuguese)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Email Types:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Welcome Email:</strong> Sent when a new user creates an account</li>
                  <li><strong>Report Ready:</strong> Sent when a property analysis report is completed</li>
                  <li><strong>Payment Confirmation:</strong> Sent after a successful payment</li>
                  <li><strong>Password Reset:</strong> Sent when a user requests a password reset</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Configuration:</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  To enable email sending in production, set the following environment variable:
                </p>
                <code className="block bg-gray-100 p-2 rounded text-xs">
                  VITE_RESEND_API_KEY=your_resend_api_key_here
                </code>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Edge Function:</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  The <code>send-diagnostic-email</code> edge function handles sending emails
                  from the backend. Set the <code>RESEND_API_KEY</code> secret in Supabase.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
