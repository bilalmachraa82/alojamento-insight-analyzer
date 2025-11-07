-- Create email notifications table for tracking email delivery
CREATE TABLE IF NOT EXISTS public.email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'report_ready', 'payment_confirmation', 'password_reset', 'diagnostic_submission')),
  subject TEXT NOT NULL,
  template_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'opened', 'clicked')),
  resend_id TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_email_notifications_user_id ON public.email_notifications(user_id);
CREATE INDEX idx_email_notifications_email ON public.email_notifications(email);
CREATE INDEX idx_email_notifications_status ON public.email_notifications(status);
CREATE INDEX idx_email_notifications_email_type ON public.email_notifications(email_type);
CREATE INDEX idx_email_notifications_created_at ON public.email_notifications(created_at);
CREATE INDEX idx_email_notifications_resend_id ON public.email_notifications(resend_id) WHERE resend_id IS NOT NULL;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_email_notifications_updated_at
  BEFORE UPDATE ON public.email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_updated_at();

-- Create email preferences table
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  marketing_emails BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  report_notifications BOOLEAN DEFAULT true,
  payment_notifications BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create indexes for email preferences
CREATE INDEX idx_email_preferences_user_id ON public.email_preferences(user_id);
CREATE INDEX idx_email_preferences_email ON public.email_preferences(email);

-- Create updated_at trigger for email preferences
CREATE TRIGGER trigger_email_preferences_updated_at
  BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_updated_at();

-- Create function to check if user wants to receive emails
CREATE OR REPLACE FUNCTION should_send_email(
  p_email TEXT,
  p_email_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_preferences RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO v_preferences
  FROM public.email_preferences
  WHERE email = p_email;

  -- If no preferences found, default to sending
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Check if unsubscribed
  IF v_preferences.unsubscribed_at IS NOT NULL THEN
    -- Always send security alerts even if unsubscribed
    IF p_email_type IN ('password_reset', 'security_alert') THEN
      RETURN TRUE;
    END IF;
    RETURN FALSE;
  END IF;

  -- Check specific preferences
  CASE p_email_type
    WHEN 'welcome' THEN
      RETURN v_preferences.product_updates;
    WHEN 'report_ready' THEN
      RETURN v_preferences.report_notifications;
    WHEN 'payment_confirmation' THEN
      RETURN v_preferences.payment_notifications;
    WHEN 'password_reset' THEN
      RETURN v_preferences.security_alerts;
    WHEN 'diagnostic_submission' THEN
      RETURN v_preferences.report_notifications;
    ELSE
      RETURN TRUE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create function to retry failed emails
CREATE OR REPLACE FUNCTION retry_failed_emails()
RETURNS TABLE(
  notification_id UUID,
  email TEXT,
  email_type TEXT,
  retry_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_notifications
  SET
    status = 'pending',
    retry_count = retry_count + 1,
    updated_at = NOW()
  WHERE
    status = 'failed'
    AND retry_count < max_retries
    AND created_at > NOW() - INTERVAL '7 days'
  RETURNING id, email_notifications.email, email_notifications.email_type, email_notifications.retry_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- Users can view their own email notifications
CREATE POLICY "Users can view their own notifications"
  ON public.email_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view their own email preferences
CREATE POLICY "Users can view their own preferences"
  ON public.email_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own email preferences
CREATE POLICY "Users can update their own preferences"
  ON public.email_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own email preferences
CREATE POLICY "Users can insert their own preferences"
  ON public.email_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can do anything (for edge functions)
CREATE POLICY "Service role can manage notifications"
  ON public.email_notifications
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can manage preferences"
  ON public.email_preferences
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Grant permissions
GRANT ALL ON public.email_notifications TO service_role;
GRANT ALL ON public.email_preferences TO service_role;
GRANT SELECT ON public.email_notifications TO authenticated;
GRANT ALL ON public.email_preferences TO authenticated;
