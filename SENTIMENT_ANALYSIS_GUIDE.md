# Sentiment Analysis System - Implementation Guide

## Overview

The sentiment analysis system provides comprehensive NLP-powered analysis of guest reviews using the Hugging Face Inference API. It extracts sentiment scores, identifies key topics, and generates actionable insights for property improvement.

## Architecture

### Components

1. **Sentiment Analysis Service** (`src/services/sentimentAnalysis.ts`)
   - Core NLP processing using Hugging Face API
   - Topic extraction and categorization
   - Batch processing capabilities
   - Multilingual support (EN/PT)

2. **Edge Function** (`supabase/functions/analyze-sentiment/index.ts`)
   - Automated batch processing of reviews
   - Integration with Supabase database
   - Scheduled execution via cron jobs
   - Rate limiting and error handling

3. **Database Layer**
   - `fact_reviews` table: Raw review data
   - `fact_sentiment_topics` table: Processed sentiment data
   - SQL functions for aggregation and analysis
   - Views for quick data access

4. **UI Components** (`src/components/results/`)
   - `SentimentGauge.tsx`: Visual sentiment score display
   - `SentimentChart.tsx`: Trend visualization over time
   - `TopicSentimentCard.tsx`: Topic-specific sentiment cards
   - `ReviewInsights.tsx`: Key insights and action items

5. **React Hooks** (`src/hooks/analytics/useSentimentAnalysis.ts`)
   - Data fetching and state management
   - Real-time sentiment calculations
   - Trend analysis and comparisons

## Setup Instructions

### 1. Environment Configuration

Add the following environment variables:

```bash
# Hugging Face API Key (required)
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# For Supabase Edge Function
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
```

To get a Hugging Face API key:
1. Sign up at https://huggingface.co
2. Go to Settings → Access Tokens
3. Create a new token with "Read" permissions
4. Copy the token to your `.env` file

### 2. Database Migration

Run the sentiment analysis migration:

```bash
cd supabase
supabase db push
```

This creates:
- Sentiment aggregation functions
- Sentiment views
- Performance indexes

### 3. Deploy Edge Function

Deploy the sentiment analysis edge function:

```bash
supabase functions deploy analyze-sentiment --no-verify-jwt
```

Set the Hugging Face API key secret:

```bash
supabase secrets set HUGGINGFACE_API_KEY=your_key_here
```

### 4. Schedule Automated Analysis

Set up a cron job to run sentiment analysis daily:

```bash
# In Supabase Dashboard → Database → Cron Jobs
# Add a new job:
# Schedule: 0 2 * * * (daily at 2 AM)
# Command: SELECT net.http_post(
#   url := 'https://your-project.supabase.co/functions/v1/analyze-sentiment',
#   headers := '{"Content-Type": "application/json"}'::jsonb
# );
```

## Usage Examples

### Frontend: Display Sentiment Analysis

```tsx
import React from 'react';
import {
  useSentimentSummary,
  useSentimentTrend,
  useTopicTrends,
} from '@/hooks/analytics';
import SentimentGauge from '@/components/results/SentimentGauge';
import SentimentChart from '@/components/results/SentimentChart';
import { TopicSentimentGrid } from '@/components/results/TopicSentimentCard';
import ReviewInsights from '@/components/results/ReviewInsights';

function SentimentDashboard({ propertyId }: { propertyId: string }) {
  const dateRange = {
    start: '2025-09-01',
    end: '2025-10-20',
  };

  const previousPeriod = {
    start: '2025-07-01',
    end: '2025-08-31',
  };

  // Fetch sentiment data
  const { data: summary } = useSentimentSummary({ propertyId, dateRange });
  const { data: trend } = useSentimentTrend({ propertyId, dateRange });
  const { data: topics } = useTopicTrends(
    { propertyId, dateRange },
    previousPeriod
  );

  if (!summary || !trend || !topics) {
    return <div>Loading sentiment analysis...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Overall Sentiment Gauge */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Overall Guest Sentiment</h2>
        <SentimentGauge
          score={summary.overall_score}
          category={summary.overall_category}
          size="large"
        />
      </section>

      {/* Sentiment Trend Chart */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Sentiment Trend</h2>
        <SentimentChart data={trend} showCounts={true} />
      </section>

      {/* Topic Sentiment Cards */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Sentiment by Topic</h2>
        <TopicSentimentGrid topics={topics} />
      </section>

      {/* Insights and Actions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Insights & Recommendations</h2>
        <ReviewInsights
          topPositiveAspects={[
            'Exceptional cleanliness and attention to detail',
            'Perfect location near attractions',
            'Outstanding value for money',
          ]}
          areasForImprovement={[
            'Check-in process could be smoother',
            'Communication response time needs improvement',
          ]}
          notableQuotes={[
            {
              text: 'The property was spotlessly clean and the location was perfect for exploring the city!',
              sentiment: 'positive',
              date: '2025-10-15',
            },
            {
              text: 'Check-in instructions were unclear and we had trouble finding the key.',
              sentiment: 'negative',
              date: '2025-10-12',
            },
          ]}
          actionItems={[
            'Improve check-in instructions and provide clearer directions',
            'Implement automated messaging for faster guest communication',
            'Continue maintaining high cleanliness standards',
          ]}
        />
      </section>
    </div>
  );
}
```

### Backend: Manual Sentiment Analysis

```typescript
import { analyzeSentiment, batchAnalyzeReviews } from '@/services/sentimentAnalysis';

// Analyze a single review
const result = await analyzeSentiment(
  'The property was clean and comfortable. Great location!'
);
console.log(result);
// {
//   score: 0.85,
//   label: 'positive',
//   confidence: 0.92,
//   rawScores: { positive: 0.92, neutral: 0.05, negative: 0.03 }
// }

// Batch analyze multiple reviews
const reviews = [
  { id: '1', text: 'Amazing stay! Highly recommend.' },
  { id: '2', text: 'Terrible experience. Very disappointed.' },
  { id: '3', text: 'Decent place, nothing special.' },
];

const analyzed = await batchAnalyzeReviews(reviews);
console.log(analyzed);
// Array of AnalyzedReview objects with sentiment and topics
```

### SQL: Query Sentiment Data

```sql
-- Get sentiment summary for a property
SELECT * FROM get_sentiment_summary(
  'property-uuid-here',
  '2025-09-01'::DATE,
  '2025-10-20'::DATE
);

-- Get sentiment trend
SELECT * FROM get_sentiment_trend(
  'property-uuid-here',
  '2025-07-01'::DATE,
  '2025-10-20'::DATE
);

-- Get topic-specific sentiment
SELECT * FROM get_topic_sentiment(
  'property-uuid-here',
  'Cleanliness',
  '2025-09-01'::DATE,
  '2025-10-20'::DATE
);

-- Query views for quick insights
SELECT * FROM sentiment_property_overview
WHERE property_id = 'property-uuid-here';

SELECT * FROM sentiment_topic_summary
WHERE property_id = 'property-uuid-here'
ORDER BY avg_sentiment DESC;
```

## API Reference

### Sentiment Analysis Service

#### `analyzeSentiment(reviewText: string): Promise<SentimentResult>`
Analyzes sentiment of a single review text.

**Returns:**
```typescript
{
  score: number;        // -1 to +1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;   // 0 to 1
}
```

#### `extractTopics(reviewText: string): TopicMention[]`
Extracts mentioned topics from review.

**Returns:**
```typescript
{
  topic: ReviewTopic;
  mentioned: boolean;
  context?: string;
}[]
```

#### `batchAnalyzeReviews(reviews: Array<{id: string, text: string}>): Promise<AnalyzedReview[]>`
Analyzes multiple reviews in batch with rate limiting.

### React Hooks

#### `useSentimentSummary({ propertyId, dateRange })`
Returns overall sentiment summary with topic breakdowns.

#### `useSentimentTrend({ propertyId, dateRange })`
Returns daily sentiment scores for trend visualization.

#### `useTopicTrends({ propertyId, dateRange }, previousPeriod?)`
Returns sentiment scores for each topic with trend indicators.

#### `useSentimentInsights({ propertyId, dateRange })`
Generates actionable insights and recommendations.

## Predefined Topics

The system analyzes seven key aspects of guest reviews:

1. **Cleanliness** - Property hygiene and tidiness
2. **Location** - Proximity to attractions and convenience
3. **Value** - Price-to-quality ratio
4. **Amenities** - Facilities and features
5. **Communication** - Host responsiveness and clarity
6. **Check-in** - Arrival process and instructions
7. **Accuracy** - Match between listing and reality

## Sentiment Scoring

- **Score Range**: -1 (very negative) to +1 (very positive)
- **Categories**:
  - Positive: score >= 0.3
  - Neutral: -0.3 < score < 0.3
  - Negative: score <= -0.3

## Model Information

**Model**: `cardiffnlp/twitter-xlm-roberta-base-sentiment`
- Multilingual sentiment analysis
- Trained on 198M tweets in 8 languages
- Supports English and Portuguese (and more)
- Optimized for short-form text like reviews

## Performance Considerations

### Rate Limiting
- Minimum 150ms between API calls
- Batch processing handles 100 reviews at a time
- Edge function runs daily to avoid overwhelming the API

### Caching
- In-memory cache for repeated analysis
- 24-hour cache expiry
- Cache key based on review text (first 100 chars)

### Fallback Mechanism
- If Hugging Face API fails, falls back to keyword-based analysis
- Maintains functionality even during API outages
- Lower confidence scores for fallback results

## Troubleshooting

### "Model is loading" errors
The Hugging Face API may take 20-60 seconds to load a cold model. The system automatically retries after 2 seconds.

### API rate limits
The free tier of Hugging Face Inference API has rate limits. Consider:
- Upgrading to a paid plan for higher limits
- Reducing batch sizes
- Increasing delays between requests

### Missing sentiment data
Ensure:
1. Reviews have non-empty `review_text` field
2. Edge function has been deployed
3. Hugging Face API key is correctly set
4. Cron job is running

### Accuracy issues
To improve accuracy:
- Ensure review text is properly formatted
- Remove HTML tags or special characters
- Keep review text under 500 characters (truncated automatically)

## Premium Report Integration

Sentiment analysis is automatically included in premium reports when data is available:

```typescript
import { PremiumReportGenerator, SentimentAnalysisData } from '@/services/premiumReportGenerator';

const sentimentData: SentimentAnalysisData = {
  overall_sentiment: {
    score: 0.75,
    category: 'positive',
    trend: 'improving',
  },
  topic_scores: [
    { topic: 'Cleanliness', score: 0.85, mention_count: 45, trend: 'stable' },
    { topic: 'Location', score: 0.72, mention_count: 38, trend: 'improving' },
    // ... more topics
  ],
  key_insights: {
    top_positive_aspects: ['Exceptional cleanliness', 'Great location'],
    areas_for_improvement: ['Check-in process', 'Communication'],
    notable_quotes: [/* ... */],
  },
  action_items: [/* ... */],
};

const premiumData = {
  // ... other premium data
  sentiment_analysis: sentimentData,
};

const html = PremiumReportGenerator.generatePremiumHTML(premiumData);
```

## Future Enhancements

Potential improvements to consider:

1. **Word Cloud Generation** - Visualize frequent positive/negative terms
2. **Competitor Sentiment Comparison** - Compare sentiment across properties
3. **Automated Response Suggestions** - AI-generated responses to negative reviews
4. **Real-time Alerts** - Notifications for sudden sentiment drops
5. **Language Detection** - Automatic detection and handling of more languages
6. **Aspect-based Sentiment** - More granular sentiment within each topic
7. **Sentiment-based Review Prioritization** - Flag reviews needing immediate attention

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Hugging Face API documentation: https://huggingface.co/docs/api-inference
- Check Supabase Edge Functions logs: `supabase functions logs analyze-sentiment`

## License

This sentiment analysis system is part of the Alojamento Insight Analyzer project.
