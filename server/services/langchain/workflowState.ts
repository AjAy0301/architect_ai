import { z } from "zod";
import { type PRD } from "@shared/schema";

// Enhanced workflow state interface for LangGraph implementation
export interface WorkflowState {
  jira_ticket_id: string;
  jira_ticket_data?: {
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
  };
  rag_context?: string[];
  impact_analysis?: string;
  solution_architecture?: string;
  prd?: PRD;
  error?: string;
  current_step?: 'jira_analyst' | 'tech_architect' | 'product_manager' | 'completed';
  metadata?: Record<string, any>;
}

// Enhanced PRD schema for Pydantic-style parsing
export const PRDLangChainSchema = z.object({
  title: z.string().describe("The title of the feature or change described in the Jira ticket"),
  introduction: z.string().describe("A brief, one-paragraph overview of the project's purpose and goals"),
  problem_statement: z.string().describe("A clear and concise description of the problem this change is solving"),
  user_stories: z.array(z.string()).describe("A list of user stories in the format 'As a [user type], I want [goal] so that [benefit]'"),
  technical_requirements: z.array(z.string()).describe("A list of specific technical requirements derived from the solution architecture"),
  non_functional_requirements: z.record(z.string()).describe("A dictionary of non-functional requirements, with keys like 'Performance', 'Security', 'Scalability'"),
  out_of_scope: z.array(z.string()).describe("A list of items that are explicitly not part of this project"),
  success_metrics: z.array(z.string()).describe("A list of quantifiable metrics that will be used to measure the success of this feature"),
});

export type PRDLangChain = z.infer<typeof PRDLangChainSchema>;

// Graph node result interface
export interface NodeResult {
  [key: string]: any;
  error?: string;
}

// Agent execution context
export interface AgentContext {
  workflowId: string;
  broadcast: (message: any) => void;
  updateStorage: (updates: Partial<WorkflowState>) => Promise<void>;
}