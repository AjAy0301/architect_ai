import { ChatOllama } from "@langchain/ollama";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { z } from "zod";

import { 
  type WorkflowState, 
  type NodeResult, 
  type AgentContext,
  PRDLangChainSchema,
  type PRDLangChain 
} from './workflowState.js';
import { 
  TECHNICAL_ARCHITECT_PROMPT, 
  PRODUCT_MANAGER_PROMPT, 
  JIRA_ANALYST_SYSTEM_PROMPT,
  RAG_QUERY_ENHANCEMENT_PROMPT 
} from './prompts.js';
import { vectorStore } from '../vectorStore.js';
import { jiraClient } from '../jiraClient.js';

// Initialize LLM with optimal settings for reasoning
const llm = new ChatOllama({
          model: "llama3.1:8b",
  temperature: 0.1, // Lower temperature for more consistent reasoning
  topP: 0.9,
});

export class LangChainJiraAnalystAgent {
  private ragQueryChain: any;

  constructor() {
    const ragQueryPrompt = PromptTemplate.fromTemplate(RAG_QUERY_ENHANCEMENT_PROMPT);
    this.ragQueryChain = ragQueryPrompt.pipe(llm).pipe(new StringOutputParser());
  }

  async execute(state: WorkflowState, context: AgentContext): Promise<NodeResult> {
    try {
      console.log(`[LangChain] JiraAnalystAgent: Analyzing ticket ${state.jira_ticket_id}`);
      
      // Fetch Jira ticket data
      const jiraTicketData = await jiraClient.getTicket(state.jira_ticket_id);
      
      // Enhanced RAG query generation using LLM
      const enhancedQuery = await this.ragQueryChain.invoke({
        summary: jiraTicketData.summary,
        description: jiraTicketData.description,
        components: jiraTicketData.components.join(', '),
        labels: jiraTicketData.labels.join(', '),
      });

      console.log(`[LangChain] Enhanced RAG query: ${enhancedQuery}`);
      
      // Retrieve context with enhanced query and component filtering
      const searchResults = await vectorStore.searchSimilar(enhancedQuery, 7, {
        component: jiraTicketData.components[0] // Filter by primary component
      });
      
      const ragContext = searchResults.map(result => 
        `[${result.document.metadata.type || 'Document'}] ${result.document.content}`
      );
      
      // Broadcast progress
      context.broadcast({
        type: 'agent_progress',
        workflowId: context.workflowId,
        agent: 'jira-analyst',
        message: `Analyzed ${state.jira_ticket_id}, retrieved ${ragContext.length} context documents`,
        progress: 100,
      });

      console.log(`[LangChain] JiraAnalystAgent: Retrieved ${ragContext.length} context documents`);
      
      return {
        jira_ticket_data: jiraTicketData,
        rag_context: ragContext,
        current_step: 'tech_architect',
      };
    } catch (error) {
      const errorMessage = `JiraAnalystAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[LangChain] ${errorMessage}`);
      return { error: errorMessage };
    }
  }
}

export class LangChainTechnicalArchitectAgent {
  private architectChain: any;

  constructor() {
    const architectPrompt = PromptTemplate.fromTemplate(TECHNICAL_ARCHITECT_PROMPT);
    this.architectChain = architectPrompt.pipe(llm).pipe(new StringOutputParser());
  }

  async execute(state: WorkflowState, context: AgentContext): Promise<NodeResult> {
    try {
      console.log('[LangChain] TechnicalArchitectAgent: Generating impact analysis and solution architecture');
      
      if (!state.jira_ticket_data) {
        throw new Error('Jira ticket data not available');
      }

      const { jira_ticket_data, rag_context } = state;
      
      // Broadcast progress
      context.broadcast({
        type: 'agent_progress',
        workflowId: context.workflowId,
        agent: 'tech-architect',
        message: 'Analyzing impact and designing solution architecture...',
        progress: 50,
      });

      const response = await this.architectChain.invoke({
        summary: jira_ticket_data.summary,
        description: jira_ticket_data.description,
        components: jira_ticket_data.components.join(', '),
        priority: jira_ticket_data.priority,
        issueType: jira_ticket_data.issueType,
        acceptanceCriteria: jira_ticket_data.acceptanceCriteria || 'Not specified',
        rag_context: (rag_context || []).join('\n---\n'),
      });
      
      // Parse the response to extract impact analysis and solution architecture
      const sections = this.parseArchitectResponse(response);
      
      // Broadcast completion
      context.broadcast({
        type: 'agent_progress',
        workflowId: context.workflowId,
        agent: 'tech-architect',
        message: 'Impact analysis and solution architecture completed',
        progress: 100,
      });

      console.log('[LangChain] TechnicalArchitectAgent: Generated comprehensive analysis');
      
      return {
        impact_analysis: sections.impactAnalysis,
        solution_architecture: sections.solutionArchitecture,
        current_step: 'product_manager',
      };
    } catch (error) {
      const errorMessage = `TechnicalArchitectAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[LangChain] ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  private parseArchitectResponse(response: string): { impactAnalysis: string; solutionArchitecture: string } {
    const sections = response.split('## Solution Architecture');
    const impactAnalysis = sections[0].replace('## Impact Analysis', '').trim();
    const solutionArchitecture = sections[1] ? `## Solution Architecture${sections[1]}`.trim() : '';
    
    return { impactAnalysis, solutionArchitecture };
  }
}

export class LangChainProductManagerAgent {
  private prdChain: any;
  private outputParser: any;

  constructor() {
    // Create format instructions for structured output
    const formatInstructions = this.createFormatInstructions();
    
    const prdPrompt = PromptTemplate.fromTemplate(PRODUCT_MANAGER_PROMPT);
    this.prdChain = prdPrompt.pipe(llm).pipe(new StringOutputParser());
  }

  private createFormatInstructions(): string {
    return `Please respond with a valid JSON object that matches this exact schema:
{
  "title": "string - The title of the feature or change",
  "introduction": "string - Brief overview of the project's purpose and goals",
  "problem_statement": "string - Clear description of the problem being solved",
  "user_stories": ["array of strings - User stories in 'As a [user type], I want [goal] so that [benefit]' format"],
  "technical_requirements": ["array of strings - Specific technical requirements from the solution architecture"],
  "non_functional_requirements": {"object - Performance, Security, Scalability requirements"},
  "out_of_scope": ["array of strings - Items explicitly not part of this project"],
  "success_metrics": ["array of strings - Quantifiable metrics to measure success"]
}

Ensure the JSON is valid and complete. Do not include any text before or after the JSON object.`;
  }

  async execute(state: WorkflowState, context: AgentContext): Promise<NodeResult> {
    try {
      console.log('[LangChain] ProductManagerAgent: Generating structured PRD');
      
      if (!state.jira_ticket_data || !state.impact_analysis || !state.solution_architecture) {
        throw new Error('Required data not available for PRD generation');
      }

      // Broadcast progress
      context.broadcast({
        type: 'agent_progress',
        workflowId: context.workflowId,
        agent: 'product-manager',
        message: 'Generating comprehensive PRD document...',
        progress: 50,
      });

      const response = await this.prdChain.invoke({
        summary: state.jira_ticket_data.summary,
        description: state.jira_ticket_data.description,
        acceptanceCriteria: state.jira_ticket_data.acceptanceCriteria || 'Not specified',
        impact_analysis: state.impact_analysis,
        solution_architecture: state.solution_architecture,
        format_instructions: this.createFormatInstructions(),
      });
      
      // Parse and validate the structured response
      const prd = this.parseStructuredResponse(response);
      
      // Broadcast completion
      context.broadcast({
        type: 'agent_progress',
        workflowId: context.workflowId,
        agent: 'product-manager',
        message: 'Structured PRD document generated successfully',
        progress: 100,
      });

      console.log('[LangChain] ProductManagerAgent: Generated structured PRD');
      
      return { 
        prd,
        current_step: 'completed',
      };
    } catch (error) {
      const errorMessage = `ProductManagerAgent failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(`[LangChain] ${errorMessage}`);
      return { error: errorMessage };
    }
  }

  private parseStructuredResponse(response: string): PRDLangChain {
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonString = response.trim();
      
      // Remove markdown code block markers if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7);
      }
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.substring(3);
      }
      if (jsonString.endsWith('```')) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Validate using Zod schema
      return PRDLangChainSchema.parse(parsed);
    } catch (error) {
      console.error('[LangChain] Error parsing structured response:', error);
      console.error('[LangChain] Raw response:', response);
      
      // Fallback to basic structure if parsing fails
      return {
        title: "PRD Generation Failed",
        introduction: "Unable to parse structured response from LLM",
        problem_statement: "Parsing error occurred during PRD generation",
        user_stories: ["As a user, I want the system to generate valid PRDs"],
        technical_requirements: ["Fix JSON parsing in ProductManagerAgent"],
        non_functional_requirements: { "Reliability": "System should handle parsing errors gracefully" },
        out_of_scope: ["Manual PRD creation"],
        success_metrics: ["Successful JSON parsing rate > 95%"],
      };
    }
  }
}

// Export agent instances
export const langChainJiraAnalystAgent = new LangChainJiraAnalystAgent();
export const langChainTechnicalArchitectAgent = new LangChainTechnicalArchitectAgent();
export const langChainProductManagerAgent = new LangChainProductManagerAgent();