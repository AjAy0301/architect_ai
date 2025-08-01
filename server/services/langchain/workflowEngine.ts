import { storage } from '../../storage.js';
import { 
  langChainJiraAnalystAgent, 
  langChainTechnicalArchitectAgent, 
  langChainProductManagerAgent 
} from './agents.js';
import { type WorkflowState, type AgentContext } from './workflowState.js';
import { type Workflow } from '@shared/schema';
import WebSocket from 'ws';

export class LangChainWorkflowEngine {
  private activeWorkflows: Map<string, WorkflowState> = new Map();
  private wsClients: Set<WebSocket> = new Set();

  addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  async startWorkflow(jiraTicketId: string): Promise<string> {
    console.log(`[LangChain] Starting enhanced workflow for ticket: ${jiraTicketId}`);
    
    // Create workflow record
    const workflow = await storage.createWorkflow({
      jiraTicketId,
      status: 'pending',
      currentAgent: 'jira-analyst',
    });

    // Initialize enhanced workflow state
    const state: WorkflowState = {
      jira_ticket_id: jiraTicketId,
      current_step: 'jira_analyst',
      metadata: {
        startTime: new Date().toISOString(),
        engineType: 'langchain',
        version: '2.0'
      }
    };
    
    this.activeWorkflows.set(workflow.id, state);
    
    // Broadcast workflow started
    this.broadcast({
      type: 'langchain_workflow_started',
      workflowId: workflow.id,
      jiraTicketId,
      engineType: 'langchain',
    });

    // Start execution asynchronously
    this.executeWorkflow(workflow.id).catch(error => {
      console.error(`[LangChain] Workflow ${workflow.id} failed:`, error);
    });

    return workflow.id;
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const state = this.activeWorkflows.get(workflowId);
    if (!state) {
      throw new Error(`[LangChain] Workflow ${workflowId} not found`);
    }

    const context: AgentContext = {
      workflowId,
      broadcast: this.broadcast.bind(this),
      updateStorage: async (updates: Partial<WorkflowState>) => {
        Object.assign(state, updates);
        await storage.updateWorkflow(workflowId, {
          jiraTicketData: state.jira_ticket_data,
          ragContext: state.rag_context,
          impactAnalysis: state.impact_analysis,
          solutionArchitecture: state.solution_architecture,
          prd: state.prd,
          currentAgent: state.current_step,
        });
      }
    };

    try {
      // Update workflow status
      await storage.updateWorkflow(workflowId, { 
        status: 'running',
        currentAgent: 'jira-analyst' 
      });

      this.broadcast({
        type: 'langchain_workflow_updated',
        workflowId,
        status: 'running',
        currentAgent: 'jira-analyst',
      });

      // Step 1: Enhanced Jira Analyst Agent
      console.log(`[LangChain] Executing JiraAnalystAgent for workflow ${workflowId}`);
      const analystResult = await langChainJiraAnalystAgent.execute(state, context);
      
      if (analystResult.error) {
        throw new Error(analystResult.error);
      }

      Object.assign(state, analystResult);
      await context.updateStorage(state);
      
      await storage.createActivity({
        workflowId,
        type: 'langchain_ticket_analyzed',
        message: `[LangChain] ${state.jira_ticket_id} analyzed with enhanced RAG context`,
      });

      // Update metrics
      const metrics = await storage.getMetrics();
      if (metrics) {
        await storage.updateMetrics({
          ticketsProcessed: (metrics.ticketsProcessed || 0) + 1,
        });
      }

      this.broadcast({
        type: 'langchain_agent_completed',
        workflowId,
        agent: 'jira-analyst',
        message: 'Enhanced ticket analysis with semantic RAG retrieval completed',
      });

      // Step 2: Enhanced Technical Architect Agent
      console.log(`[LangChain] Executing TechnicalArchitectAgent for workflow ${workflowId}`);
      const architectResult = await langChainTechnicalArchitectAgent.execute(state, context);
      
      if (architectResult.error) {
        throw new Error(architectResult.error);
      }

      Object.assign(state, architectResult);
      await context.updateStorage(state);
      
      await storage.createActivity({
        workflowId,
        type: 'langchain_impact_completed',
        message: `[LangChain] Chain-of-Thought impact analysis and solution architecture completed`,
      });

      // Update metrics
      if (metrics) {
        await storage.updateMetrics({
          impactAnalyses: (metrics.impactAnalyses || 0) + 1,
          solutionArchitectures: (metrics.solutionArchitectures || 0) + 1,
        });
      }

      this.broadcast({
        type: 'langchain_agent_completed',
        workflowId,
        agent: 'tech-architect',
        message: 'Chain-of-Thought reasoning for impact analysis and solution design completed',
      });

      // Step 3: Enhanced Product Manager Agent
      console.log(`[LangChain] Executing ProductManagerAgent for workflow ${workflowId}`);
      const pmResult = await langChainProductManagerAgent.execute(state, context);
      
      if (pmResult.error) {
        throw new Error(pmResult.error);
      }

      Object.assign(state, pmResult);
      await context.updateStorage(state);
      
      await storage.updateWorkflow(workflowId, {
        status: 'completed',
        currentAgent: null,
        prd: state.prd,
      });

      await storage.createActivity({
        workflowId,
        type: 'langchain_prd_completed',
        message: `[LangChain] Structured PRD document generated with Pydantic validation`,
      });

      // Update metrics
      if (metrics) {
        await storage.updateMetrics({
          prdsGenerated: (metrics.prdsGenerated || 0) + 1,
        });
      }

      this.broadcast({
        type: 'langchain_workflow_completed',
        workflowId,
        message: 'Enhanced LangChain workflow completed with structured outputs',
        engineType: 'langchain',
      });

      console.log(`[LangChain] Workflow ${workflowId} completed successfully`);

    } catch (error) {
      console.error(`[LangChain] Workflow ${workflowId} failed:`, error);
      
      await storage.updateWorkflow(workflowId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.broadcast({
        type: 'langchain_workflow_failed',
        workflowId,
        error: error instanceof Error ? error.message : 'Unknown error',
        engineType: 'langchain',
      });
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<Workflow | undefined> {
    return storage.getWorkflow(workflowId);
  }

  async getAllWorkflows(): Promise<Workflow[]> {
    return storage.getAllWorkflows();
  }

  // Enhanced workflow diagnostics
  async getWorkflowDiagnostics(workflowId: string) {
    const workflow = await storage.getWorkflow(workflowId);
    const state = this.activeWorkflows.get(workflowId);
    
    return {
      workflow,
      state,
      isActive: this.activeWorkflows.has(workflowId),
      engineType: 'langchain',
      capabilities: [
        'Enhanced RAG with semantic search',
        'Chain-of-Thought reasoning',
        'Structured Pydantic outputs',
        'Real-time progress tracking'
      ]
    };
  }
}

export const langChainWorkflowEngine = new LangChainWorkflowEngine();