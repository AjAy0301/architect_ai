import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Workflow } from "@/types/agents";

interface WorkflowProgressProps {
  workflow?: Workflow;
}

export function WorkflowProgress({ workflow }: WorkflowProgressProps) {
  const getAgentStatus = (agentName: string) => {
    if (!workflow) return 'pending';
    
    if (workflow.status === 'failed') return 'failed';
    if (workflow.status === 'completed') return 'completed';
    
    if (workflow.currentAgent === agentName) return 'running';
    
    // Check if this agent has already completed
    const agentOrder = ['jira-analyst', 'tech-architect', 'product-manager'];
    const currentIndex = agentOrder.indexOf(workflow.currentAgent || '');
    const thisIndex = agentOrder.indexOf(agentName);
    
    if (currentIndex > thisIndex) return 'completed';
    return 'pending';
  };

  const getAgentProgress = (agentName: string) => {
    const status = getAgentStatus(agentName);
    if (status === 'completed') return 100;
    if (status === 'running') return 75;
    return 0;
  };

  const isPythonLangChain = workflow?.engineType === 'python-langchain';
  const isLangChain = workflow?.engineType === 'langchain';
  
  const agents = [
    {
      name: 'Jira Analyst Agent',
      key: 'jira-analyst',
      description: isPythonLangChain
        ? (workflow?.jiraTicketData 
          ? `Python LangChain semantic analysis with Pydantic validation completed`
          : 'Performing Python-based enhanced analysis with LLM-optimized RAG')
        : isLangChain 
        ? (workflow?.jiraTicketData 
          ? `Enhanced semantic RAG analysis completed`
          : 'Performing enhanced ticket analysis with semantic context retrieval')
        : (workflow?.jiraTicketData 
          ? `Ticket ${workflow.jiraTicketId} analyzed, context retrieved`
          : 'Fetching ticket data and RAG context'),
      color: 'bg-agent-blue',
    },
    {
      name: 'Technical Architect Agent',
      key: 'tech-architect',
      description: isPythonLangChain
        ? 'Python Chain-of-Thought reasoning with step-by-step analysis and advanced prompt engineering'
        : isLangChain 
        ? 'Generating impact analysis using Chain-of-Thought reasoning with enhanced prompts'
        : 'Generating impact analysis using Chain-of-Thought prompting',
      color: 'bg-agent-green',
    },
    {
      name: 'Product Manager Agent',
      key: 'product-manager',
      description: isPythonLangChain
        ? 'Python Pydantic schema validation with structured JSON generation and comprehensive PRD formatting'
        : isLangChain 
        ? 'Creating structured PRD with Pydantic validation and comprehensive formatting'
        : 'Creating structured PRD document',
      color: 'bg-agent-orange',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'running':
        return <Loader2 className="w-5 h-5 text-white animate-spin" />;
      case 'failed':
        return <CheckCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'running':
        return <Badge className="bg-yellow-500/20 text-yellow-400">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400">Queued</Badge>;
    }
  };

  return (
    <Card className="bg-dark-secondary border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Current Workflow</CardTitle>
            {workflow && workflow.id && (
              <div className="text-sm text-gray-400 mt-1">
                Engine: {workflow.engineType === 'python-langchain' ? '🐍 Python LangChain' 
                        : workflow.engineType === 'langchain' ? '🧠 Node.js LangChain' 
                        : '⚡ Basic'}
              </div>
            )}
          </div>
          {workflow && (
            <Badge className={
              workflow.status === 'completed' ? 'bg-green-500/20 text-green-400' :
              workflow.status === 'running' ? 'bg-yellow-500/20 text-yellow-400' :
              workflow.status === 'failed' ? 'bg-red-500/20 text-red-400' :
              'bg-gray-500/20 text-gray-400'
            }>
              {workflow.status === 'running' ? 'Active' : workflow.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {agents.map((agent) => {
          const status = getAgentStatus(agent.key);
          const progress = getAgentProgress(agent.key);
          
          return (
            <div key={agent.key} className="flex items-center space-x-4">
              <div className={`w-10 h-10 ${agent.color} rounded-full flex items-center justify-center ${
                status === 'running' ? 'animate-pulse-blue' : ''
              }`}>
                {getStatusIcon(status)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{agent.name}</span>
                  {getStatusBadge(status)}
                </div>
                <Progress value={progress} className="h-2 mb-1" />
                <div className="text-sm text-gray-400">{agent.description}</div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
