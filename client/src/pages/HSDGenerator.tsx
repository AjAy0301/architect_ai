
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Link as LinkIcon, Copy, CheckCircle, ExternalLink, Zap, Clock, ArrowRight } from "lucide-react";

interface HSDGenerationResult {
  ticket_key: string;
  summary: string;
  description: string;
  excel_export?: string;
  hsd_ticket_key?: string;
  status: string;
}

// Dummy data for better UI demonstration
const dummyRecentTickets: HSDGenerationResult[] = [
  {
    ticket_key: "OAUS-1234",
    summary: "Implement user authentication system with multi-factor support",
    description: "Enhanced description with AI analysis...",
    hsd_ticket_key: "HSD-5678",
    status: "completed"
  },
  {
    ticket_key: "OAUS-2345", 
    summary: "Fix payment processing gateway timeout issues",
    description: "Detailed technical analysis and solution approach...",
    hsd_ticket_key: "HSD-6789",
    status: "completed"
  },
  {
    ticket_key: "OAUS-3456",
    summary: "Optimize database queries for user dashboard",
    description: "Performance improvements and caching strategy...",
    hsd_ticket_key: "HSD-7890",
    status: "completed"
  }
];

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

  const handleGenerate = () => {
    if (!ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a ticket number",
        variant: "destructive",
      });
      return;
    }

    // For demo purposes, simulate a successful generation
    const demoResult: HSDGenerationResult = {
      ticket_key: ticketNumber,
      summary: "AI-Enhanced Implementation Task",
      description: `# HSD Implementation for ${ticketNumber}

## Source Ticket Information
- **Original Ticket**: ${ticketNumber}
- **Type**: Story
- **Priority**: High
- **Status**: In Progress
- **Project**: OneApp

## AI-Generated Enhanced Description

This ticket has been analyzed using our LangChain-powered AI system to provide comprehensive implementation guidance:

### Technical Requirements
- Implement core functionality with proper error handling
- Add comprehensive logging and monitoring
- Ensure security best practices are followed
- Include unit and integration tests

### Implementation Strategy
1. **Phase 1**: Core implementation
2. **Phase 2**: Testing and validation
3. **Phase 3**: Documentation and deployment

### Risk Assessment
- **Low Risk**: Standard implementation patterns
- **Medium Risk**: Integration complexity
- **Mitigation**: Incremental rollout strategy

### Success Criteria
- All acceptance criteria met
- Performance benchmarks achieved
- Security review passed
- Documentation complete`,
      hsd_ticket_key: `HSD-${Math.floor(Math.random() * 9000) + 1000}`,
      status: "completed"
    };

    setTimeout(() => {
      setGenerationResult(demoResult);
      toast({
        title: "HSD Generation Completed",
        description: `Successfully processed ${demoResult.ticket_key} and created HSD ticket`,
      });
    }, 2000);

    generateHSDMutation.mutate(ticketNumber.trim());
  };

  const openJiraTicket = (ticketKey: string) => {
    window.open(`https://jira.company.com/browse/${ticketKey}`, '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Ticket link copied to clipboard",
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        {/* Header with gradient */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-8 shadow-xl">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <Zap className="w-8 h-8 mr-3 text-yellow-400" />
                HSD Generator
              </h1>
              <p className="text-blue-100 text-lg">Transform tickets with AI-powered enhanced descriptions</p>
            </div>
            <div className="text-right">
              <div className="text-blue-100 text-sm">Powered by</div>
              <div className="text-white font-semibold">LangChain AI Agent</div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <div className="grid gap-8">
            {/* Input Section - Full Width Card */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <FileText className="w-6 h-6 mr-3 text-blue-400" />
                  Generate Enhanced HSD Ticket
                </CardTitle>
                <p className="text-gray-400 mt-2">Enter a JIRA ticket number to generate an AI-enhanced HSD implementation ticket</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-3 text-gray-300">Source Ticket Number</label>
                    <Input
                      type="text"
                      value={ticketNumber}
                      onChange={(e) => setTicketNumber(e.target.value)}
                      placeholder="e.g., OAUS-1234"
                      className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12 text-lg"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleGenerate}
                      disabled={generateHSDMutation.isPending}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-medium shadow-lg"
                    >
                      {generateHSDMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap className="w-5 h-5 mr-2" />
                          Generate HSD Ticket
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generation Result */}
            {generationResult && (
              <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-xl">
                    <span className="flex items-center">
                      <CheckCircle className="w-6 h-6 mr-3 text-green-400" />
                      Generated HSD Ticket
                    </span>
                    <Badge className="bg-green-500/20 text-green-400 px-3 py-1">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Completed
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Source ticket info */}
                  <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg flex items-center">
                        <ArrowRight className="w-5 h-5 mr-2 text-blue-400" />
                        Source: {generationResult.ticket_key}
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openJiraTicket(generationResult.ticket_key)}
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View in JIRA
                      </Button>
                    </div>
                    <p className="text-gray-300">{generationResult.summary}</p>
                  </div>
                  
                  {/* Enhanced Description */}
                  <div>
                    <h4 className="font-semibold mb-4 text-lg flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-400" />
                      AI-Enhanced Description
                    </h4>
                    <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                        {generationResult.description}
                      </pre>
                    </div>
                  </div>

                  {/* Created HSD Ticket */}
                  {generationResult.hsd_ticket_key && (
                    <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-6 rounded-lg border border-green-500/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-green-400 text-lg mb-2">✅ Created HSD Ticket</h4>
                          <p className="text-green-300 text-lg font-mono">{generationResult.hsd_ticket_key}</p>
                        </div>
                        <div className="flex space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openJiraTicket(generationResult.hsd_ticket_key!)}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Open Ticket
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(generationResult.hsd_ticket_key!)}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recent HSD Tickets */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-xl">
                  <Clock className="w-6 h-6 mr-3 text-orange-400" />
                  Recent HSD Tickets
                </CardTitle>
                <p className="text-gray-400 mt-2">Previously generated HSD tickets with AI-enhanced descriptions</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dummyRecentTickets.map((ticket, index) => (
                    <div key={index} className="bg-gray-700/30 p-5 rounded-lg border border-gray-600 hover:bg-gray-700/50 transition-all duration-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="font-mono font-medium text-blue-400">{ticket.ticket_key}</span>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                            <span className="font-mono font-medium text-green-400">{ticket.hsd_ticket_key}</span>
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                              {ticket.status}
                            </Badge>
                          </div>
                          <p className="text-gray-300 mb-3 leading-relaxed">{ticket.summary}</p>
                          <div className="text-sm text-gray-500">
                            Generated with LangChain AI • Enhanced description available
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openJiraTicket(ticket.ticket_key)}
                            className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Source
                          </Button>
                          {ticket.hsd_ticket_key && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openJiraTicket(ticket.hsd_ticket_key)}
                              className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              HSD
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
