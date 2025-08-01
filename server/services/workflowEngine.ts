import { storage } from '../storage.js';
import { jiraAnalystAgent, technicalArchitectAgent, productManagerAgent, type WorkflowState } from './agents.js';
import { type Workflow } from '@shared/schema';
import WebSocket from 'ws';

export class WorkflowEngine {
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
    console.log(`Starting workflow for ticket: ${jiraTicketId}`);
    
    // Create workflow record
    const workflow = await storage.createWorkflow({
      jiraTicketId,
      status: 'pending',
      currentAgent: 'jira-analyst',
    });

    // Initialize workflow state
    const state: WorkflowState = {
      jiraTicketId,
    };
    
    this.activeWorkflows.set(workflow.id, state);
    
    // Broadcast workflow started
    this.broadcast({
      type: 'workflow_started',
      workflowId: workflow.id,
      jiraTicketId,
    });

    // Start execution asynchronously
    this.executeWorkflow(workflow.id).catch(error => {
      console.error(`Workflow ${workflow.id} failed:`, error);
    });

    return workflow.id;
  }

  private async executeWorkflow(workflowId: string): Promise<void> {
    const state = this.activeWorkflows.get(workflowId);
    if (!state) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    try {
      // Update workflow status
      await storage.updateWorkflow(workflowId, { 
        status: 'running',
        currentAgent: 'jira-analyst' 
      });

      this.broadcast({
        type: 'workflow_updated',
        workflowId,
        status: 'running',
        currentAgent: 'jira-analyst',
      });

      // Step 1: Jira Analyst Agent
      console.log(`Executing JiraAnalystAgent for workflow ${workflowId}`);
      const analystResult = await jiraAnalystAgent.execute(state);
      
      if (analystResult.error) {
        throw new Error(analystResult.error);
      }

      Object.assign(state, analystResult);
      
      await storage.updateWorkflow(workflowId, {
        currentAgent: 'tech-architect',
        jiraTicketData: state.jiraTicketData,
        ragContext: state.ragContext,
      });

      await storage.createActivity({
        workflowId,
        type: 'ticket_analyzed',
        message: `${state.jiraTicketId} analyzed, context retrieved`,
      });

      // Update metrics
      const metrics = await storage.getMetrics();
      if (metrics) {
        await storage.updateMetrics({
          ticketsProcessed: (metrics.ticketsProcessed || 0) + 1,
        });
      }

      this.broadcast({
        type: 'agent_completed',
        workflowId,
        agent: 'jira-analyst',
        message: 'Ticket analyzed, context retrieved',
      });

      // Step 2: Technical Architect Agent
      console.log(`Executing TechnicalArchitectAgent for workflow ${workflowId}`);
      const architectResult = await technicalArchitectAgent.execute(state);
      
      if (architectResult.error) {
        throw new Error(architectResult.error);
      }

      Object.assign(state, architectResult);
      
      await storage.updateWorkflow(workflowId, {
        currentAgent: 'product-manager',
        impactAnalysis: state.impactAnalysis,
        solutionArchitecture: state.solutionArchitecture,
      });

      await storage.createActivity({
        workflowId,
        type: 'impact_completed',
        message: `Impact analysis and solution architecture completed`,
      });

      // Update metrics
      if (metrics) {
        await storage.updateMetrics({
          impactAnalyses: (metrics.impactAnalyses || 0) + 1,
          solutionArchitectures: (metrics.solutionArchitectures || 0) + 1,
        });
      }

      this.broadcast({
        type: 'agent_completed',
        workflowId,
        agent: 'tech-architect',
        message: 'Impact analysis and solution architecture completed',
      });

      // Step 3: Product Manager Agent
      console.log(`Executing ProductManagerAgent for workflow ${workflowId}`);
      const pmResult = await productManagerAgent.execute(state);
      
      if (pmResult.error) {
        throw new Error(pmResult.error);
      }

      Object.assign(state, pmResult);
      
      await storage.updateWorkflow(workflowId, {
        status: 'completed',
        currentAgent: null,
        prd: state.prd,
      });

      await storage.createActivity({
        workflowId,
        type: 'prd_completed',
        message: `PRD document generated and completed`,
      });

      // Update metrics
      if (metrics) {
        await storage.updateMetrics({
          prdsGenerated: (metrics.prdsGenerated || 0) + 1,
        });
      }

      this.broadcast({
        type: 'workflow_completed',
        workflowId,
        message: 'All agents completed successfully',
      });

      console.log(`Workflow ${workflowId} completed successfully`);

    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error);
      
      await storage.updateWorkflow(workflowId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      this.broadcast({
        type: 'workflow_failed',
        workflowId,
        error: error instanceof Error ? error.message : 'Unknown error',
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
}

export const workflowEngine = new WorkflowEngine();
