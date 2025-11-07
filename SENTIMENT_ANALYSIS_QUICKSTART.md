# Sentiment Analysis - Quick Start Guide

## 5-Minute Setup

### Step 1: Get Hugging Face API Key (1 minute)

1. Visit https://huggingface.co/join
2. Sign up or log in
3. Go to https://huggingface.co/settings/tokens
4. Click "New token"
5. Name it "alojamento-sentiment" and select "read" role
6. Copy the token

### Step 2: Configure Environment (1 minute)

Add to your `.env` file:

```bash
VITE_HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

For Supabase edge function:

```bash
supabase secrets set HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Deploy Edge Function (1 minute)

```bash
cd supabase
supabase functions deploy analyze-sentiment
```

### Step 4: Run Database Migration (1 minute)

```bash
supabase db push
```

This creates all necessary tables, functions, and views.

### Step 5: Test the System (1 minute)

#### Test the Service

```typescript
// In your React app or Node.js script
import { analyzeSentiment } from '@/services/sentimentAnalysis';

const result = await analyzeSentiment('Amazing property! Very clean and comfortable.');
console.log(result);
// Output: { score: 0.92, label: 'positive', confidence: 0.94 }
```

#### Test the UI Component

```tsx
// Add to any page
import SentimentAnalysisDashboard from '@/components/results/SentimentAnalysisDashboard';

function MyPage() {
  return (
    <div>
      <SentimentAnalysisDashboard propertyId="your-property-id" />
    </div>
  );
}
```

#### Test the Edge Function

```bash
curl -X POST https://your-project.supabase.co/functions/v1/analyze-sentiment \
  -H "Content-Type: application/json"
```

## Verify Installation

### Check Database

```sql
-- Verify tables exist
SELECT * FROM fact_sentiment_topics LIMIT 1;

-- Verify functions exist
SELECT * FROM get_sentiment_summary('property-id', CURRENT_DATE - 30, CURRENT_DATE);

-- Verify views exist
SELECT * FROM sentiment_property_overview LIMIT 1;
```

### Check Edge Function

```bash
# View logs
supabase functions logs analyze-sentiment --tail

# Manually trigger
supabase functions invoke analyze-sentiment
```

## Common Issues

### Issue: "Model is loading"

**Solution:** The Hugging Face model takes 20-60 seconds to load on first use. Wait and retry automatically handled by the code.

### Issue: "API key not found"

**Solution:**
```bash
# Check if key is set
echo $VITE_HUGGINGFACE_API_KEY

# Re-set the key
export VITE_HUGGINGFACE_API_KEY=your_key_here
```

### Issue: "No sentiment data available"

**Solution:**
1. Ensure reviews exist in `fact_reviews` table with `review_text`
2. Manually run edge function: `supabase functions invoke analyze-sentiment`
3. Check edge function logs for errors

### Issue: Rate limit errors

**Solution:**
- Free tier has ~100 requests/hour
- Wait or upgrade to paid plan
- Reduce batch sizes in edge function

## Next Steps

1. **Schedule Daily Processing**
   - Set up cron job in Supabase dashboard
   - Schedule: `0 2 * * *` (daily at 2 AM)

2. **Add to Premium Reports**
   - Sentiment analysis auto-included if data exists
   - See `SENTIMENT_ANALYSIS_GUIDE.md` for details

3. **Customize Topics**
   - Edit `REVIEW_TOPICS` in `sentimentAnalysis.ts`
   - Update topic keywords for your use case

4. **Explore Advanced Features**
   - Competitor sentiment comparison
   - Sentiment-based alerts
   - Custom dashboards

## Resources

- Full Documentation: `SENTIMENT_ANALYSIS_GUIDE.md`
- Hugging Face Docs: https://huggingface.co/docs/api-inference
- Model Info: https://huggingface.co/cardiffnlp/twitter-xlm-roberta-base-sentiment

## Getting Help

If you encounter issues:

1. Check the troubleshooting section in `SENTIMENT_ANALYSIS_GUIDE.md`
2. Review edge function logs: `supabase functions logs analyze-sentiment`
3. Test the Hugging Face API directly: https://huggingface.co/cardiffnlp/twitter-xlm-roberta-base-sentiment

## Performance Tips

- **Batch Processing**: Process 50-100 reviews at a time
- **Caching**: Automatic 24-hour cache for repeated analysis
- **Rate Limiting**: Built-in 150ms delay between requests
- **Fallback**: Keyword-based analysis if API fails

## Example Output

```json
{
  "overall_score": 0.73,
  "overall_category": "positive",
  "total_mentions": 234,
  "positive_count": 180,
  "neutral_count": 34,
  "negative_count": 20,
  "topic_scores": {
    "Cleanliness": { "score": 0.85, "mentions": 45, "category": "positive" },
    "Location": { "score": 0.72, "mentions": 38, "category": "positive" },
    "Value": { "score": 0.68, "mentions": 42, "category": "positive" },
    "Amenities": { "score": 0.55, "mentions": 29, "category": "neutral" },
    "Communication": { "score": 0.41, "mentions": 31, "category": "neutral" },
    "Check-in": { "score": -0.15, "mentions": 26, "category": "negative" },
    "Accuracy": { "score": 0.78, "mentions": 23, "category": "positive" }
  }
}
```

Congratulations! Your sentiment analysis system is now fully operational.
