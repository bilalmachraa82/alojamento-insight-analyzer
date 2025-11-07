# Analyze Sentiment Edge Function

## Overview

This Supabase edge function processes guest reviews from the `fact_reviews` table, analyzes sentiment using the Hugging Face Inference API, and stores results in the `fact_sentiment_topics` table.

## Features

- Batch processing of up to 100 reviews per run
- Multilingual sentiment analysis (EN/PT)
- Topic extraction (7 predefined topics)
- Rate limiting and error handling
- Automatic retry for model loading
- Fallback to keyword-based analysis

## Configuration

### Environment Variables

Set the Hugging Face API key:

```bash
supabase secrets set HUGGINGFACE_API_KEY=your_key_here
```

### Deployment

Deploy the function:

```bash
supabase functions deploy analyze-sentiment --no-verify-jwt
```

### Scheduling

Create a cron job in Supabase dashboard:

1. Go to Database → Cron Jobs
2. Create new job with schedule: `0 2 * * *` (daily at 2 AM)
3. Add command:

```sql
SELECT net.http_post(
  url := 'https://your-project.supabase.co/functions/v1/analyze-sentiment',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{}'::jsonb
) as request_id;
```

## Manual Invocation

### Via CLI

```bash
# Invoke locally for testing
supabase functions serve analyze-sentiment

# Invoke deployed function
supabase functions invoke analyze-sentiment
```

### Via HTTP

```bash
curl -X POST https://your-project.supabase.co/functions/v1/analyze-sentiment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

### Via Supabase Client

```typescript
import { supabase } from '@/integrations/supabase/client';

const { data, error } = await supabase.functions.invoke('analyze-sentiment');
console.log(data);
```

## Response Format

### Success Response

```json
{
  "success": true,
  "processed": 87,
  "total": 100,
  "processing_time_ms": 45230,
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

### Error Response

```json
{
  "success": false,
  "processed": 12,
  "total": 100,
  "errors": [
    "Review abc123: Failed to analyze sentiment",
    "Review def456: Invalid review text"
  ],
  "timestamp": "2025-10-20T12:00:00.000Z"
}
```

## How It Works

1. **Fetch Reviews**: Retrieves up to 100 reviews from last 90 days that have `review_text`
2. **Analyze Sentiment**: Calls Hugging Face API for each review
3. **Extract Topics**: Identifies mentioned topics using keyword matching
4. **Analyze Topic Sentiment**: Analyzes sentiment for each mentioned topic
5. **Store Results**: Upserts data into `fact_sentiment_topics` table
6. **Return Summary**: Returns processing statistics

## Processing Logic

### Review Selection

```sql
SELECT id, property_id, date, platform, review_text, rating
FROM fact_reviews
WHERE review_text IS NOT NULL
  AND date >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY date DESC
LIMIT 100
```

### Topic Detection

Each review is scanned for keywords related to 7 topics:

- **Cleanliness**: clean, dirty, tidy, spotless, hygiene, limpo, sujo
- **Location**: location, situated, neighborhood, area, nearby, localização
- **Value**: value, price, worth, expensive, cheap, valor, preço
- **Amenities**: amenities, facilities, wifi, pool, parking, comodidades
- **Communication**: communication, host, responsive, helpful, comunicação
- **Check-in**: check-in, arrival, key, entrada, chegada
- **Accuracy**: accurate, description, photos, expected, preciso, descrição

### Sentiment Scoring

- API returns scores for positive, neutral, negative
- Normalized to -1 (negative) to +1 (positive)
- Score = positive_score - negative_score
- Categories: positive (≥0.3), neutral (-0.3 to 0.3), negative (≤-0.3)

## Rate Limiting

- 150ms delay between API calls
- Processes reviews sequentially to avoid rate limits
- Total processing time: ~15 seconds per 100 reviews

## Error Handling

### API Errors

- 503 (Model Loading): Automatic retry after 2 seconds
- Rate Limit: Logs error and continues with next review
- Network Error: Falls back to keyword-based analysis

### Database Errors

- Upsert errors logged but don't stop processing
- Continues with remaining reviews
- Returns list of errors in response

## Monitoring

### View Logs

```bash
supabase functions logs analyze-sentiment --tail
```

### Check Processing Status

```sql
-- Recently processed reviews
SELECT property_id, date, COUNT(*) as topics_analyzed
FROM fact_sentiment_topics
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY property_id, date
ORDER BY created_at DESC;

-- Processing statistics
SELECT
  COUNT(DISTINCT property_id) as properties_analyzed,
  COUNT(DISTINCT date) as days_analyzed,
  SUM(mention_count) as total_mentions
FROM fact_sentiment_topics;
```

## Performance

### Benchmarks

- 100 reviews: ~45 seconds
- Single review: ~450ms (including API call)
- API latency: 200-400ms per call
- Database operations: <50ms

### Optimization Tips

1. Reduce batch size for faster runs
2. Process only recent reviews (last 30 days)
3. Cache frequently accessed properties
4. Use connection pooling for database

## Troubleshooting

### "No reviews found to process"

**Cause**: No reviews with non-null `review_text` in date range

**Solution**:
- Check if reviews exist: `SELECT COUNT(*) FROM fact_reviews WHERE review_text IS NOT NULL`
- Verify date range in function code

### "Hugging Face API error"

**Cause**: API key invalid or rate limit exceeded

**Solution**:
- Verify API key: `supabase secrets list`
- Check Hugging Face dashboard for usage
- Upgrade plan if needed

### "Model is loading" repeatedly

**Cause**: Cold start or model not loaded

**Solution**:
- Wait 60 seconds for model to load
- Function automatically retries
- If persists, check Hugging Face status

### Slow processing

**Cause**: Too many reviews or network latency

**Solution**:
- Reduce `LIMIT 100` to smaller number
- Check network connectivity
- Monitor Hugging Face API response times

## Testing

### Unit Test

```typescript
// Test sentiment analysis
import { analyzeSentiment } from './index.ts';

const testReviews = [
  { text: 'Amazing stay!', expected: 'positive' },
  { text: 'Terrible experience.', expected: 'negative' },
  { text: 'It was okay.', expected: 'neutral' },
];

for (const test of testReviews) {
  const result = await analyzeSentiment(test.text);
  console.log(`Text: "${test.text}"`);
  console.log(`Expected: ${test.expected}, Got: ${result.label}`);
}
```

### Integration Test

```bash
# Run function locally
supabase functions serve analyze-sentiment &

# Test with curl
curl http://localhost:54321/functions/v1/analyze-sentiment \
  -H "Content-Type: application/json"
```

## Maintenance

### Regular Tasks

1. Monitor logs daily
2. Check error rates weekly
3. Review API usage monthly
4. Update keywords quarterly

### Upgrades

When updating the function:

```bash
# Test locally first
supabase functions serve analyze-sentiment

# Deploy when ready
supabase functions deploy analyze-sentiment

# Monitor logs
supabase functions logs analyze-sentiment --tail
```

## Cost Estimation

### Hugging Face API (Free Tier)

- ~100 requests per hour
- Function processes 100 reviews
- Daily run = well within free tier

### Paid Tier (if needed)

- Pro: $9/month - 10,000 requests/month
- Enterprise: Custom pricing

### Supabase

- Edge function invocations: Free up to 2M/month
- Database operations: Minimal cost
- Estimated cost: $0-9/month depending on volume

## Support

- Hugging Face API docs: https://huggingface.co/docs/api-inference
- Supabase functions docs: https://supabase.com/docs/guides/functions
- Model card: https://huggingface.co/cardiffnlp/twitter-xlm-roberta-base-sentiment
