import { Sidebar } from "@/components/Sidebar";
import { MetricsCard } from "@/components/MetricsCard";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import { RecentActivity } from "@/components/RecentActivity";
import { SystemHealth } from "@/components/SystemHealth";
import { JiraAnalysisModal } from "@/components/JiraAnalysisModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Metrics, Workflow, OllamaModel, WebSocketMessage } from "@/types/agents";
import { FileText, Upload, Download, Settings } from "lucide-react";
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | undefined>();
  const { toast } = useToast();

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['/api/metrics'],
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const { data: models } = useQuery<OllamaModel[]>({
    queryKey: ['/api/ollama/models'],
  });

  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const engineType = message.engineType || 'basic';
    const engineName = engineType === 'python-langchain' ? 'Python LangChain'
                      : engineType === 'langchain' ? 'Node.js LangChain' 
                      : 'Basic';

    switch (message.type) {
      case 'workflow_started':
      case 'langchain_workflow_started':
      case 'python_workflow_started':
        toast({
          title: `${engineName} Workflow Started`,
          description: `Analysis for ${message.jiraTicketId} has begun`,
        });
        break;
      case 'agent_completed':
      case 'langchain_agent_completed':
        toast({
          title: `${engineName} Agent Completed`,
          description: message.message,
        });
        break;
      case 'agent_progress':
        // Don't show toast for progress updates, just console log for debugging
        console.log(`Progress: ${message.agent} - ${message.progress}% - ${message.message}`);
        break;
      case 'workflow_completed':
      case 'langchain_workflow_completed':
        toast({
          title: `${engineName} Workflow Completed`,
          description: engineType === 'python-langchain' 
            ? "Python LangChain analysis with Pydantic validation completed"
            : engineType === 'langchain' 
            ? "Enhanced analysis with structured outputs completed" 
            : "All agents have finished processing",
        });
        break;
      case 'workflow_failed':
      case 'langchain_workflow_failed':
        toast({
          title: `${engineName} Workflow Failed`,
          description: message.error || "An error occurred",
          variant: "destructive",
        });
        break;
    }
  }, [toast]);

  const { isConnected } = useWebSocket(handleWebSocketMessage);

  // Find the most recent active workflow
  const activeWorkflow = workflows?.find(w => w.status === 'running') || workflows?.[0];

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <header className="bg-black border-b border-pink-500 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <div className="w-10 h-10 flex items-center justify-center mr-3">
                  <img src="/deutsche-telekom-logo.svg" alt="Deutsche Telekom" className="w-8 h-8" />
                </div>
                Deutsche Telekom AI Dashboard
              </h1>
              <p className="text-pink-500 mt-1">Powered by Advanced AI Agents</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-pink-500">System Status</div>
                <div className="text-pink-500 font-medium">● Online</div>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-8">
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricsCard
              title="Documents Processed"
              value={metrics?.ticketsProcessed || 0}
              change="+12%"
              icon={FileText}
              color="blue"
            />
            <MetricsCard
              title="Dependencies Mapped"
              value={metrics?.impactAnalyses || 0}
              change="+8%"
              icon={FileText}
              color="green"
            />
            <MetricsCard
              title="PRDs Generated"
              value={metrics?.solutionArchitectures || 0}
              change="+15%"
              icon={FileText}
              color="orange"
            />
            <MetricsCard
              title="Code Files Generated"
              value={metrics?.prdsGenerated || 0}
              change="+22%"
              icon={FileText}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <WorkflowProgress workflow={activeWorkflow} />
              <RecentActivity />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Quick Actions */}
              <Card className="bg-dark-secondary border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <JiraAnalysisModal>
                    <Button className="w-full bg-agent-blue hover:bg-blue-600">
                      <FileText className="w-4 h-4 mr-2" />
                      New Jira Analysis
                    </Button>
                  </JiraAnalysisModal>

                  <Button className="w-full bg-agent-green hover:bg-green-600">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Documents
                  </Button>

                  <Button className="w-full bg-agent-orange hover:bg-yellow-600">
                    <Download className="w-4 h-4 mr-2" />
                    Export Reports
                  </Button>
                </CardContent>
              </Card>

              <SystemHealth />

              {/* Available Models */}
              <Card className="bg-dark-secondary border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg">Available Models</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Ollama Service</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-400">Running</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm">69%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '69%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Processing Queue</span>
                      <span className="text-sm">3 jobs</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}