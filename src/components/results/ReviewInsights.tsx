import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ReviewQuote {
  text: string;
  sentiment: 'positive' | 'negative';
  date?: string;
}

interface ReviewInsightsProps {
  topPositiveAspects: string[];
  areasForImprovement: string[];
  notableQuotes: ReviewQuote[];
  actionItems: string[];
}

const ReviewInsights: React.FC<ReviewInsightsProps> = ({
  topPositiveAspects,
  areasForImprovement,
  notableQuotes,
  actionItems,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Positive Aspects */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-700 flex items-center">
            <span className="mr-2">✓</span>
            Top Positive Aspects
          </CardTitle>
          <CardDescription>
            What guests love most about your property
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Using composite key with aspect content for stable keys */}
            {topPositiveAspects.map((aspect, index) => (
              <div
                key={`positive-aspect-${aspect.slice(0, 30)}-${index}`}
                className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <span className="text-green-600 font-bold text-lg">{index + 1}.</span>
                <span className="text-gray-800">{aspect}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center">
            <span className="mr-2">⚠</span>
            Areas for Improvement
          </CardTitle>
          <CardDescription>
            Opportunities to enhance guest experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Using composite key with area content for stable keys */}
            {areasForImprovement.map((area, index) => (
              <div
                key={`improvement-area-${area.slice(0, 30)}-${index}`}
                className="flex items-start space-x-2 p-3 bg-red-50 rounded-lg border border-red-200"
              >
                <span className="text-red-600 font-bold text-lg">{index + 1}.</span>
                <span className="text-gray-800">{area}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notable Quotes */}
      <Card>
        <CardHeader>
          <CardTitle>Notable Guest Reviews</CardTitle>
          <CardDescription>
            Direct quotes from recent guest reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Using composite key with quote text snippet and sentiment for stable keys */}
            {notableQuotes.map((quote, index) => (
              <blockquote
                key={`quote-${quote.sentiment}-${quote.text.slice(0, 30)}-${index}`}
                className={`
                  p-4 rounded-lg border-l-4
                  ${quote.sentiment === 'positive'
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                  }
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={quote.sentiment === 'positive' ? 'default' : 'destructive'}
                    className={quote.sentiment === 'positive' ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {quote.sentiment === 'positive' ? 'Positive' : 'Negative'}
                  </Badge>
                  {quote.date && (
                    <span className="text-xs text-gray-500">{quote.date}</span>
                  )}
                </div>
                <p className="text-gray-800 italic">"{quote.text}"</p>
              </blockquote>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertTitle className="text-blue-800 font-semibold text-lg mb-3">
          Recommended Actions
        </AlertTitle>
        <AlertDescription>
          <ol className="space-y-3">
            {/* Using composite key with action content for stable keys */}
            {actionItems.map((action, index) => (
              <li
                key={`action-item-${action.slice(0, 30)}-${index}`}
                className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-blue-200"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <span className="text-gray-800">{action}</span>
              </li>
            ))}
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ReviewInsights;
