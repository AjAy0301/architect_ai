
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Upload, FileText, Settings } from "lucide-react";
import { Workflow } from "@/types/agents";

export default function OneButton() {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const runFullFlowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/workflows/langchain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jiraTicketId: 'AUTO-GENERATED',
          engineType: 'langchain'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start workflow');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Full Flow Started",
        description: "LangChain workflow has been initiated successfully",
      });
      setIsRunning(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start the workflow",
        variant: "destructive",
      });
    },
  });

  const activeWorkflow = workflows?.find(w => w.status === 'running');

  return (
    <div className="flex h-screen bg-dark-primary text-white">
      <Sidebar />
      
      <div className="flex-1 overflow-auto">
        <header className="bg-dark-secondary border-b border-gray-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">OneButton Flow</h2>
              <p className="text-gray-400 mt-1">Execute the complete AI architecture pipeline with one click</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Main Action Card */}
            <Card className="bg-dark-secondary border-gray-700">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl mb-4">AI Architecture Generator</CardTitle>
                <p className="text-gray-400 text-lg">
                  Complete end-to-end workflow powered by LangChain agents
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-8">
                  <Button 
                    size="lg"
                    className="w-64 h-16 text-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => runFullFlowMutation.mutate()}
                    disabled={runFullFlowMutation.isPending || isRunning}
                  >
                    <Play className="w-6 h-6 mr-3" />
                    {runFullFlowMutation.isPending ? "Starting..." : isRunning ? "Running..." : "Run Full Flow"}
                  </Button>
                </div>
                
                {activeWorkflow && (
                  <div className="mt-6">
                    <Badge className="bg-green-500/20 text-green-400 px-4 py-2">
                      Workflow Active: {activeWorkflow.engineType}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Process Overview */}
            <Card className="bg-dark-secondary border-gray-700">
              <CardHeader>
                <CardTitle>Workflow Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Analysis</h3>
                    <p className="text-gray-400 text-sm">
                      Document processing and requirement analysis using advanced RAG
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Settings className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Architecture</h3>
                    <p className="text-gray-400 text-sm">
                      Technical architecture design with Chain-of-Thought reasoning
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Generation</h3>
                    <p className="text-gray-400 text-sm">
                      Structured output generation with Pydantic validation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            <Card className="bg-dark-secondary border-gray-700">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Engine Type</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                      <option value="langchain">LangChain (Node.js)</option>
                      <option value="python-langchain">Python LangChain</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                      <option>llama3.1:8b</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
