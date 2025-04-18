
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import AnalysisResultsViewer from "@/components/results/AnalysisResultsViewer";
import { toast } from "@/components/ui/use-toast";
import { Json } from "@/integrations/supabase/types";

interface AnalysisData {
  id: string;
  nome: string;
  email: string;
  link: string;
  plataforma: string;
  status: string;
  analysis_result: {
    property_data?: {
      property_name?: string;
      location?: string;
      property_type?: string;
      rating?: number;
    };
    [key: string]: any;
  } | null;
  data_submissao: string;
  rgpd: boolean;
  scraped_data: Json | null;
}

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      try {
        if (!id) {
          setError("No analysis ID provided");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("diagnostic_submissions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (!data) {
          setError("Analysis not found");
          setLoading(false);
          return;
        }

        // Convert data to the expected AnalysisData type
        const processedData: AnalysisData = {
          id: data.id,
          nome: data.nome,
          email: data.email,
          link: data.link,
          plataforma: data.plataforma,
          status: data.status,
          analysis_result: data.analysis_result as AnalysisData['analysis_result'],
          data_submissao: data.data_submissao,
          rgpd: data.rgpd,
          scraped_data: data.scraped_data
        };
        
        setAnalysisData(processedData);
        setLoading(false);
      } catch (err: any) {
        console.error("Error fetching analysis data:", err);
        setError(err.message || "An error occurred while fetching the analysis data");
        setLoading(false);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load analysis data. Please try again later."
        });
      }
    };

    fetchAnalysisData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-12 w-12 animate-spin text-brand-pink mb-4" />
        <p className="text-lg text-center">Loading analysis results...</p>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-lg text-center mb-6">{error || "Failed to load analysis data"}</p>
        <Button asChild>
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return to Home
          </Link>
        </Button>
      </div>
    );
  }
  
  // Get property name from analysis data, with fallback to URL
  const propertyName = analysisData.analysis_result?.property_data?.property_name || 
                        analysisData.link?.split('/').pop() || 
                        "Your Property";
  
  // Get property location with fallback
  const propertyLocation = analysisData.analysis_result?.property_data?.location || "Location Unavailable";
  
  // Get property type with fallback
  const propertyType = analysisData.analysis_result?.property_data?.property_type || "Accommodation";
  
  // Get property rating with fallback
  const propertyRating = analysisData.analysis_result?.property_data?.rating || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-50">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-8 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button variant="ghost" asChild>
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Property Analysis</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white shadow rounded-xl p-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{propertyName}</h1>
          <div className="flex flex-col md:flex-row md:items-center text-gray-600 mb-6 gap-2 md:gap-6">
            <div className="flex items-center">
              <span className="mr-1">📍</span> 
              <span>{propertyLocation}</span>
            </div>
            <div className="flex items-center">
              <span className="mr-1">🏠</span> 
              <span>{propertyType}</span>
            </div>
            {propertyRating && (
              <div className="flex items-center">
                <span className="mr-1">⭐</span> 
                <span>{propertyRating} / 5</span>
              </div>
            )}
          </div>
          
          <AnalysisResultsViewer analysisData={analysisData} />
        </div>
      </main>
    </div>
  );
};

export default AnalysisResult;
