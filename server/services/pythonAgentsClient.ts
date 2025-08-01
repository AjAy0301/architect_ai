import fetch from 'node-fetch';
import WebSocket from 'ws';

interface PythonWorkflowRequest {
  jira_ticket_id: string;
  engine_type: string;
}

interface PythonWorkflowResponse {
  workflow_id: string;
  status: string;
  message: string;
  current_step?: string;
  error?: string;
}

interface PythonAgentProgress {
  type: string;
  workflow_id: string;
  agent: string;
  message: string;
  progress: number;
  completed: boolean;
}

export class PythonAgentsClient {
  private baseUrl: string;
  private wsUrl: string;
  private wsConnection: WebSocket | null = null;
  private messageHandlers: Map<string, (message: any) => void> = new Map();

  constructor() {
    this.baseUrl = process.env.PYTHON_AGENTS_URL || 'http://localhost:8001';
    this.wsUrl = this.baseUrl.replace('http', 'ws') + '/ws';
  }

  async startWorkflow(jiraTicketId: string): Promise<string> {
    try {
      console.log(`[Python Client] Starting Python workflow for ticket: ${jiraTicketId}`);
      
      const response = await fetch(`${this.baseUrl}/workflow/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jira_ticket_id: jiraTicketId,
          engine_type: 'langchain'
        } as PythonWorkflowRequest),
      });

      if (!response.ok) {
        throw new Error(`Python agents server error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json() as PythonWorkflowResponse;
      console.log(`[Python Client] Workflow started with ID: ${result.workflow_id}`);
      
      return result.workflow_id;
    } catch (error) {
      console.error('[Python Client] Failed to start workflow:', error);
      throw error;
    }
  }

  async getWorkflowStatus(workflowId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/workflow/${workflowId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Python agents server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[Python Client] Failed to get workflow status for ${workflowId}:`, error);
      return null;
    }
  }

  async getAllWorkflows(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/workflows`);
      
      if (!response.ok) {
        throw new Error(`Python agents server error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[Python Client] Failed to get all workflows:', error);
      return { count: 0, workflows: {} };
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      
      if (response.ok) {
        const health = await response.json() as any;
        return health.status === 'healthy';
      }
      
      return false;
    } catch (error) {
      console.error('[Python Client] Health check failed:', error);
      return false;
    }
  }

  connectWebSocket(onMessage?: (message: any) => void): void {
    if (this.wsConnection) {
      return; // Already connected
    }

    try {
      console.log(`[Python Client] Connecting to WebSocket: ${this.wsUrl}`);
      this.wsConnection = new WebSocket(this.wsUrl);

      this.wsConnection.on('open', () => {
        console.log('[Python Client] WebSocket connected to Python agents');
      });

      this.wsConnection.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('[Python Client] Received message:', message);
          
          if (onMessage) {
            onMessage(message);
          }
          
          // Call registered handlers
          this.messageHandlers.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('[Python Client] Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('[Python Client] Error parsing WebSocket message:', error);
        }
      });

      this.wsConnection.on('close', () => {
        console.log('[Python Client] WebSocket connection closed');
        this.wsConnection = null;
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          this.connectWebSocket(onMessage);
        }, 5000);
      });

      this.wsConnection.on('error', (error) => {
        console.error('[Python Client] WebSocket error:', error);
      });
    } catch (error) {
      console.error('[Python Client] Failed to connect WebSocket:', error);
    }
  }

  addMessageHandler(id: string, handler: (message: any) => void): void {
    this.messageHandlers.set(id, handler);
  }

  removeMessageHandler(id: string): void {
    this.messageHandlers.delete(id);
  }

  disconnect(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }
}

export const pythonAgentsClient = new PythonAgentsClient();