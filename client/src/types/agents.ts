export interface WorkflowState {
  jiraTicketId: string;
  jiraTicketData?: JiraTicket;
  ragContext?: string[];
  impactAnalysis?: string;
  solutionArchitecture?: string;
  prd?: PRD;
  error?: string;
}

export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string;
  priority: string;
  components: string[];
  labels: string[];
  acceptanceCriteria?: string;
  issueType: string;
  created: string;
  updated: string;
}

export interface PRD {
  title: string;
  introduction: string;
  problem_statement: string;
  user_stories: string[];
  technical_requirements: string[];
  non_functional_requirements: Record<string, string>;
  out_of_scope: string[];
  success_metrics: string[];
}

export interface Workflow {
  id: string;
  jiraTicketId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentAgent?: 'jira-analyst' | 'tech-architect' | 'product-manager' | null;
  jiraTicketData?: any;
  ragContext?: any;
  impactAnalysis?: string;
  solutionArchitecture?: string;
  prd?: any;
  error?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Metrics {
  id: string;
  ticketsProcessed?: number;
  impactAnalyses?: number;
  solutionArchitectures?: number;
  prdsGenerated?: number;
  updatedAt?: Date;
}

export interface Activity {
  id: string;
  workflowId?: string;
  type: string;
  message: string;
  createdAt?: Date;
}

export interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface WebSocketMessage {
  type: 'connected' | 'workflow_started' | 'workflow_updated' | 'agent_completed' | 'workflow_completed' | 'workflow_failed' | 
        'langchain_workflow_started' | 'langchain_workflow_updated' | 'langchain_agent_completed' | 'langchain_workflow_completed' | 
        'langchain_workflow_failed' | 'agent_progress';
  workflowId?: string;
  jiraTicketId?: string;
  status?: string;
  currentAgent?: string;
  agent?: string;
  message?: string;
  error?: string;
  engineType?: string;
  progress?: number;
  capabilities?: string[];
}
