/**
 * Complete Sentiment Analysis Dashboard
 * Demonstrates full integration of sentiment analysis components
 */

import React, { useState } from 'react';
import {
  useSentimentSummary,
  useSentimentTrend,
  useTopicTrends,
  useSentimentInsights,
  useSentimentComparison,
} from '@/hooks/analytics';
import SentimentGauge from './SentimentGauge';
import SentimentChart from './SentimentChart';
import { TopicSentimentGrid } from './TopicSentimentCard';
import ReviewInsights from './ReviewInsights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface SentimentAnalysisDashboardProps {
  propertyId: string;
  startDate?: string;
  endDate?: string;
}

const SentimentAnalysisDashboard: React.FC<SentimentAnalysisDashboardProps> = ({
  propertyId,
  startDate,
  endDate,
}) => {
  // Date range configuration
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const currentPeriod = {
    start: startDate || thirtyDaysAgo,
    end: endDate || today,
  };

  const previousPeriod = {
    start: sixtyDaysAgo,
    end: thirtyDaysAgo,
  };

  // Fetch sentiment data
  const { data: summary, isLoading: summaryLoading } = useSentimentSummary({
    propertyId,
    dateRange: currentPeriod,
  });

  const { data: trend, isLoading: trendLoading } = useSentimentTrend({
    propertyId,
    dateRange: currentPeriod,
  });

  const { data: topics, isLoading: topicsLoading } = useTopicTrends(
    { propertyId, dateRange: currentPeriod },
    previousPeriod
  );

  const { data: insights, isLoading: insightsLoading } = useSentimentInsights({
    propertyId,
    dateRange: currentPeriod,
  });

  const { data: comparison, isLoading: comparisonLoading } = useSentimentComparison(
    propertyId,
    currentPeriod,
    previousPeriod
  );

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Loading state
  if (summaryLoading || trendLoading || topicsLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sentiment analysis...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!summary || !trend || !topics || !insights) {
    return (
      <Alert>
        <AlertTitle>No Sentiment Data Available</AlertTitle>
        <AlertDescription>
          Sentiment analysis data is not yet available for this property. Reviews need to be
          processed first. This happens automatically once per day.
        </AlertDescription>
      </Alert>
    );
  }

  // Urgent attention alert
  const needsAttention = insights.requires_immediate_attention;

  return (
    <div className="space-y-6">
      {/* Header with Overall Sentiment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Guest Sentiment Analysis</CardTitle>
          <CardDescription>
            Based on {summary.total_mentions} review mentions from{' '}
            {new Date(currentPeriod.start).toLocaleDateString()} to{' '}
            {new Date(currentPeriod.end).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Sentiment Gauge */}
            <div className="flex flex-col items-center">
              <SentimentGauge
                score={summary.overall_score}
                category={summary.overall_category}
                trend={comparison?.trend}
                size="large"
              />
            </div>

            {/* Sentiment Distribution */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-green-700">Positive</span>
                    <span className="text-sm text-gray-600">
                      {summary.positive_count} ({Math.round((summary.positive_count / summary.total_mentions) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{
                        width: `${(summary.positive_count / summary.total_mentions) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-yellow-700">Neutral</span>
                    <span className="text-sm text-gray-600">
                      {summary.neutral_count} ({Math.round((summary.neutral_count / summary.total_mentions) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-500 h-3 rounded-full"
                      style={{
                        width: `${(summary.neutral_count / summary.total_mentions) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-red-700">Negative</span>
                    <span className="text-sm text-gray-600">
                      {summary.negative_count} ({Math.round((summary.negative_count / summary.total_mentions) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{
                        width: `${(summary.negative_count / summary.total_mentions) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {comparison && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Compared to previous period:</span>{' '}
                    {comparison.trend === 'improving' && (
                      <Badge className="bg-green-600">
                        ↗ Improving (+{(comparison.score_change * 100).toFixed(1)}%)
                      </Badge>
                    )}
                    {comparison.trend === 'declining' && (
                      <Badge className="bg-red-600">
                        ↘ Declining ({(comparison.score_change * 100).toFixed(1)}%)
                      </Badge>
                    )}
                    {comparison.trend === 'stable' && (
                      <Badge className="bg-gray-600">
                        → Stable ({(comparison.score_change * 100).toFixed(1)}%)
                      </Badge>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Attention Alert */}
      {needsAttention && (
        <Alert className="bg-red-50 border-red-200">
          <AlertTitle className="text-red-800 font-bold">
            ⚠ Immediate Attention Required
          </AlertTitle>
          <AlertDescription className="text-red-700">
            Guest sentiment is significantly negative. Please review the areas for improvement
            and take immediate action to address critical issues.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="topics">Topics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment by Topic</CardTitle>
              <CardDescription>
                How guests feel about different aspects of your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopicSentimentGrid
                topics={topics}
                onTopicClick={(topic) => setSelectedTopic(topic)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Topic Analysis</CardTitle>
              <CardDescription>
                Click on a topic card to see detailed analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TopicSentimentGrid
                topics={topics}
                onTopicClick={(topic) => setSelectedTopic(topic)}
              />

              {selectedTopic && (
                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">{selectedTopic} Details</h3>
                  <p className="text-gray-700">
                    Selected topic analysis would show detailed breakdown of sentiment for{' '}
                    {selectedTopic}, including sample reviews and specific recommendations.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Trend Over Time</CardTitle>
              <CardDescription>
                Track how guest sentiment changes throughout the period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SentimentChart data={trend} showCounts={true} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <ReviewInsights
            topPositiveAspects={insights.top_positive_aspects.map(
              (topic) => `Guests particularly appreciate ${topic.toLowerCase()}`
            )}
            areasForImprovement={insights.areas_for_improvement.map(
              (topic) => `${topic} needs attention based on guest feedback`
            )}
            notableQuotes={[
              {
                text: 'This is a sample positive quote from a guest review.',
                sentiment: 'positive',
              },
              {
                text: 'This is a sample negative quote from a guest review.',
                sentiment: 'negative',
              },
            ]}
            actionItems={insights.action_items}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SentimentAnalysisDashboard;
