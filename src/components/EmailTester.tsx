
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const EmailTester = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestEmail = async () => {
    setIsLoading(true);
    try {
      console.log("Sending test email...");
      const { data, error } = await supabase.functions.invoke("send-diagnostic-email/test");
      
      if (error) {
        console.error("Error sending test email:", error);
        toast({
          variant: "destructive",
          title: "Error sending test email",
          description: error.message
        });
        return;
      }
      
      console.log("Test email response:", data);
      toast({
        title: "Test Email Sent",
        description: "Check your inbox for the test email.",
      });
    } catch (err) {
      console.error("Exception sending test email:", err);
      toast({
        variant: "destructive",
        title: "Error sending test email",
        description: String(err)
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Email Testing Tool</h2>
      <Button 
        onClick={sendTestEmail} 
        disabled={isLoading}
        className="bg-brand-pink hover:bg-opacity-90 text-brand-black font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending Test Email...
          </>
        ) : (
          "Send Test Email"
        )}
      </Button>
      <p className="mt-2 text-sm text-gray-600">
        This will send a test email to bilal.machraa@gmail.com
      </p>
    </div>
  );
};

export default EmailTester;
