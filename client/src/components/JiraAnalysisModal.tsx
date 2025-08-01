import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JiraAnalysisModalProps {
  children?: React.ReactNode;
}

export function JiraAnalysisModal({ children }: JiraAnalysisModalProps) {
  const [open, setOpen] = useState(false);
  const [jiraTicketId, setJiraTicketId] = useState("");
  const [priority, setPriority] = useState("normal");
  const [engineType, setEngineType] = useState("python-langchain");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startWorkflowMutation = useMutation({
    mutationFn: async (data: { jiraTicketId: string; engineType: string }) => {
      const response = await apiRequest("POST", "/api/workflows", data);
      return response.json();
    },
    onSuccess: () => {
      const engineName = engineType === 'python-langchain' ? 'Python LangChain' 
                          : engineType === 'langchain' ? 'Node.js LangChain' 
                          : 'Basic';
      toast({
        title: "Workflow Started",
        description: `${engineName} analysis workflow for ${jiraTicketId} has been started.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      queryClient.invalidateQueries({ queryKey: ['/api/metrics'] });
      setOpen(false);
      setJiraTicketId("");
      setPriority("normal");
      setEngineType("python-langchain");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start workflow",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jiraTicketId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Jira ticket ID",
        variant: "destructive",
      });
      return;
    }

    startWorkflowMutation.mutate({ 
      jiraTicketId: jiraTicketId.trim(),
      engineType: engineType
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="bg-agent-blue hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            New Jira Analysis
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-dark-secondary border-gray-700">
        <DialogHeader>
          <DialogTitle>New Jira Analysis</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="jiraTicketId">Jira Ticket ID</Label>
            <Input
              id="jiraTicketId"
              placeholder="e.g., OAUS-4739, OMUS-2514"
              value={jiraTicketId}
              onChange={(e) => setJiraTicketId(e.target.value)}
              className="bg-gray-700 border-gray-600"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter a valid Jira ticket ID (e.g., OAUS-4739, OMUS-2514)
            </p>
          </div>
          
          <div>
            <Label htmlFor="engineType">Analysis Engine</Label>
            <Select value={engineType} onValueChange={setEngineType}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="python-langchain">🐍 Python LangChain (Recommended)</SelectItem>
                <SelectItem value="langchain">🧠 Node.js LangChain</SelectItem>
                <SelectItem value="basic">⚡ Basic Workflow</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-1 text-xs text-gray-400">
              {engineType === 'python-langchain' 
                ? 'Python-based LangChain with Pydantic validation, advanced RAG, and Chain-of-Thought reasoning'
                : engineType === 'langchain' 
                ? 'Node.js LangChain with enhanced RAG and structured outputs'
                : 'Simple agent workflow for basic analysis'
              }
            </div>
          </div>
          
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-agent-blue hover:bg-blue-600"
              disabled={startWorkflowMutation.isPending}
            >
              {startWorkflowMutation.isPending ? "Starting..." : "Start Analysis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
