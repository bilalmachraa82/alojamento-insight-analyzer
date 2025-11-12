import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshCw, ExternalLink, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function DebugSubmissions() {
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: submissions, isLoading, refetch } = useQuery({
    queryKey: ["debug-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
  });

  const { data: selectedSubmission } = useQuery({
    queryKey: ["submission-detail", selectedId],
    queryFn: async () => {
      if (!selectedId) return null;
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("*")
        .eq("id", selectedId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!selectedId,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", icon: Clock },
      processing: { color: "bg-blue-500", icon: RefreshCw },
      scraping: { color: "bg-purple-500", icon: RefreshCw },
      scraping_retry: { color: "bg-orange-500", icon: AlertCircle },
      analyzing: { color: "bg-indigo-500", icon: RefreshCw },
      completed: { color: "bg-green-500", icon: CheckCircle },
      failed: { color: "bg-red-500", icon: AlertCircle },
      pending_manual_review: { color: "bg-amber-500", icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const handleTestScraper = async () => {
    const testUrl = "https://www.booking.com/hotel/pt/pestana-palace-lisboa.pt-pt.html";
    
    try {
      toast.loading("Creating test submission...");
      
      const { data: submission, error: submitError } = await supabase
        .from("diagnostic_submissions")
        .insert({
          name: "Test - Pestana Palace",
          email: "test@mariafaz.com",
          property_url: testUrl,
          platform: "booking",
          status: "pending",
        })
        .select()
        .single();

      if (submitError) throw submitError;

      toast.success("Test submission created!");
      
      // Trigger processing
      const { error: processError } = await supabase.functions.invoke("process-diagnostic", {
        body: { id: submission.id },
      });

      if (processError) throw processError;

      toast.success("Scraper started! Check status below.");
      refetch();
      setSelectedId(submission.id);
    } catch (error) {
      console.error("Test error:", error);
      toast.error("Failed to start test");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug Submissions</h1>
          <p className="text-muted-foreground">Monitor and debug scraping submissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleTestScraper}>
            Test Booking.com Scraper
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Last 50 submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="space-y-2">
                  {submissions?.map((sub) => (
                    <Card
                      key={sub.id}
                      className={`cursor-pointer transition-colors ${
                        selectedId === sub.id ? "border-primary" : ""
                      }`}
                      onClick={() => setSelectedId(sub.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium">{sub.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sub.created_at).toLocaleString()}
                            </p>
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline">{sub.platform}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Submission Detail */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>
              {selectedSubmission ? `ID: ${selectedSubmission.id}` : "Select a submission"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSubmission ? (
              <Tabs defaultValue="overview">
                <TabsList className="w-full">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="data">Raw Data</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Platform</p>
                      <Badge variant="outline">{selectedSubmission.platform}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Property URL</p>
                    <a
                      href={selectedSubmission.property_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                    >
                      {selectedSubmission.property_url}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {selectedSubmission.actor_run_id && (
                    <div>
                      <p className="text-sm font-medium">Apify Run ID</p>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {selectedSubmission.actor_run_id}
                      </code>
                    </div>
                  )}

                  {selectedSubmission.error_message && (
                    <div>
                      <p className="text-sm font-medium text-red-500">Error</p>
                      <code className="text-xs bg-red-50 p-2 rounded block">
                        {selectedSubmission.error_message}
                      </code>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="data">
                  <ScrollArea className="h-[500px]">
                    <pre className="text-xs bg-muted p-4 rounded">
                      {JSON.stringify(selectedSubmission.property_data, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="timeline">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1" />
                      <div>
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(selectedSubmission.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {selectedSubmission.updated_at && (
                      <div className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Last Updated</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(selectedSubmission.updated_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Select a submission to view details
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
