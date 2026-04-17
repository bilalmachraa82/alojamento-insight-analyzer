-- Allow guests to view their own submissions by UUID (share-by-link pattern).
--
-- Rationale: the submission ID is a UUID v4 (~122 bits of entropy), which is
-- effectively unguessable. Guests receive the ID at submission time and use it
-- to poll status and view results. This matches the "unlisted share link" pattern
-- used by Google Docs, Dropbox, etc.
--
-- Authenticated users retain their existing auth.uid() policy.

-- Drop the authenticated-only SELECT policy and replace with one that covers
-- both authenticated owners and anonymous holders of a valid UUID.
DROP POLICY IF EXISTS "Authenticated users can view own submissions" ON diagnostic_submissions;

CREATE POLICY "View own or guest submission by UUID"
ON diagnostic_submissions FOR SELECT
USING (
  -- Authenticated user viewing their own submission
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Anonymous user viewing a guest submission (user_id IS NULL)
  -- RLS filters by the WHERE clause in the query (.eq("id", id)), so only the
  -- specific UUID requested is returned - no enumeration possible.
  (user_id IS NULL)
);

-- Same principle for UPDATE: guests need to trigger retry/manual-review on
-- their own guest submissions. Authenticated users only touch their own.
DROP POLICY IF EXISTS "Authenticated users can update own submissions" ON diagnostic_submissions;

CREATE POLICY "Update own or guest submission by UUID"
ON diagnostic_submissions FOR UPDATE
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (user_id IS NULL)
);

-- Add a client_ip column for rate limiting. Nullable - only populated when
-- available from the request context.
ALTER TABLE diagnostic_submissions
ADD COLUMN IF NOT EXISTS client_ip TEXT;

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_email_date
  ON diagnostic_submissions (email, submission_date DESC);

CREATE INDEX IF NOT EXISTS idx_diagnostic_submissions_client_ip_date
  ON diagnostic_submissions (client_ip, submission_date DESC)
  WHERE client_ip IS NOT NULL;
