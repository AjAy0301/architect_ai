
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Link as LinkIcon, Copy, CheckCircle } from "lucide-react";

interface HSDGenerationResult {
  ticket_key: string;
  summary: string;
  description: string;
  excel_export?: string;
  hsd_ticket_key?: string;
  status: string;
}

export default function HSDGenerator() {
  const [ticketNumber, setTicketNumber] = useState("OAUS-1234");
  const [generationResult, setGenerationResult] = useState<HSDGenerationResult | null>(null);
  const { toast } = useToast();

  const generateHSDMutation = useMutation({
    mutationFn: async (ticketId: string) => {
      const response = await fetch('/api/workflows/hsd-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jiraTicketId: ticketId,
          engineType: 'python-langchain'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate HSD ticket');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGenerationResult(data);
      toast({
        title: "HSD Generation Completed",
        description: `Successfully processed ${data.ticket_key} and created HSD ticket`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate HSD ticket",
        variant: "destructive",
      });
    },
  });

  const { data: recentHSDTickets } = useQuery<HSDGenerationResult[]>({
    queryKey: ['/api/hsd-tickets/recent'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleGenerate = () => {
    if (!ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket number",
        variant: "destructive",
      });
      return;
    }
    generateHSDMutation.mutate(ticketNumber.trim());
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Ticket link copied to clipboard",
    });
  };

  return (
    <div className="flex h-screen bg-dark-primary text-white">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-dark-secondary border-b border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">HSD Generator</h2>
              <p className="text-gray-400 mt-1">Generate HSD tickets with enhanced descriptions using AI</p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Input Section */}
            <Card className="bg-dark-secondary border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Generate HSD Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Ticket Number</label>
                    <Input
                      type="text"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      placeholder="e.g., OAUS-1234"
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleGenerate}
                  disabled={generateHSDMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {generateHSDMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate HSD Ticket
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generation Result */}
            {generationResult && (
              <Card className="bg-dark-secondary border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Generated HSD Ticket</span>
                    <Badge className="bg-green-500/20 text-green-400">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Source Ticket: {generationResult.ticket_key}</h4>
                    <p className="text-gray-300 mb-4">{generationResult.summary}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Enhanced Description</h4>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300">
                        {generationResult.description}
                      </pre>
                    </div>
                  </div>

                  {generationResult.hsd_ticket_key && (
                    <div className="flex items-center justify-between bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                      <div>
                        <h4 className="font-semibold text-green-400">Created HSD Ticket</h4>
                        <p className="text-green-300">{generationResult.hsd_ticket_key}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(generationResult.hsd_ticket_key!)}
                        className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  )}

                  {generationResult.excel_export && (
                    <div className="text-sm text-gray-400">
                      <p>Excel export: {generationResult.excel_export}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent HSD Tickets */}
            <Card className="bg-dark-secondary border-gray-700">
              <CardHeader>
                <CardTitle>Recent HSD Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {recentHSDTickets && recentHSDTickets.length > 0 ? (
                  <div className="space-y-3">
                    {recentHSDTickets.map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium">{ticket.ticket_key}</span>
                            {ticket.hsd_ticket_key && (
                              <>
                                <span className="text-gray-400">→</span>
                                <span className="text-green-400">{ticket.hsd_ticket_key}</span>
                              </>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 truncate">{ticket.summary}</p>
                          <Badge className="mt-1 bg-blue-500/20 text-blue-400">
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="flex space-x-2">
                          {ticket.hsd_ticket_key && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(ticket.hsd_ticket_key!)}
                            >
                              <LinkIcon className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No recent HSD tickets found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
