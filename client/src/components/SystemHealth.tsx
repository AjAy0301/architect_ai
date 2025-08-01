import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { OllamaModel } from "@/types/agents";

interface HealthStatus {
  status: string;
  ollama: string;
  jira: string;
  timestamp: string;
}

export function SystemHealth() {
  const { data: health } = useQuery<HealthStatus>({
    queryKey: ['/api/health'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: models } = useQuery<OllamaModel[]>({
    queryKey: ['/api/ollama/models'],
  });

  return (
    <Card className="bg-dark-secondary border-gray-700">
      <CardHeader>
        <CardTitle className="text-lg">System Health</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              health?.ollama === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">Ollama Service</span>
          </div>
          <span className={`text-sm font-medium ${
            health?.ollama === 'connected' ? 'text-green-400' : 'text-red-400'
          }`}>
            {health?.ollama === 'connected' ? 'Running' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Memory Usage</span>
          <span className="text-sm font-medium">3.2GB / 16GB</span>
        </div>
        <Progress value={20} className="h-2" />
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Vector Store</span>
          <span className="text-sm font-medium">2.1K docs</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Available Models</span>
          <span className="text-sm font-medium">{models?.length || 0}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              health?.jira === 'connected' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm">Jira Connection</span>
          </div>
          <span className={`text-sm font-medium ${
            health?.jira === 'connected' ? 'text-green-400' : 'text-red-400'
          }`}>
            {health?.jira === 'connected' ? 'Connected' : 'Mock Mode'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
