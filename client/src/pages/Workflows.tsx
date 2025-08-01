
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Play, Pause, RotateCcw, GitBranch, Clock } from "lucide-react";

export default function Workflows() {
  const { data: workflows } = useQuery({
    queryKey: ['/api/workflows'],
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Workflows
                </h1>
                <p className="text-gray-400 mt-2">
                  Manage and monitor your AI workflow processes
                </p>
              </div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Play className="w-4 h-4 mr-2" />
                New Workflow
              </Button>
            </div>

            {/* Workflow Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-400">
                    <GitBranch className="w-5 h-5 mr-2" />
                    HSD Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">
                    Generate High-level Solution Design from Jira tickets
                  </p>
                  <Badge className="bg-blue-600/20 text-blue-400 border-blue-600">Available</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-green-400">
                    <GitBranch className="w-5 h-5 mr-2" />
                    PRD Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">
                    Create Product Requirements Documents
                  </p>
                  <Badge className="bg-green-600/20 text-green-400 border-green-600">Available</Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/50 border-gray-700 hover:border-purple-500/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400">
                    <GitBranch className="w-5 h-5 mr-2" />
                    Code Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">
                    Generate complete code architecture and scaffolding
                  </p>
                  <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">Available</Badge>
                </CardContent>
              </Card>
            </div>

            {/* Active Workflows */}
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-pink-400">
                  <Clock className="w-5 h-5 mr-2" />
                  Recent Workflows
                </CardTitle>
              </CardHeader>
              <CardContent>
                {workflows && workflows.length > 0 ? (
                  <div className="space-y-4">
                    {workflows.slice(0, 5).map((workflow: any) => (
                      <div key={workflow.id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge className={`${
                            workflow.status === 'completed' ? 'bg-green-600' :
                            workflow.status === 'running' ? 'bg-blue-600' :
                            workflow.status === 'failed' ? 'bg-red-600' : 'bg-gray-600'
                          }`}>
                            {workflow.status}
                          </Badge>
                          <div>
                            <p className="font-medium">{workflow.jiraTicketId || workflow.id}</p>
                            <p className="text-sm text-gray-400">
                              {workflow.currentAgent || workflow.currentStep}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                          {workflow.status === 'running' && (
                            <Button size="sm" variant="outline">
                              <Pause className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No workflows found</p>
                    <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                      Start Your First Workflow
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
