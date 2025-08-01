import type { Express } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { storage } from "./storage.js";
import { workflowEngine } from "./services/workflowEngine.js";
import { langChainWorkflowEngine } from "./services/langchain/workflowEngine.js";
import { pythonAgentsClient } from "./services/pythonAgentsClient.js";
import { ollamaService } from "./services/ollama.js";
import { jiraClient } from "./services/jiraClient.js";
import { vectorStore } from "./services/vectorStore.js";
import { insertWorkflowSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check
  app.get("/api/health", async (req, res) => {
    try {
      const ollamaStatus = await ollamaService.isAvailable() ? "connected" : "disconnected";
      const jiraStatus = await jiraClient.validateConnection() ? "connected" : "disconnected";
      const pythonAgentsStatus = await pythonAgentsClient.checkHealth() ? "connected" : "disconnected";

      res.json({
        status: "ok",
        ollama: ollamaStatus,
        jira: jiraStatus,
        pythonAgents: pythonAgentsStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({ 
        status: "error", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  // Get metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const metrics = await storage.getMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  // Get all workflows
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflows" });
    }
  });

  // Get specific workflow
  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch workflow" });
    }
  });

  // Start new workflow
  app.post("/api/workflows", async (req, res) => {
    try {
      const { jiraTicketId, engineType = 'basic' } = req.body;

      if (!jiraTicketId) {
        return res.status(400).json({ error: "jiraTicketId is required" });
      }

      let workflowId: string;

      if (engineType === 'python-langchain') {
        // Use Python-based LangChain agents
        workflowId = await pythonAgentsClient.startWorkflow(jiraTicketId);

        // Create a workflow record in Node.js storage for consistency
        const workflow = await storage.createWorkflow({
          jiraTicketId,
          status: 'running',
          currentAgent: 'python-jira-analyst',
          engineType: 'python-langchain',
        });

        res.status(201).json({ ...workflow, pythonWorkflowId: workflowId });
      } else if (engineType === 'langchain') {
        // Use Node.js LangChain workflow
        workflowId = await langChainWorkflowEngine.startWorkflow(jiraTicketId);
        const workflow = await storage.getWorkflow(workflowId);
        res.status(201).json({ ...workflow, engineType: 'langchain' });
      } else {
        // Use basic workflow
        workflowId = await workflowEngine.startWorkflow(jiraTicketId);
        const workflow = await storage.getWorkflow(workflowId);
        res.status(201).json({ ...workflow, engineType: 'basic' });
      }
    } catch (error) {
      console.error("Error starting workflow:", error);
      res.status(500).json({ 
        error: "Failed to start workflow",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // LangChain workflow endpoint
  app.post('/api/workflows/langchain', async (req, res) => {
    try {
      const { jiraTicketId = 'AUTO-GENERATED', engineType = 'langchain' } = req.body;

      // Use Node.js LangChain agents for the full flow
      const workflowId = await langChainWorkflowEngine.startWorkflow(jiraTicketId);

      res.json({ workflowId, status: 'started', engineType });
    } catch (error) {
      console.error('Failed to start LangChain workflow:', error);
      res.status(500).json({ error: 'Failed to start LangChain workflow' });
    }
  });

  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activities" });
    }
  });

  // Get Ollama models
  app.get("/api/ollama/models", async (req, res) => {
    try {
      const models = await ollamaService.listModels();
      res.json(models);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Ollama models" });
    }
  });

  // Upload documents to vector store
  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);

      const document = await storage.createDocument(validatedData);

      // Add to vector store
      await vectorStore.addDocument({
        id: document.id,
        content: document.content,
        metadata: document.metadata || {},
      });

      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid document data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create document" });
    }
  });

  // Get all documents
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Search documents
  app.get("/api/documents/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const results = await vectorStore.searchSimilar(q, 10);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to search documents" });
    }
  });

  // Export workflow documents
  app.get("/api/workflows/:id/export", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const exportData = {
        workflow,
        impactAnalysis: workflow.impactAnalysis,
        solutionArchitecture: workflow.solutionArchitecture,
        prd: workflow.prd,
        exportedAt: new Date().toISOString(),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="workflow-${workflow.id}-export.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export workflow" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');

    // Add client to both workflow engines for real-time updates
    workflowEngine.addWebSocketClient(ws);
    langChainWorkflowEngine.addWebSocketClient(ws);

    // Connect to Python agents WebSocket for message forwarding
    pythonAgentsClient.connectWebSocket((message) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          ...message,
          source: 'python-agents'
        }));
      }
    });

    // Send initial connection message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established',
      capabilities: ['basic-workflow', 'langchain-workflow', 'python-langchain-workflow'],
    }));

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Enhanced workflow diagnostics endpoint
  app.get("/api/workflows/:id/diagnostics", async (req, res) => {
    try {
      const workflowId = req.params.id;
      const basicDiagnostics = await workflowEngine.getWorkflowStatus(workflowId);
      const langChainDiagnostics = await langChainWorkflowEngine.getWorkflowDiagnostics(workflowId);

      res.json({
        basic: basicDiagnostics,
        langchain: langChainDiagnostics,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get workflow diagnostics" });
    }
  });

  // HSD Generator routes
app.post('/api/workflows/hsd-generator', async (req, res) => {
  try {
    const { jiraTicketId } = req.body;

    console.log(`Starting HSD generation for ticket: ${jiraTicketId}`);

    // Call Python LangChain agent directly for HSD generation
    const response = await fetch('http://localhost:8001/generate-hsd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jira_ticket_id: jiraTicketId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`HSD generation completed for ticket: ${jiraTicketId}`);

    res.json(result);
  } catch (error) {
    console.log(`HSD generation error: ${error}`);
    res.status(500).json({ 
      error: 'HSD generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.get('/api/hsd-tickets/recent', async (req, res) => {
  try {
    // Get recent HSD tickets from Python service
    const response = await fetch('http://localhost:8001/recent-hsd-tickets');

    if (!response.ok) {
      throw new Error(`Python service error: ${response.statusText}`);
    }

    const result = await response.json();
    res.json(result);
  } catch (error) {
    console.log(`Failed to fetch recent HSD tickets: ${error}`);
    res.json([]); // Return empty array on error
  }
});

  // HSD Generator workflow
  app.post('/api/workflows/hsd-generator', async (req: Request, res: Response) => {
    try {
      const { jiraTicketId, engineType = 'python-langchain' } = req.body;

      if (!jiraTicketId) {
        return res.status(400).json({ error: 'Jira ticket ID is required' });
      }

      console.log(`Starting HSD generation for ticket: ${jiraTicketId} using ${engineType}`);

      if (engineType === 'python-langchain') {
        // Use Python LangChain agents
        const result = await pythonAgentsClient.executeWorkflow('hsd-generator', {
          jiraTicketId,
          engineType
        });

        res.json(result);
      } else {
        // Use Node.js LangChain agents (fallback)
        const workflowId = uuidv4();

        const initialState: WorkflowState = {
          workflowId,
          jiraTicketId,
          currentStep: 'jira-analyst',
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await storage.saveWorkflowState(workflowId, initialState);

        const context: AgentContext = {
          workflowId,
          broadcast: (message) => {
            console.log(`Broadcasting: ${JSON.stringify(message)}`);
          },
        };

        const result = await langChainWorkflowEngine.executeWorkflow(initialState, context);
        res.json(result);
      }
    } catch (error) {
      console.error('HSD Generator workflow error:', error);
      res.status(500).json({ 
        error: 'HSD generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // PRD Generator workflow
  app.post('/api/workflows/prd-generator', async (req: Request, res: Response) => {
    try {
      const { description, ticketId, engineType = 'python-langchain' } = req.body;

      if (!description && !ticketId) {
        return res.status(400).json({ error: 'Either description or ticket ID is required' });
      }

      console.log(`Starting PRD generation using ${engineType}`);

      if (engineType === 'python-langchain') {
        // Use Python LangChain agents
        const result = await pythonAgentsClient.executeWorkflow('prd-generator', {
          description,
          ticketId,
          engineType
        });

        res.json(result);
      } else {
        // Use Node.js LangChain agents (fallback)
        const workflowId = uuidv4();

        const initialState: WorkflowState = {
          workflowId,
          jiraTicketId: ticketId,
          description,
          currentStep: 'product-manager',
          status: 'running',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await storage.saveWorkflowState(workflowId, initialState);

        const context: AgentContext = {
          workflowId,
          broadcast: (message) => {
            console.log(`Broadcasting: ${JSON.stringify(message)}`);
          },
        };

        const result = await langChainWorkflowEngine.executeWorkflow(initialState, context);
        res.json(result);
      }
    } catch (error) {
      console.error('PRD Generator workflow error:', error);
      res.status(500).json({ 
        error: 'PRD generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  return httpServer;
}