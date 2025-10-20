-- Sentiment Analysis Functions and Views
-- Created: 2025-10-20
-- Purpose: Support sentiment analysis and aggregation

-- =====================================================
-- Function: get_sentiment_summary
-- Returns overall sentiment summary for a property
-- =====================================================
CREATE OR REPLACE FUNCTION get_sentiment_summary(
  p_property_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  property_id UUID,
  overall_score NUMERIC,
  overall_category TEXT,
  total_mentions INTEGER,
  positive_count INTEGER,
  neutral_count INTEGER,
  negative_count INTEGER,
  avg_cleanliness NUMERIC,
  avg_location NUMERIC,
  avg_value NUMERIC,
  avg_amenities NUMERIC,
  avg_communication NUMERIC,
  avg_checkin NUMERIC,
  avg_accuracy NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH sentiment_data AS (
    SELECT
      fst.property_id,
      fst.sentiment_score,
      fst.mention_count,
      fst.topic,
      CASE
        WHEN fst.sentiment_score >= 0.3 THEN 'positive'
        WHEN fst.sentiment_score <= -0.3 THEN 'negative'
        ELSE 'neutral'
      END AS category
    FROM fact_sentiment_topics fst
    WHERE fst.property_id = p_property_id
      AND fst.date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    p_property_id AS property_id,
    ROUND(AVG(sd.sentiment_score)::numeric, 3) AS overall_score,
    CASE
      WHEN AVG(sd.sentiment_score) >= 0.3 THEN 'positive'
      WHEN AVG(sd.sentiment_score) <= -0.3 THEN 'negative'
      ELSE 'neutral'
    END AS overall_category,
    SUM(sd.mention_count)::INTEGER AS total_mentions,
    SUM(CASE WHEN sd.category = 'positive' THEN sd.mention_count ELSE 0 END)::INTEGER AS positive_count,
    SUM(CASE WHEN sd.category = 'neutral' THEN sd.mention_count ELSE 0 END)::INTEGER AS neutral_count,
    SUM(CASE WHEN sd.category = 'negative' THEN sd.mention_count ELSE 0 END)::INTEGER AS negative_count,
    ROUND(AVG(CASE WHEN sd.topic = 'Cleanliness' THEN sd.sentiment_score END)::numeric, 3) AS avg_cleanliness,
    ROUND(AVG(CASE WHEN sd.topic = 'Location' THEN sd.sentiment_score END)::numeric, 3) AS avg_location,
    ROUND(AVG(CASE WHEN sd.topic = 'Value' THEN sd.sentiment_score END)::numeric, 3) AS avg_value,
    ROUND(AVG(CASE WHEN sd.topic = 'Amenities' THEN sd.sentiment_score END)::numeric, 3) AS avg_amenities,
    ROUND(AVG(CASE WHEN sd.topic = 'Communication' THEN sd.sentiment_score END)::numeric, 3) AS avg_communication,
    ROUND(AVG(CASE WHEN sd.topic = 'Check-in' THEN sd.sentiment_score END)::numeric, 3) AS avg_checkin,
    ROUND(AVG(CASE WHEN sd.topic = 'Accuracy' THEN sd.sentiment_score END)::numeric, 3) AS avg_accuracy
  FROM sentiment_data sd;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Function: get_sentiment_trend
-- Returns sentiment trend over time
-- =====================================================
CREATE OR REPLACE FUNCTION get_sentiment_trend(
  p_property_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '90 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  date DATE,
  avg_sentiment NUMERIC,
  positive_count INTEGER,
  neutral_count INTEGER,
  negative_count INTEGER,
  total_mentions INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_sentiment AS (
    SELECT
      fst.date,
      fst.sentiment_score,
      fst.mention_count,
      CASE
        WHEN fst.sentiment_score >= 0.3 THEN 'positive'
        WHEN fst.sentiment_score <= -0.3 THEN 'negative'
        ELSE 'neutral'
      END AS category
    FROM fact_sentiment_topics fst
    WHERE fst.property_id = p_property_id
      AND fst.date BETWEEN p_start_date AND p_end_date
  )
  SELECT
    ds.date,
    ROUND(AVG(ds.sentiment_score)::numeric, 3) AS avg_sentiment,
    SUM(CASE WHEN ds.category = 'positive' THEN ds.mention_count ELSE 0 END)::INTEGER AS positive_count,
    SUM(CASE WHEN ds.category = 'neutral' THEN ds.mention_count ELSE 0 END)::INTEGER AS neutral_count,
    SUM(CASE WHEN ds.category = 'negative' THEN ds.mention_count ELSE 0 END)::INTEGER AS negative_count,
    SUM(ds.mention_count)::INTEGER AS total_mentions
  FROM daily_sentiment ds
  GROUP BY ds.date
  ORDER BY ds.date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- Function: get_topic_sentiment
-- Returns sentiment for a specific topic
-- =====================================================
CREATE OR REPLACE FUNCTION get_topic_sentiment(
  p_property_id UUID,
  p_topic TEXT,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  topic TEXT,
  avg_sentiment NUMERIC,
  total_mentions INTEGER,
  trend TEXT
) AS $$
DECLARE
  v_current_score NUMERIC;
  v_previous_score NUMERIC;
  v_score_diff NUMERIC;
BEGIN
  -- Calculate current period sentiment
  SELECT
    ROUND(AVG(sentiment_score)::numeric, 3),
    SUM(mention_count)
  INTO v_current_score, total_mentions
  FROM fact_sentiment_topics
  WHERE property_id = p_property_id
    AND topic = p_topic
    AND date BETWEEN p_start_date AND p_end_date;

  -- Calculate previous period sentiment (same duration)
  SELECT
    AVG(sentiment_score)
  INTO v_previous_score
  FROM fact_sentiment_topics
  WHERE property_id = p_property_id
    AND topic = p_topic
    AND date BETWEEN (p_start_date - (p_end_date - p_start_date)) AND p_start_date;

  -- Determine trend
  IF v_previous_score IS NOT NULL THEN
    v_score_diff := v_current_score - v_previous_score;
    IF v_score_diff > 0.1 THEN
      trend := 'improving';
    ELSIF v_score_diff < -0.1 THEN
      trend := 'declining';
    ELSE
      trend := 'stable';
    END IF;
  ELSE
    trend := 'stable';
  END IF;

  RETURN QUERY
  SELECT
    p_topic AS topic,
    v_current_score AS avg_sentiment,
    total_mentions::INTEGER,
    trend;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- View: sentiment_daily_summary
-- Daily aggregated sentiment data
-- =====================================================
CREATE OR REPLACE VIEW sentiment_daily_summary AS
SELECT
  fst.property_id,
  dp.name AS property_name,
  fst.date,
  fst.platform,
  AVG(fst.sentiment_score) AS avg_sentiment,
  COUNT(DISTINCT fst.topic) AS topics_mentioned,
  SUM(fst.mention_count) AS total_mentions,
  SUM(CASE WHEN fst.sentiment_score >= 0.3 THEN fst.mention_count ELSE 0 END) AS positive_mentions,
  SUM(CASE WHEN fst.sentiment_score <= -0.3 THEN fst.mention_count ELSE 0 END) AS negative_mentions,
  SUM(CASE WHEN fst.sentiment_score > -0.3 AND fst.sentiment_score < 0.3 THEN fst.mention_count ELSE 0 END) AS neutral_mentions
FROM fact_sentiment_topics fst
JOIN dim_property dp ON fst.property_id = dp.id
GROUP BY fst.property_id, dp.name, fst.date, fst.platform;

-- =====================================================
-- View: sentiment_topic_summary
-- Aggregated sentiment by topic
-- =====================================================
CREATE OR REPLACE VIEW sentiment_topic_summary AS
SELECT
  fst.property_id,
  dp.name AS property_name,
  fst.topic,
  AVG(fst.sentiment_score) AS avg_sentiment,
  COUNT(*) AS data_points,
  SUM(fst.mention_count) AS total_mentions,
  MIN(fst.date) AS first_date,
  MAX(fst.date) AS last_date,
  CASE
    WHEN AVG(fst.sentiment_score) >= 0.3 THEN 'positive'
    WHEN AVG(fst.sentiment_score) <= -0.3 THEN 'negative'
    ELSE 'neutral'
  END AS category
FROM fact_sentiment_topics fst
JOIN dim_property dp ON fst.property_id = dp.id
GROUP BY fst.property_id, dp.name, fst.topic;

-- =====================================================
-- View: sentiment_property_overview
-- Overall property sentiment overview
-- =====================================================
CREATE OR REPLACE VIEW sentiment_property_overview AS
SELECT
  fst.property_id,
  dp.name AS property_name,
  dp.location,
  AVG(fst.sentiment_score) AS overall_sentiment,
  COUNT(DISTINCT fst.topic) AS topics_covered,
  SUM(fst.mention_count) AS total_reviews_analyzed,
  COUNT(DISTINCT fst.date) AS days_with_data,
  MIN(fst.date) AS first_analysis_date,
  MAX(fst.date) AS last_analysis_date,
  CASE
    WHEN AVG(fst.sentiment_score) >= 0.3 THEN 'positive'
    WHEN AVG(fst.sentiment_score) <= -0.3 THEN 'negative'
    ELSE 'neutral'
  END AS sentiment_category,
  -- Topic scores
  AVG(CASE WHEN fst.topic = 'Cleanliness' THEN fst.sentiment_score END) AS cleanliness_score,
  AVG(CASE WHEN fst.topic = 'Location' THEN fst.sentiment_score END) AS location_score,
  AVG(CASE WHEN fst.topic = 'Value' THEN fst.sentiment_score END) AS value_score,
  AVG(CASE WHEN fst.topic = 'Amenities' THEN fst.sentiment_score END) AS amenities_score,
  AVG(CASE WHEN fst.topic = 'Communication' THEN fst.sentiment_score END) AS communication_score,
  AVG(CASE WHEN fst.topic = 'Check-in' THEN fst.sentiment_score END) AS checkin_score,
  AVG(CASE WHEN fst.topic = 'Accuracy' THEN fst.sentiment_score END) AS accuracy_score
FROM fact_sentiment_topics fst
JOIN dim_property dp ON fst.property_id = dp.id
GROUP BY fst.property_id, dp.name, dp.location;

-- =====================================================
-- Grant permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_sentiment_summary(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sentiment_trend(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_topic_sentiment(UUID, TEXT, DATE, DATE) TO authenticated;

GRANT SELECT ON sentiment_daily_summary TO authenticated;
GRANT SELECT ON sentiment_topic_summary TO authenticated;
GRANT SELECT ON sentiment_property_overview TO authenticated;

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sentiment_property_date
  ON fact_sentiment_topics(property_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_sentiment_topic
  ON fact_sentiment_topics(property_id, topic);

CREATE INDEX IF NOT EXISTS idx_sentiment_score
  ON fact_sentiment_topics(sentiment_score);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON FUNCTION get_sentiment_summary IS
  'Returns comprehensive sentiment summary for a property within a date range';

COMMENT ON FUNCTION get_sentiment_trend IS
  'Returns daily sentiment trend for visualization';

COMMENT ON FUNCTION get_topic_sentiment IS
  'Returns sentiment analysis for a specific topic with trend direction';

COMMENT ON VIEW sentiment_daily_summary IS
  'Daily aggregated sentiment data by property and platform';

COMMENT ON VIEW sentiment_topic_summary IS
  'Aggregated sentiment scores by topic for each property';

COMMENT ON VIEW sentiment_property_overview IS
  'Overall sentiment overview for each property with all topic scores';
