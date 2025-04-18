
import React from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

interface Recommendation {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  cost: string;
  impact: string;
  roi: string;
  timeframe: string;
}

export interface RecommendationsListProps {
  recommendations: Recommendation[];
  title?: string;
  expanded?: boolean;
}

const getPriorityColor = (priority: string) => {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-800 border-red-200";
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "low":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const RecommendationsList = ({ recommendations, title = "Recommendations", expanded = false }: RecommendationsListProps) => {
  return (
    <div className="space-y-4">
      {title && <h3 className="text-lg font-medium">{title}</h3>}
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recommendation</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Est. Cost</TableHead>
              <TableHead>Expected Impact</TableHead>
              <TableHead>ROI</TableHead>
              <TableHead>Timeframe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell className="font-medium">{rec.description}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                    {rec.priority}
                  </Badge>
                </TableCell>
                <TableCell>{rec.cost}</TableCell>
                <TableCell>{rec.impact}</TableCell>
                <TableCell>{rec.roi}</TableCell>
                <TableCell>{rec.timeframe}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default RecommendationsList;
