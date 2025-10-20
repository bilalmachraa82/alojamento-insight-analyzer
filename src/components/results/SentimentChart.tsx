import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SentimentDataPoint {
  date: string;
  score: number; // -1 to +1
  positiveCount?: number;
  neutralCount?: number;
  negativeCount?: number;
}

interface SentimentChartProps {
  data: SentimentDataPoint[];
  showCounts?: boolean;
}

const SentimentChart: React.FC<SentimentChartProps> = ({
  data,
  showCounts = false,
}) => {
  // Convert sentiment score to 0-100 scale for better visualization
  const chartData = data.map(point => ({
    ...point,
    displayScore: Math.round((point.score + 1) * 50),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <p className="text-sm">
            <span className="font-medium">Sentiment Score:</span>{' '}
            <span className={`font-bold ${
              data.score >= 0.3 ? 'text-green-600' :
              data.score <= -0.3 ? 'text-red-600' : 'text-yellow-600'
            }`}>
              {data.displayScore}/100
            </span>
          </p>
          {showCounts && (
            <>
              <p className="text-sm text-green-600">
                <span className="font-medium">Positive:</span> {data.positiveCount || 0}
              </p>
              <p className="text-sm text-yellow-600">
                <span className="font-medium">Neutral:</span> {data.neutralCount || 0}
              </p>
              <p className="text-sm text-red-600">
                <span className="font-medium">Negative:</span> {data.negativeCount || 0}
              </p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            stroke="#666"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#666"
            style={{ fontSize: '12px' }}
            label={{ value: 'Sentiment Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          {/* Reference lines for sentiment boundaries */}
          <ReferenceLine
            y={65}
            stroke="#10b981"
            strokeDasharray="3 3"
            label={{ value: 'Positive', position: 'right', fill: '#10b981' }}
          />
          <ReferenceLine
            y={35}
            stroke="#ef4444"
            strokeDasharray="3 3"
            label={{ value: 'Negative', position: 'right', fill: '#ef4444' }}
          />

          <Line
            type="monotone"
            dataKey="displayScore"
            name="Sentiment Score"
            stroke="#8b5cf6"
            strokeWidth={3}
            dot={{ fill: '#8b5cf6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SentimentChart;
