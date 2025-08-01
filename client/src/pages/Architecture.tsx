
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { Database, Network, Server, Code } from "lucide-react";

export default function Architecture() {
  return (
    <div className="min-h-screen bg-black text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                System Architecture
              </h1>
              <p className="text-gray-400 mt-2">
                Overview of the complete system architecture and components
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Architecture Overview */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-purple-400">
                    <Network className="w-5 h-5 mr-2" />
                    System Components
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Server className="w-4 h-4 text-blue-400" />
                      <span>Frontend (React)</span>
                    </div>
                    <Badge className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Code className="w-4 h-4 text-green-400" />
                      <span>Node.js Backend</span>
                    </div>
                    <Badge className="bg-green-600">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Database className="w-4 h-4 text-yellow-400" />
                      <span>Python Agents</span>
                    </div>
                    <Badge className="bg-red-600">Disconnected</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Stack */}
              <Card className="bg-gray-900/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center text-pink-400">
                    <Database className="w-5 h-5 mr-2" />
                    Technology Stack
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600">React 18</Badge>
                    <Badge className="bg-green-600/20 text-green-400 border-green-600">Node.js</Badge>
                    <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600">Python</Badge>
                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600">LangChain</Badge>
                    <Badge className="bg-pink-600/20 text-pink-400 border-pink-600">TypeScript</Badge>
                    <Badge className="bg-indigo-600/20 text-indigo-400 border-indigo-600">Express</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Architecture Diagram */}
            <Card className="bg-gray-900/50 border-gray-700 mt-8">
              <CardHeader>
                <CardTitle className="text-purple-400">System Architecture Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                  <p className="text-gray-400">Architecture visualization will be available soon</p>
                  <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                    Generate Diagram
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
