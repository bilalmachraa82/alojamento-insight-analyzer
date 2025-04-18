
import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
}

const AnalysisSection = ({ 
  title, 
  children, 
  initiallyExpanded = false 
}: AnalysisSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">{title}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 h-auto"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && <CardContent className="p-4">{children}</CardContent>}
    </Card>
  );
};

export default AnalysisSection;
