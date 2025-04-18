
import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface MetricProps {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}

const Metric = ({ label, value, suffix = "", color = "text-blue-600" }: MetricProps) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-xl font-semibold ${color}`}>
      {value}
      {suffix && <span className="text-sm ml-1">{suffix}</span>}
    </span>
  </div>
);

interface PerformanceMetricsProps {
  metrics: {
    visibilityScore: number;
    occupancyRate: number;
    ratingScore: number;
    avgPrice: number;
    suggestedPrice: number;
    annualRevenue: string;
    growthPotential: string;
  };
  comparativeData: Array<{
    name: string;
    current: number;
    suggested: number;
    benchmark: number;
  }>;
}

const PerformanceMetrics = ({ metrics, comparativeData }: PerformanceMetricsProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric 
          label="Visibility Score" 
          value={metrics.visibilityScore} 
          suffix="/10"
          color="text-blue-600" 
        />
        <Metric 
          label="Occupancy Rate" 
          value={metrics.occupancyRate} 
          suffix="%" 
          color="text-green-600"
        />
        <Metric 
          label="Rating Score" 
          value={metrics.ratingScore} 
          suffix="/10" 
          color="text-amber-600"
        />
        <Metric 
          label="Growth Potential" 
          value={metrics.growthPotential}
          color="text-purple-600" 
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric 
          label="Current Avg. Price" 
          value={metrics.avgPrice} 
          suffix="€" 
          color="text-gray-700"
        />
        <Metric 
          label="Suggested Price" 
          value={metrics.suggestedPrice} 
          suffix="€" 
          color="text-brand-pink"
        />
        <Metric 
          label="Est. Annual Revenue" 
          value={metrics.annualRevenue}
          color="text-brand-blue" 
        />
      </div>
      
      <div className="mt-8">
        <h4 className="text-md font-medium mb-2">Price Comparison Analysis</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={comparativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="current" name="Current Price" fill="#9CA3AF" />
              <Bar dataKey="suggested" name="Suggested Price" fill="#EC4899" />
              <Bar dataKey="benchmark" name="Market Benchmark" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
