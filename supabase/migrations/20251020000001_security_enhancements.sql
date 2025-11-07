-- Migration: Security Enhancements
-- Created: 2025-10-20
-- Description: Add security constraints, audit tables, and enhanced RLS policies

-- =====================================================
-- SECURITY AUDIT TABLES
-- =====================================================

-- Audit log for security events
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    status_code INTEGER,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX idx_security_audit_log_ip_address ON security_audit_log(ip_address);

-- API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '["read"]'::jsonb,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash) WHERE NOT revoked;
CREATE INDEX idx_api_keys_expires_at ON api_keys(expires_at) WHERE NOT revoked;

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- email or IP
    attempt_count INTEGER DEFAULT 1,
    last_attempt_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_failed_login_identifier ON failed_login_attempts(identifier);
CREATE INDEX idx_failed_login_locked_until ON failed_login_attempts(locked_until);

-- =====================================================
-- DATA INTEGRITY CONSTRAINTS
-- =====================================================

-- Add check constraints to dim_property
ALTER TABLE dim_property
ADD CONSTRAINT check_property_name_not_empty CHECK (length(trim(name)) > 0),
ADD CONSTRAINT check_property_url_format CHECK (url IS NULL OR url ~ '^https?://'),
ADD CONSTRAINT check_coordinates_valid CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
);

-- Add check constraints to fact_daily
ALTER TABLE fact_daily
ADD CONSTRAINT check_occupancy_valid CHECK (occupancy_rate >= 0 AND occupancy_rate <= 1),
ADD CONSTRAINT check_adr_positive CHECK (adr IS NULL OR adr >= 0),
ADD CONSTRAINT check_revenue_positive CHECK (total_revenue IS NULL OR total_revenue >= 0),
ADD CONSTRAINT check_rooms_positive CHECK (available_rooms IS NULL OR available_rooms >= 0);

-- Add check constraints to fact_reviews
ALTER TABLE fact_reviews
ADD CONSTRAINT check_rating_valid CHECK (rating >= 0 AND rating <= 10),
ADD CONSTRAINT check_sentiment_valid CHECK (sentiment_score >= -1 AND sentiment_score <= 1);

-- =====================================================
-- ENCRYPTION FOR SENSITIVE DATA
-- =====================================================

-- Create extension for encryption (if not exists)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(
        pgp_sym_encrypt(
            data,
            current_setting('app.encryption_key', true)
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        current_setting('app.encryption_key', true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENHANCED RLS POLICIES
-- =====================================================

-- Drop existing policies if needed (already exist from previous migration)
-- We'll add additional security policies

-- Policy to prevent viewing deleted properties
CREATE POLICY "Users cannot view deleted properties"
ON dim_property FOR SELECT
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Policy for admin access (if admin role exists)
CREATE POLICY "Admins can view all properties"
ON dim_property FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = auth.uid()
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- =====================================================
-- AUDIT TRIGGERS
-- =====================================================

-- Function to log data changes
CREATE OR REPLACE FUNCTION log_data_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO security_audit_log (
        event_type,
        user_id,
        details
    ) VALUES (
        TG_OP || '_' || TG_TABLE_NAME,
        auth.uid(),
        jsonb_build_object(
            'table', TG_TABLE_NAME,
            'operation', TG_OP,
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_dim_property
AFTER INSERT OR UPDATE OR DELETE ON dim_property
FOR EACH ROW EXECUTE FUNCTION log_data_change();

CREATE TRIGGER audit_fact_daily
AFTER INSERT OR UPDATE OR DELETE ON fact_daily
FOR EACH ROW EXECUTE FUNCTION log_data_change();

-- =====================================================
-- RATE LIMITING TABLES
-- =====================================================

-- Rate limit tracking (supplement to Redis)
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    limit_type VARCHAR(50) NOT NULL,
    violation_count INTEGER DEFAULT 1,
    first_violation_at TIMESTAMPTZ DEFAULT NOW(),
    last_violation_at TIMESTAMPTZ DEFAULT NOW(),
    blocked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_rate_limit_violations_identifier ON rate_limit_violations(identifier);
CREATE INDEX idx_rate_limit_violations_endpoint ON rate_limit_violations(endpoint);

-- =====================================================
-- SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user owns property
CREATE OR REPLACE FUNCTION check_property_ownership(p_property_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM dim_property
        WHERE property_id = p_property_id
        AND user_id = auth.uid()
        AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to sanitize user input
CREATE OR REPLACE FUNCTION sanitize_input(input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove control characters and trim
    RETURN trim(regexp_replace(input, '[\x00-\x1F\x7F]', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- PASSWORD POLICY
-- =====================================================

-- Function to validate password strength
CREATE OR REPLACE FUNCTION validate_password_strength(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        length(password) >= 12
        AND password ~ '[A-Z]'
        AND password ~ '[a-z]'
        AND password ~ '[0-9]'
        AND password ~ '[^A-Za-z0-9]'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- IP BLACKLIST/WHITELIST
-- =====================================================

CREATE TABLE IF NOT EXISTS ip_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    reason TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ip_blacklist_ip ON ip_blacklist(ip_address);
CREATE INDEX idx_ip_blacklist_expires ON ip_blacklist(expires_at) WHERE expires_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS ip_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ip_whitelist_ip ON ip_whitelist(ip_address);

-- Function to check if IP is blacklisted
CREATE OR REPLACE FUNCTION is_ip_blacklisted(check_ip INET)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM ip_blacklist
        WHERE ip_address = check_ip
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- WEBHOOKS & NOTIFICATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX idx_webhooks_active ON webhooks(active);

-- =====================================================
-- SESSION MANAGEMENT
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant access to security tables
GRANT SELECT, INSERT ON security_audit_log TO authenticated;
GRANT ALL ON api_keys TO authenticated;
GRANT SELECT, INSERT, UPDATE ON failed_login_attempts TO authenticated;
GRANT SELECT ON ip_blacklist TO authenticated;
GRANT SELECT ON ip_whitelist TO authenticated;
GRANT ALL ON webhooks TO authenticated;
GRANT ALL ON user_sessions TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE security_audit_log IS 'Audit log for all security-related events';
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON TABLE failed_login_attempts IS 'Track failed login attempts for account lockout';
COMMENT ON TABLE ip_blacklist IS 'Blacklisted IP addresses';
COMMENT ON TABLE ip_whitelist IS 'Whitelisted IP addresses';
COMMENT ON TABLE webhooks IS 'Webhook configurations for event notifications';
COMMENT ON TABLE user_sessions IS 'Active user sessions with timeout tracking';
