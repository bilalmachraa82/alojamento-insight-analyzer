
import React from "react";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface Competitor {
  name: string;
  price: string;
  strengths: string[];
  differentiator: string;
}

interface CompetitorAnalysisProps {
  marketPosition: string;
  advantages: string[];
  disadvantages: string[];
  opportunities: string[];
  threats: string[];
  competitors: Competitor[];
}

const CompetitorAnalysis = ({
  marketPosition,
  advantages,
  disadvantages,
  opportunities,
  threats,
  competitors
}: CompetitorAnalysisProps) => {
  // Prepare data for radar chart
  const radarData = [
    { subject: 'Price', property: 8, competitors: 7 },
    { subject: 'Location', property: 7, competitors: 6 },
    { subject: 'Amenities', property: 6, competitors: 8 },
    { subject: 'Rating', property: 8, competitors: 7 },
    { subject: 'Booking Rate', property: 7, competitors: 9 },
    { subject: 'Reviews', property: 9, competitors: 8 },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Market Position</h3>
        <p className="text-gray-700">{marketPosition}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">SWOT Analysis</h3>
          
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="font-medium text-green-800 mb-2">Strengths</h4>
              <ul className="list-disc list-inside space-y-1">
                {advantages.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-red-50 p-4 rounded-md">
              <h4 className="font-medium text-red-800 mb-2">Weaknesses</h4>
              <ul className="list-disc list-inside space-y-1">
                {disadvantages.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">Opportunities</h4>
              <ul className="list-disc list-inside space-y-1">
                {opportunities.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-md">
              <h4 className="font-medium text-amber-800 mb-2">Threats</h4>
              <ul className="list-disc list-inside space-y-1">
                {threats.map((item, index) => (
                  <li key={index} className="text-gray-700">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Comparison to Competitors</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <RadarChart outerRadius={90} data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 10]} />
                <Radar
                  name="Your Property"
                  dataKey="property"
                  stroke="#EC4899"
                  fill="#EC4899"
                  fillOpacity={0.5}
                />
                <Radar
                  name="Competitors"
                  dataKey="competitors"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.5}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-3">Top Competitors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {competitors.map((competitor, index) => (
            <div key={index} className="border rounded-md p-4">
              <h4 className="font-medium text-lg mb-1">{competitor.name}</h4>
              <p className="text-sm text-gray-600 mb-2">Price: {competitor.price}</p>
              
              <h5 className="text-sm font-medium mb-1">Key Strengths</h5>
              <ul className="list-disc list-inside text-sm space-y-1 mb-3">
                {competitor.strengths.map((strength, idx) => (
                  <li key={idx} className="text-gray-700">{strength}</li>
                ))}
              </ul>
              
              <div className="mt-2">
                <h5 className="text-sm font-medium">Competitive Edge</h5>
                <p className="text-sm text-gray-700">{competitor.differentiator}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
