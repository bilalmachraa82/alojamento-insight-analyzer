# Manual Testing Guide

## Overview
This guide walks you through end-to-end testing of the Alojamento Insight Analyzer platform to ensure everything is working correctly before production launch.

---

## Prerequisites

✅ **Before you start:**
- [ ] All environment variables are set (see [README.md](../README.md#1-environment-variables))
- [ ] Database migrations are applied (`supabase db push`)
- [ ] Edge function secrets are configured
- [ ] Apify actors are installed in your account
- [ ] Development server is running (`npm run dev`)

---

## Test Suite 1: Local Development Stack

### 1.1 Environment Setup
```bash
# Clone and install
git clone <repo-url>
cd <project-folder>
npm install

# Copy environment file
cp .env.example .env
# Fill in: VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
```

**Expected Result:**
- ✅ No errors during `npm install`
- ✅ `.env` file exists with all required variables

### 1.2 Quality Gates
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build
npm run build
```

**Expected Result:**
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Build completes successfully with dist/ folder created

### 1.3 Development Server
```bash
npm run dev
```

**Expected Result:**
- ✅ Server starts on http://localhost:5173
- ✅ No console errors in terminal
- ✅ Homepage loads without errors

---

## Test Suite 2: Diagnostic Form Submission

### 2.1 Valid Airbnb URL
**Test Case:** Submit a valid Airbnb property URL

**Steps:**
1. Go to http://localhost:5173
2. Fill form:
   - Name: `Test User`
   - Email: `test@example.com`
   - Platform: `Airbnb`
   - URL: `https://www.airbnb.com/rooms/12345678`
3. Submit form

**Expected Result:**
- ✅ Toast appears: "Diagnóstico enviado com sucesso!"
- ✅ Success page shows or loading indicator appears
- ✅ Check Supabase dashboard → Table Editor → `diagnostic_submissions`:
  - New row exists
  - `status` = `pending` or `processing`
  - `platform` = `airbnb`

**Screenshots to capture:**
- [ ] Form filled out
- [ ] Success toast
- [ ] Supabase table with new row

---

### 2.2 Valid Booking.com URL
**Test Case:** Submit a valid Booking.com hotel URL

**Steps:**
1. Go to homepage
2. Fill form:
   - Name: `Test User 2`
   - Email: `test2@example.com`
   - Platform: `Booking.com`
   - URL: `https://www.booking.com/hotel/pt/example-hotel.html`
3. Submit form

**Expected Result:**
- ✅ Success toast appears
- ✅ New row in `diagnostic_submissions` with status `pending`/`processing`

---

### 2.3 Invalid Booking.com Share URL (Should Fail)
**Test Case:** Submit a Booking.com share link (should be blocked)

**Steps:**
1. Go to homepage
2. Fill form:
   - URL: `https://www.booking.com/Share-abc123`
3. Submit form

**Expected Result:**
- ✅ Toast appears: "⚠️ Link Encurtado Não Permitido"
- ✅ Description explains to use full URL
- ✅ Form submission is blocked (no new row in database)
- ✅ Toast visible for 8 seconds

**Screenshot:**
- [ ] Error toast with correct message

---

### 2.4 Invalid Booking.com URL (Missing /hotel/)
**Test Case:** Submit Booking.com URL without `/hotel/` path

**Steps:**
1. Fill form with: `https://www.booking.com/searchresults.html?...`
2. Submit

**Expected Result:**
- ✅ Toast: "⚠️ URL do Booking.com Inválido"
- ✅ Message explains URL must contain '/hotel/'
- ✅ No database row created

---

### 2.5 Malformed URL
**Test Case:** Submit completely invalid URL

**Steps:**
1. Fill form with: `not-a-url`
2. Submit

**Expected Result:**
- ✅ Form validation error appears (HTML5 or custom validation)
- ✅ Form does not submit

---

## Test Suite 3: Edge Functions Pipeline

### 3.1 Process Diagnostic Function
**Test Case:** Verify `process-diagnostic` edge function starts Apify scraping

**Steps:**
1. Submit a valid Booking.com URL (see Test 2.2)
2. Go to Supabase dashboard → Edge Functions → Logs
3. Filter to `process-diagnostic`
4. Check logs for the submission ID

**Expected Result:**
- ✅ Log: "Processing diagnostic submission: {id}"
- ✅ Log: "Processing URL: {url}"
- ✅ Log: "Starting Apify scraping process"
- ✅ Log: "Property data collection started"
- ✅ Response: `{"success":true,"runId":"...","actorId":"..."}`

**If logs show error:**
- ❌ "Missing submission ID" → Check form submission
- ❌ "Missing environment variables" → Check `APIFY_API_TOKEN` in edge function secrets
- ❌ "Booking.com share URL detected" → Expected for test 2.3, issue if seen for valid URL

---

### 3.2 Check Scrape Status Function
**Test Case:** Verify Apify scraping completes and data is processed

**Steps:**
1. Wait 30-60 seconds after submission
2. Go to Supabase dashboard → Edge Functions → `check-scrape-status` → Logs
3. Look for logs related to your submission ID

**Expected Result:**
- ✅ Log: "Processing Voyager Booking Reviews data" (or similar)
- ✅ Log: "Processed property info: {...}"
- ✅ Log: "Triggering Claude analysis for submission: {id}"
- ✅ Database update: `status` → `scraping_completed`
- ✅ Database: `property_data` JSON field populated

**Check in Supabase Table Editor:**
```sql
SELECT id, status, property_data, updated_at
FROM diagnostic_submissions
WHERE id = '{your-submission-id}'
ORDER BY updated_at DESC;
```

**Expected `property_data` structure:**
```json
{
  "property_data": {
    "property_name": "Example Hotel",
    "location": "Lisbon, Portugal",
    "rating": 4.5,
    "review_count": 123,
    "reviews": [...]
  },
  "completed_at": "2025-10-16T14:30:00Z"
}
```

---

### 3.3 Analyze Property Claude Function
**Test Case:** Verify Claude AI analysis completes

**Steps:**
1. Wait 1-2 minutes after scraping completes
2. Check `analyze-property-claude` logs
3. Look for your submission ID

**Expected Result:**
- ✅ Log: "Analyzing property data with Claude for submission: {id}"
- ✅ Log: "Sending request to Claude API"
- ✅ Log: "Received response from Claude API"
- ✅ Log: "Successfully parsed Claude analysis JSON"
- ✅ Log: "Updating submission with Claude analysis results"
- ✅ Log: "Triggering premium PDF generation for submission: {id}"
- ✅ Database: `status` → `completed`
- ✅ Database: `analysis_result` JSON field populated

**Check in database:**
```sql
SELECT id, status, analysis_result, updated_at
FROM diagnostic_submissions
WHERE id = '{your-submission-id}';
```

**Expected `analysis_result` structure:**
```json
{
  "health_score": {
    "total": 75,
    "breakdown": {...},
    "categoria": "bom"
  },
  "diagnostico_inicial": {...},
  "reputacao_reviews": {...},
  "kpis_acompanhamento": {...}
}
```

**If Claude analysis fails:**
- ❌ "Missing required environment variables" → Check `CLAUDE_API_KEY`
- ❌ "No property data found" → Scraping failed, check previous step
- ❌ HTTP 401 from Claude → API key invalid
- ❌ HTTP 429 from Claude → Rate limit exceeded, wait and retry

---

### 3.4 Generate Premium PDF Function
**Test Case:** Verify HTML report generation

**Steps:**
1. After Claude analysis completes, check `generate-premium-pdf` logs
2. Look for your submission ID

**Expected Result:**
- ✅ Log: "Generating premium PDF for submission: {id}"
- ✅ Log: "HTML generated successfully, size: {X} bytes"
- ✅ Log: "Premium report generated successfully"
- ✅ Database: `premium_report_url` field populated
- ✅ Database: `report_generated_at` timestamp set

**Check in database:**
```sql
SELECT id, premium_report_url, report_generated_at
FROM diagnostic_submissions
WHERE id = '{your-submission-id}';
```

**Test PDF access:**
1. Copy the `premium_report_url` from database
2. Open in browser (incognito mode to test public access)
3. Verify HTML report loads with all sections

**Expected Report Sections:**
- ✅ Property name in header
- ✅ Health Score circle with number
- ✅ Diagnóstico Inicial section
- ✅ Reputação & Reviews section
- ✅ Estratégia de Preços table
- ✅ KPIs & Acompanhamento section

**If PDF generation fails:**
- ❌ "Bucket not found" → Run storage migration or create bucket manually
- ❌ "Row level security policy violation" → Check RLS policies on storage.objects
- ❌ Report URL is 404 → Bucket not public or file wasn't uploaded

---

## Test Suite 4: Results Page Experience

### 4.1 View Pending/Processing Submission
**Test Case:** View results page while analysis is in progress

**Steps:**
1. Submit a new diagnostic (get submission ID from database or URL)
2. Go to: `http://localhost:5173/results/{submission-id}`

**Expected Result:**
- ✅ Header shows: "Análise da Propriedade"
- ✅ Property name displayed (or "Propriedade" if not yet scraped)
- ✅ Processing status component shows:
  - "Análise em Andamento"
  - Progress bar animating
  - Current status message (e.g., "Recolhendo dados da propriedade...")
- ✅ Refresh button visible
- ✅ Clicking refresh updates status

---

### 4.2 View Completed Submission (Basic View)
**Test Case:** View completed analysis without premium report

**Steps:**
1. Go to results page for a completed submission
2. Verify all sections render

**Expected Result:**
- ✅ Property name, location, type displayed
- ✅ Rating shown (⭐ X / 5)
- ✅ Performance metrics section shows data
- ✅ Recommendations list rendered
- ✅ Pricing strategy table displayed
- ✅ Competitor analysis visible
- ✅ "Upgrade to Premium" CTA appears (if using mock data)

---

### 4.3 View Premium Submission
**Test Case:** View completed analysis with premium report

**Steps:**
1. Go to results page for submission with `premium_report_url`
2. Check for premium report viewer

**Expected Result:**
- ✅ "Download Premium Report" button visible
- ✅ Clicking button opens report in new tab
- ✅ Enhanced KPI sections show real data (not mocked)

---

### 4.4 View Manual Review Status
**Test Case:** View submission marked for manual review

**Steps:**
1. Submit a URL that will trigger manual review (e.g., unsupported platform)
2. Go to results page

**Expected Result:**
- ✅ Yellow warning icon ⚠️
- ✅ Message: "Precisamos da sua ajuda"
- ✅ Explanation of why manual review is needed
- ✅ Button: "Solicitar análise manual"
- ✅ Alternative button: "Tentar com outro link"

---

### 4.5 Request Manual Analysis
**Test Case:** Trigger manual review request

**Steps:**
1. On a manual review page, click "Solicitar análise manual"

**Expected Result:**
- ✅ Toast: "Solicitação enviada"
- ✅ Database: `status` → `manual_review_requested`
- ✅ Page refreshes after 1 second
- ✅ Button disappears, message updates to: "Seu pedido de análise manual foi registrado"

---

## Test Suite 5: Premium PDF Test Page

### 5.1 Generate PDF for Existing Submission
**Test Case:** Use `/test-pdf` page to regenerate report

**Steps:**
1. Go to: `http://localhost:5173/test-pdf`
2. Enter a submission ID with completed analysis
3. Click "Gerar PDF"

**Expected Result:**
- ✅ Loading indicator appears
- ✅ Toast: "PDF Gerado com Sucesso!"
- ✅ Green alert box with download link appears
- ✅ Clicking link opens report in new tab
- ✅ Report loads correctly with all data

---

### 5.2 Test with Latest Completed Submission
**Test Case:** Auto-select most recent completed submission

**Steps:**
1. Go to `/test-pdf`
2. Click "Testar com Última Submissão Completa"

**Expected Result:**
- ✅ System finds most recent completed submission
- ✅ Submission ID field auto-populates
- ✅ PDF generates successfully
- ✅ Toast shows submission ID used

---

### 5.3 Error Handling - No Analysis
**Test Case:** Try to generate PDF for submission without analysis

**Steps:**
1. Go to `/test-pdf`
2. Enter ID of pending submission (no `analysis_result`)
3. Click "Gerar PDF"

**Expected Result:**
- ✅ Error toast: "Erro ao Gerar PDF"
- ✅ Description: "Esta submissão ainda não tem análise completa"

---

## Test Suite 6: Database & KPI System

### 6.1 Daily Ingest Function
**Test Case:** Manually trigger data ingestion

**Steps:**
1. Ensure you have at least one completed submission
2. Go to Supabase dashboard → SQL Editor
3. Run:
   ```sql
   SELECT net.http_post(
     url := 'https://your-project.supabase.co/functions/v1/daily-ingest',
     headers := jsonb_build_object(
       'Authorization',
       'Bearer ' || current_setting('app.settings.service_role_key')
     )
   );
   ```

**Expected Result:**
- ✅ Function returns success response
- ✅ `daily-ingest` logs show:
  - "Starting daily-ingest process..."
  - "Found X submissions to process"
  - "Successfully processed submission {id} for property {property_id}"
  - "Refreshing KPI views..."
  - "KPI views refreshed successfully"

**Check fact tables populated:**
```sql
-- Check fact_daily
SELECT * FROM fact_daily ORDER BY date DESC LIMIT 10;

-- Check fact_channel_daily
SELECT * FROM fact_channel_daily ORDER BY date DESC LIMIT 10;

-- Check dim_property
SELECT * FROM dim_property LIMIT 10;
```

**Expected:**
- ✅ New rows in `fact_daily` with today's date
- ✅ New rows in `fact_channel_daily` distributed across channels
- ✅ New rows in `dim_property` (one per processed submission)

---

### 6.2 KPI Views
**Test Case:** Verify materialized views are updated

**Steps:**
```sql
-- Check KPI daily
SELECT * FROM kpi_daily ORDER BY date DESC LIMIT 5;

-- Check KPI aggregated
SELECT * FROM kpi_aggregated LIMIT 5;

-- Check KPI comp set daily
SELECT * FROM kpi_comp_set_daily ORDER BY date DESC LIMIT 5;
```

**Expected Result:**
- ✅ All views return data
- ✅ Calculations look reasonable (no negative revenues, occupancy 0-100%, etc.)
- ✅ Date ranges match fact table data

---

## Test Suite 7: Security & RLS

### 7.1 Anon Key Cannot Write to Protected Tables
**Test Case:** Verify RLS prevents unauthorized writes

**Steps:**
1. Get your Supabase anon key from dashboard
2. Try to insert directly into `fact_daily`:
   ```bash
   curl -X POST "https://your-project.supabase.co/rest/v1/fact_daily" \
     -H "apikey: {ANON_KEY}" \
     -H "Authorization: Bearer {ANON_KEY}" \
     -H "Content-Type: application/json" \
     -d '{
       "property_id": "00000000-0000-0000-0000-000000000000",
       "date": "2025-10-16",
       "rooms_available": 1,
       "rooms_sold": 1,
       "room_revenue": 100,
       "total_revenue": 100
     }'
   ```

**Expected Result:**
- ✅ HTTP 403 or 401 error
- ✅ Error message: "new row violates row-level security policy" or similar

---

### 7.2 Storage Bucket Public Read
**Test Case:** Verify premium reports are publicly readable

**Steps:**
1. Get a `premium_report_url` from database
2. Open in incognito browser (unauthenticated)

**Expected Result:**
- ✅ Report loads successfully
- ✅ No authentication required

---

### 7.3 Storage Bucket Cannot Be Written Without Service Role
**Test Case:** Verify anon key cannot upload to storage

**Steps:**
```bash
curl -X POST "https://your-project.supabase.co/storage/v1/object/premium-reports/test.html" \
  -H "Authorization: Bearer {ANON_KEY}" \
  -H "Content-Type: text/html" \
  -d "<html><body>Test</body></html>"
```

**Expected Result:**
- ✅ HTTP 403 error
- ✅ Error: "row-level security policy violation" or "not authorized"

---

## Test Suite 8: Error Recovery & Edge Cases

### 8.1 Reprocess Stuck Submission
**Test Case:** Use `reprocess-submission` function to retry failed submission

**Steps:**
1. Find a stuck submission (status = `processing` for > 30 min)
2. Go to Supabase SQL Editor
3. Run:
   ```sql
   SELECT net.http_post(
     url := 'https://your-project.supabase.co/functions/v1/reprocess-submission',
     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')),
     body := jsonb_build_object('submissionId', '{stuck-submission-id}')
   );
   ```

**Expected Result:**
- ✅ Function returns success
- ✅ `process-diagnostic` function is triggered again
- ✅ Submission status resets to `processing`
- ✅ Pipeline runs from start

---

### 8.2 Handle Missing Environment Variables Gracefully
**Test Case:** Verify edge functions fail fast with clear error

**Steps:**
1. Temporarily remove `APIFY_API_TOKEN` from edge function secrets
2. Submit a new diagnostic
3. Check logs

**Expected Result:**
- ✅ Log: "❌ Missing required environment variables: APIFY_API_TOKEN"
- ✅ Log shows instructions on how to fix
- ✅ Function returns HTTP 500 with clear error message
- ✅ No silent failure

---

## Test Suite 9: CI/CD Workflow

### 9.1 GitHub Actions
**Test Case:** Verify CI workflow runs on push

**Steps:**
1. Make a small code change (e.g., add comment to README)
2. Commit and push to GitHub
3. Go to: https://github.com/{your-repo}/actions
4. Check latest workflow run

**Expected Result:**
- ✅ Workflow triggers automatically
- ✅ All jobs pass:
  - ✅ Checkout repository
  - ✅ Setup Node.js
  - ✅ Install dependencies
  - ✅ Type check
  - ✅ Lint
- ✅ Green checkmark on commit in GitHub

---

## Summary Checklist

After completing all test suites, verify:

- [ ] **Local stack works** - npm install, typecheck, lint, build, dev all succeed
- [ ] **Form validation works** - Invalid URLs blocked with clear messages
- [ ] **Edge functions work** - All 4 main functions execute without errors
- [ ] **Scraping works** - Apify returns property data successfully
- [ ] **AI analysis works** - Claude returns structured JSON analysis
- [ ] **PDF generation works** - HTML reports generate and are publicly accessible
- [ ] **Results page works** - All states (pending, processing, completed, manual review) render correctly
- [ ] **KPI system works** - Daily ingest populates fact tables and refreshes views
- [ ] **Security works** - RLS prevents unauthorized access, storage bucket has correct policies
- [ ] **Error handling works** - Failed submissions show helpful messages, stuck submissions can be reprocessed
- [ ] **CI/CD works** - GitHub Actions runs successfully on every push

---

## Reporting Issues

If any test fails:

1. **Capture evidence:**
   - Screenshot of error
   - Console logs (browser + edge function)
   - Database state (relevant table rows)
   - Network requests (if applicable)

2. **Document steps to reproduce:**
   - What test were you running?
   - What was the exact input?
   - What happened vs what should have happened?

3. **Check common fixes:**
   - Is `.env` configured correctly?
   - Are edge function secrets set in Supabase dashboard?
   - Are database migrations applied?
   - Is storage bucket created?

4. **File issue on GitHub** with all evidence and reproduction steps

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Review [README.md](../README.md) production checklist
2. ✅ Set up monitoring (track success/failure rates)
3. ✅ Configure cron for `daily-ingest`
4. ✅ Deploy to production via Lovable
5. ✅ Run smoke tests in production
6. ✅ Set up alerting for stuck submissions

🎉 **Your platform is ready for launch!**
