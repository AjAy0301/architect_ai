import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { ollamaService } from "./services/ollama";
import { documentProcessor } from "./services/document-processor";
import { nlpService } from "./services/nlp";
import { insertDocumentSchema, insertPrdSchema, insertCodeFileSchema } from "@shared/schema";
import { fetchJiraIssue, isJiraConfigured } from './services/jira';
import { getMissingInfoQuestions } from './services/ollama';
import { pdfGeneratorService } from "./services/pdf-generator";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/plain', 'text/markdown', 'application/json', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.md') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // System endpoints
  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await storage.getSystemHealth();
      const ollamaHealth = await ollamaService.checkHealth();
      
      res.json({
        ...health,
        ollamaStatus: ollamaHealth ? 'running' : 'stopped',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get system health' });
    }
  });

  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get system metrics' });
    }
  });

  app.get("/api/system/models", async (req, res) => {
    try {
      const models = await ollamaService.listModels();
      res.json({ models, activeModel: ollamaService.getActiveModel() });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get models' });
    }
  });

  app.post("/api/system/model", async (req, res) => {
    try {
      const { model } = req.body;
      ollamaService.setActiveModel(model);
      res.json({ success: true, activeModel: model });
    } catch (error) {
      res.status(500).json({ error: 'Failed to switch model' });
    }
  });

  // Document endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get documents' });
    }
  });

  app.post("/api/documents/upload", upload.array('files'), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const results = [];
      for (const file of req.files) {
        const content = await documentProcessor.extractTextFromFile(file.buffer, file.mimetype);
        const result = await documentProcessor.processUploadedDocument(
          file.originalname,
          content,
          file.mimetype,
          'upload'
        );
        // LLM entity extraction
        try {
          const entities = await ollamaService.extractEntities(content);
          for (const entity of entities) {
            await storage.createEntity({ ...entity, type: entity.type || 'component', description: entity.description || '', metadata: {}, });
          }
        } catch (e) {
          console.error('Entity extraction failed:', e);
        }
        results.push(result);
      }

      res.json({ results, totalFiles: req.files.length });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload and process documents' });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteDocument(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // Entity endpoints
  app.get("/api/entities", async (req, res) => {
    try {
      const entities = await storage.getEntities();
      res.json(entities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get entities' });
    }
  });

  app.get("/api/entities/:id/dependencies", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const dependencies = await storage.getDependenciesForEntity(id);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get dependencies' });
    }
  });

  // Analysis endpoints
  app.get("/api/analysis/result", async (req, res) => {
    try {
      const result = await storage.getAnalysisResult();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get analysis result' });
    }
  });

  app.post("/api/analysis/impact/:serviceId", async (req, res) => {
    try {
      const serviceId = parseInt(req.params.serviceId);
      const entities = await storage.getEntities();
      const dependencies = await storage.getDependencies();
      
      const impact = await nlpService.analyzeImpact(serviceId, entities, dependencies);
      
      res.json({
        targetService: entities.find(e => e.id === serviceId)?.name,
        riskLevel: impact.riskLevel,
        affectedServices: impact.affectedServices.map(id => ({
          id,
          name: entities.find(e => e.id === id)?.name || `Service ${id}`,
          impact: 'direct',
          riskLevel: impact.riskLevel,
        })),
        criticalPath: ['auth-service', 'user-service', 'payment-service'],
        reasoning: impact.reasoning,
      });
    } catch (error) {
      console.error('Impact analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze impact' });
    }
  });

  // PRD endpoints
  app.get("/api/prds", async (req, res) => {
    try {
      const prds = await storage.getPrds();
      res.json(prds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get PRDs' });
    }
  });

  app.post("/api/prds/generate", async (req, res) => {
    try {
      const { description, priority, components } = req.body;
      
      if (!description) {
        return res.status(400).json({ error: 'Description is required' });
      }

      // Generate PRD content using Ollama
      const content = await ollamaService.generatePRD(description, priority || 'medium', components || []);
      
      // Create PRD record
      const prd = await storage.createPrd({
        title: `PRD: ${description.substring(0, 50)}...`,
        description,
        content,
        priority: priority || 'medium',
        components: components || [],
        status: 'draft',
      });

      // Log activity
      await storage.createActivity({
        type: 'prd_generated',
        title: `PRD generated: ${prd.title}`,
        description: `Generated PRD with ${content.length} characters`,
        metadata: { prdId: prd.id, priority, components },
      });

      res.json(prd);
    } catch (error) {
      console.error('PRD generation error:', error);
      res.status(500).json({ error: 'Failed to generate PRD' });
    }
  });

  // PDF Generation endpoints
  app.post("/api/prds/generate-pdf", async (req, res) => {
    try {
      const { title, description, priority, components, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const pdfContent = { title, description: description || '', priority: priority || 'medium', components: components || [], content, generatedAt: new Date().toISOString() };

      const pdfBuffer = await pdfGeneratorService.generatePRDPDF(pdfContent);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="prd-document.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  app.get("/api/prds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const prd = await storage.getPrd(id);
      
      if (!prd) {
        return res.status(404).json({ error: 'PRD not found' });
      }
      
      res.json(prd);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get PRD' });
    }
  });

  // Code generation endpoints
  app.get("/api/code-files", async (req, res) => {
    try {
      const codeFiles = await storage.getCodeFiles();
      res.json(codeFiles);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get code files' });
    }
  });

  app.post("/api/code/generate", async (req, res) => {
    try {
      const { prdId, language, framework } = req.body;
      
      if (!prdId || !language) {
        return res.status(400).json({ error: 'PRD ID and language are required' });
      }

      const prd = await storage.getPrd(prdId);
      if (!prd) {
        return res.status(404).json({ error: 'PRD not found' });
      }

      // Generate code using Ollama
      const code = await ollamaService.generateCode(prd.content, language, framework);
      
      // Create code file record
      const getFileExtension = (lang: string) => {
        const extensions: Record<string, string> = {
          javascript: 'js',
          typescript: 'ts',
          python: 'py',
          java: 'java',
          go: 'go',
          rust: 'rs',
          cpp: 'cpp',
          c: 'c',
        };
        return extensions[lang] || 'txt';
      };

      const codeFile = await storage.createCodeFile({
        prdId,
        filename: `generated.${getFileExtension(language)}`,
        language,
        framework,
        content: code,
      });

      // Log activity
      await storage.createActivity({
        type: 'code_generated',
        title: `Code generated for ${prd.title}`,
        description: `Generated ${language} code with ${code.length} characters`,
        metadata: { prdId, language, framework, codeFileId: codeFile.id },
      });

      res.json(codeFile);
    } catch (error) {
      console.error('Code generation error:', error);
      res.status(500).json({ error: 'Failed to generate code' });
    }
  });

  // Activities endpoint
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get activities' });
    }
  });

  // Search endpoint
  app.post("/api/search", async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const documents = await storage.getDocuments();
      const results = await nlpService.semanticSearch(query, documents);
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: 'Failed to perform search' });
    }
  });

  // Jira integration endpoint
  app.get('/api/jira/issue/:key', async (req, res) => {
    try {
      const data = await fetchJiraIssue(req.params.key);
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Generate PRD from Jira issue
  app.get('/api/jira/issue/:key/generate-prd', async (req, res) => {
    try {
      const issue = await fetchJiraIssue(req.params.key);
      const description = issue.fields?.description || issue.fields?.summary || 'No description';
      const priority = issue.fields?.priority?.name || 'Medium';
      const components = (issue.fields?.components || []).map((c: any) => c.name);
      const prd = await ollamaService.generatePRD(description, priority, components);
      res.json({ prd });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Import Jira issue as a document
  app.post('/api/jira/issue/:key/import', async (req, res) => {
    try {
      // Check if Jira is configured
      if (!isJiraConfigured()) {
        return res.status(400).json({ 
          error: 'Jira integration not configured',
          message: 'Please set JIRA_USERNAME and JIRA_API_TOKEN environment variables to use Jira integration.',
          setupRequired: true
        });
      }

      const issue = await fetchJiraIssue(req.params.key);
      const name = `${issue.key}: ${issue.fields?.summary || 'No summary'}`;
      const content = issue.fields?.description || issue.fields?.summary || 'No description';
      const type = 'txt';
      const source = 'jira';
      const metadata = { jiraKey: issue.key, status: issue.fields?.status?.name };
      const document = await storage.createDocument({ name, content, type, source, metadata });
      
      // LLM entity extraction
      try {
        const entities = await ollamaService.extractEntities(content);
        for (const entity of entities) {
          await storage.createEntity({ ...entity, type: entity.type || 'component', description: entity.description || '', metadata: {}, });
        }
      } catch (e) {
        console.error('Entity extraction failed:', e);
      }
      
      res.json(document);
    } catch (err: any) {
      console.error('Jira import failed:', err);
      
      // Provide specific error messages based on the error type
      if (err.message.includes('authentication failed')) {
        res.status(401).json({ 
          error: 'Jira authentication failed',
          message: 'Please check your Jira username and API token.',
          setupRequired: true
        });
      } else if (err.message.includes('access forbidden')) {
        res.status(403).json({ 
          error: 'Jira access forbidden',
          message: 'You may not have permission to access this issue or the API token may be invalid.',
          setupRequired: true
        });
      } else if (err.message.includes('not found')) {
        res.status(404).json({ 
          error: 'Jira issue not found',
          message: `Issue ${req.params.key} was not found in Jira.`
        });
      } else if (err.message.includes('Unable to connect')) {
        res.status(503).json({ 
          error: 'Jira connection failed',
          message: 'Unable to connect to Jira. Please check your network connection and Jira URL.'
        });
      } else {
        res.status(500).json({ 
          error: 'Jira import failed',
          message: err.message
        });
      }
    }
  });

  app.post('/api/check-missing-info', async (req, res) => {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Missing content' });
    }
    try {
      const missingQuestions = await getMissingInfoQuestions(content);
      res.json({ missingQuestions });
    } catch (err) {
      res.status(500).json({ error: 'Failed to check missing info' });
    }
  });

  // New Architecture Document Generation Endpoints
  app.post('/api/architecture/generate', async (req, res) => {
    try {
      const { content, title } = req.body;
      if (!content || !title) {
        return res.status(400).json({ error: 'Missing content or title' });
      }

      const architectureDoc = await documentProcessor.generateArchitectureDocument(content, title);
      res.json(architectureDoc);
    } catch (error) {
      console.error('Architecture generation failed:', error);
      res.status(500).json({ error: 'Failed to generate architecture document' });
    }
  });

  app.post('/api/architecture/pdf', async (req, res) => {
    try {
      const { architectureDoc } = req.body;
      if (!architectureDoc) {
        return res.status(400).json({ error: 'Missing architecture document' });
      }

      const pdfBuffer = await documentProcessor.generatePDFDocument(architectureDoc);
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="architecture-document.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation failed:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  app.post('/api/diagrams/sequence', async (req, res) => {
    try {
      const { content, componentName } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Missing content' });
      }

      const prompt = componentName 
        ? `Create a sequence diagram for the ${componentName} component based on this architecture content: ${content.substring(0, 2000)}...`
        : `Create a sequence diagram showing the main system interactions based on this architecture content: ${content.substring(0, 2000)}...`;

      let mermaidCode = await ollamaService.generate(
        `${prompt}

IMPORTANT: Generate a Mermaid sequence diagram with these specific requirements:
1. Use only -> and --> arrows (NO >> symbols at all)
2. Use only these participants: UserService, ProductService, OrderService, PaymentService, NotificationService, APIGateway, MessageQueue
3. Keep messages simple and short
4. Include 5-8 basic interactions
5. Use simple notes: Note over UserService, ProductService: description
6. Example syntax: UserService->APIGateway: message
7. Do NOT include any 'end' statements, closing tags, or final punctuation
8. The diagram should end naturally after the last interaction

Example structure:
sequenceDiagram
    participant UserService
    participant ProductService
    participant OrderService
    participant PaymentService
    participant NotificationService
    participant APIGateway
    participant MessageQueue
    
    UserService->APIGateway: POST /auth/login
    APIGateway->UserService: JWT Token
    APIGateway->ProductService: GET /products
    ProductService-->APIGateway: Product list
    APIGateway->OrderService: POST /orders
    OrderService-->APIGateway: Order created

Return ONLY the raw Mermaid code starting with "sequenceDiagram" and ending with the last interaction. Do NOT wrap in markdown code blocks or add any other text.`,
        { model: 'codellama:7b', temperature: 0.2 }
      );

      // Clean up the generated code
      mermaidCode = mermaidCode.trim();

      // Remove markdown code blocks if present
      if (mermaidCode.includes('```mermaid')) {
        mermaidCode = mermaidCode.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
      } else if (mermaidCode.includes('```')) {
        mermaidCode = mermaidCode.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Find the actual sequenceDiagram start if it's embedded in text
      const sequenceDiagramIndex = mermaidCode.indexOf('sequenceDiagram');
      if (sequenceDiagramIndex !== -1) {
        mermaidCode = mermaidCode.substring(sequenceDiagramIndex);
      }

      // Replace any remaining >> syntax with simple arrows
      mermaidCode = mermaidCode.replace(/->>/g, '->').replace(/-->>/g, '-->');

      // Remove invalid 'end' statements and other problematic syntax
      mermaidCode = mermaidCode.replace(/\n\s*end\s*$/g, ''); // Remove trailing 'end'
      mermaidCode = mermaidCode.replace(/\n\s*end\s*\n/g, '\n'); // Remove 'end' in middle
      mermaidCode = mermaidCode.replace(/^\s*end\s*$/gm, ''); // Remove standalone 'end' lines

      // Validate that it starts with sequenceDiagram
      if (!mermaidCode.startsWith('sequenceDiagram')) {
        mermaidCode = `sequenceDiagram
    participant UserService
    participant ProductService
    participant OrderService
    participant PaymentService
    participant NotificationService
    participant APIGateway

    UserService->APIGateway: POST /auth/login
    APIGateway->UserService: JWT Token
    APIGateway->ProductService: GET /products
    ProductService-->APIGateway: Product list
    APIGateway->OrderService: POST /orders
    OrderService-->APIGateway: Order created
    APIGateway->PaymentService: POST /payments
    PaymentService-->APIGateway: Payment processed
    APIGateway->NotificationService: POST /notifications
    NotificationService-->APIGateway: Notification sent`;
      }

      // Final cleanup - remove any remaining problematic syntax
      mermaidCode = mermaidCode
        .replace(/\n\s*end\s*$/g, '') // Remove trailing 'end'
        .replace(/\n\s*end\s*\n/g, '\n') // Remove 'end' in middle
        .replace(/^\s*end\s*$/gm, '') // Remove standalone 'end' lines
        .replace(/\n\s*}\s*$/g, '') // Remove trailing closing braces
        .replace(/\n\s*\)\s*$/g, '') // Remove trailing closing parentheses
        .trim();

      console.log('Generated sequence diagram:', mermaidCode);
      
      res.json({ mermaidCode: mermaidCode });
    } catch (error) {
      console.error('Sequence diagram generation failed:', error);
      res.status(500).json({ error: 'Failed to generate sequence diagram' });
    }
  });

  app.post('/api/diagrams/component', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Missing content' });
      }

      let mermaidCode = await ollamaService.generate(
        `Create a component diagram based on this architecture content: ${content.substring(0, 2000)}...

IMPORTANT: Generate a Mermaid component diagram with these specific requirements:
1. Use graph TD (top-down direction)
2. Include main components: UserService, ProductService, OrderService, PaymentService, NotificationService, APIGateway, Database
3. Show relationships between components with simple arrows
4. Use rectangles for components: UserService[User Service]
5. Use simple connections: UserService --> ProductService
6. Database should be connected TO other services, not FROM other services
7. Avoid any self-references or cycles
8. Each component should have at least one connection
9. Include a title at the top

Example structure:
graph TD
    title[Component Architecture]
    APIGateway[API Gateway]
    UserService[User Service]
    ProductService[Product Service]
    OrderService[Order Service]
    PaymentService[Payment Service]
    NotificationService[Notification Service]
    Database[(Database)]
    
    APIGateway --> UserService
    APIGateway --> ProductService
    APIGateway --> OrderService
    UserService --> Database
    ProductService --> Database
    OrderService --> PaymentService
    PaymentService --> NotificationService

Return ONLY the raw Mermaid code starting with "graph TD" and ending with the last line. Do NOT wrap in markdown code blocks or add any other text.`,
        { model: 'codellama:7b', temperature: 0.2 }
      );

      // Clean up the generated code
      mermaidCode = mermaidCode.trim();

      // Remove markdown code blocks if present
      if (mermaidCode.includes('```mermaid')) {
        mermaidCode = mermaidCode.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
      } else if (mermaidCode.includes('```')) {
        mermaidCode = mermaidCode.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Find the actual graph start if it's embedded in text
      const graphIndex = mermaidCode.indexOf('graph TD');
      if (graphIndex !== -1) {
        mermaidCode = mermaidCode.substring(graphIndex);
      }

      // Validate that it starts with graph TD
      if (!mermaidCode.startsWith('graph TD')) {
        mermaidCode = `graph TD
    title[Component Architecture]
    
    UserService[User Service]
    ProductService[Product Service]
    OrderService[Order Service]
    PaymentService[Payment Service]
    NotificationService[Notification Service]
    APIGateway[API Gateway]
    Database[(Database)]
    
    APIGateway --> UserService
    APIGateway --> ProductService
    APIGateway --> OrderService
    APIGateway --> PaymentService
    APIGateway --> NotificationService
    UserService --> Database
    ProductService --> Database
    OrderService --> Database
    PaymentService --> Database`;
      }

      // Validate and fix potential cycles
      const lines = mermaidCode.split('\n');
      const connections: string[] = [];
      const components = new Set<string>();
      
      // Extract components and connections
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('[') && !trimmedLine.includes('-->')) {
          // Component definition
          const componentMatch = trimmedLine.match(/(\w+)\[/);
          if (componentMatch) {
            components.add(componentMatch[1]);
          }
        } else if (trimmedLine.includes('-->')) {
          // Connection
          const connectionMatch = trimmedLine.match(/(\w+)\s*-->\s*(\w+)/);
          if (connectionMatch) {
            const from = connectionMatch[1];
            const to = connectionMatch[2];
            // Check for self-reference
            if (from === to) {
              console.log(`Removing self-reference: ${from} --> ${to}`);
              continue;
            }
            connections.push(`${from} --> ${to}`);
          }
        }
      }

      // Rebuild the diagram without cycles
      if (connections.length > 0) {
        const validConnections = connections.filter(conn => {
          const [from, to] = conn.split(' --> ');
          return from !== to; // Remove any remaining self-references
        });

        mermaidCode = `graph TD
    title[Component Architecture]
    
    UserService[User Service]
    ProductService[Product Service]
    OrderService[Order Service]
    PaymentService[Payment Service]
    NotificationService[Notification Service]
    APIGateway[API Gateway]
    Database[(Database)]
    
${validConnections.map(conn => `    ${conn}`).join('\n')}`;
      }

      // Final validation - ensure no cycles or invalid syntax
      const finalValidation = (code: string) => {
        const lines = code.split('\n');
        const connections = new Set<string>();
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.includes('-->')) {
            const connectionMatch = trimmedLine.match(/(\w+)\s*-->\s*(\w+)/);
            if (connectionMatch) {
              const from = connectionMatch[1];
              const to = connectionMatch[2];
              if (from !== to) {
                connections.add(`${from} --> ${to}`);
              }
            }
          }
        }
        
        return `graph TD
    title[Component Architecture]
    
    UserService[User Service]
    ProductService[Product Service]
    OrderService[Order Service]
    PaymentService[Payment Service]
    NotificationService[Notification Service]
    APIGateway[API Gateway]
    Database[(Database)]
    
${Array.from(connections).map(conn => `    ${conn}`).join('\n')}`;
      };

      const validatedCode = finalValidation(mermaidCode);
      console.log('Generated component diagram:', validatedCode);
      
      // Ensure we have a valid diagram with at least some connections
      if (!validatedCode.includes('-->')) {
        const fallbackDiagram = `graph TD
    title[Component Architecture]
    
    UserService[User Service]
    ProductService[Product Service]
    OrderService[Order Service]
    PaymentService[Payment Service]
    NotificationService[Notification Service]
    APIGateway[API Gateway]
    Database[(Database)]
    
    APIGateway --> UserService
    APIGateway --> ProductService
    APIGateway --> OrderService
    APIGateway --> PaymentService
    APIGateway --> NotificationService
    UserService --> Database
    ProductService --> Database
    OrderService --> Database
    PaymentService --> Database`;
        
        res.json({ mermaidCode: fallbackDiagram });
      } else {
        res.json({ mermaidCode: validatedCode.trim() });
      }
    } catch (error) {
      console.error('Component diagram generation failed:', error);
      res.status(500).json({ error: 'Failed to generate component diagram' });
    }
  });

  app.post('/api/diagrams/deployment', async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Missing content' });
      }

      let mermaidCode = await ollamaService.generate(
        `Create a deployment diagram based on this architecture content: ${content.substring(0, 2000)}...

IMPORTANT: Generate a Mermaid deployment diagram with these specific requirements:
1. Use graph TD (top-down direction)
2. Include deployment nodes: Client, LoadBalancer, WebServer, DatabaseServer, MessageQueue
3. Show deployment relationships with simple arrows
4. Use rectangles for nodes: Client[Client Browser]
5. Use simple connections: Client --> LoadBalancer
6. Include a title at the top ONLY using square brackets: title[Deployment Architecture]
7. Do NOT use quotes for title: title "Deployment Diagram" is WRONG
8. Do NOT include any title statements in the middle or end of the diagram
9. Do NOT include any 'end' statements or closing tags
10. Do NOT use subgraph statements

Example structure:
graph TD
    title[Deployment Architecture]
    
    Client[Client Browser]
    LoadBalancer[Load Balancer]
    WebServer[Web Server]
    DatabaseServer[Database Server]
    MessageQueue[Message Queue]
    
    Client --> LoadBalancer
    LoadBalancer --> WebServer
    WebServer --> DatabaseServer
    WebServer --> MessageQueue

Return ONLY the raw Mermaid code starting with "graph TD" and ending with the last connection. Do NOT wrap in markdown code blocks or add any other text.`,
        { model: 'codellama:7b', temperature: 0.2 }
      );

      // Clean up the generated code
      mermaidCode = mermaidCode.trim();

      // Remove markdown code blocks if present
      if (mermaidCode.includes('```mermaid')) {
        mermaidCode = mermaidCode.replace(/```mermaid\n?/, '').replace(/\n?```$/, '');
      } else if (mermaidCode.includes('```')) {
        mermaidCode = mermaidCode.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Find the actual graph start if it's embedded in text
      const graphIndex = mermaidCode.indexOf('graph TD');
      if (graphIndex !== -1) {
        mermaidCode = mermaidCode.substring(graphIndex);
      }

      // Remove invalid title statements and other problematic syntax
      mermaidCode = mermaidCode.replace(/\n\s*title\s+[^\n]*\n/g, '\n'); // Remove title statements in middle
      mermaidCode = mermaidCode.replace(/^\s*title\s+[^\n]*$/gm, ''); // Remove standalone title lines
      mermaidCode = mermaidCode.replace(/\n\s*title\s+[^\n]*$/g, ''); // Remove trailing title statements
      mermaidCode = mermaidCode.replace(/\n\s*title\s+["'][^"']*["']\s*$/g, ''); // Remove trailing quoted titles
      mermaidCode = mermaidCode.replace(/\n\s*title\s+[A-Za-z\s]+\s*$/g, ''); // Remove trailing plain text titles
      mermaidCode = mermaidCode.replace(/\n\s*subgraph\s+["'][^"']*["']\s*$/g, ''); // Remove trailing subgraph statements
      mermaidCode = mermaidCode.replace(/\n\s*subgraph\s+[^\n]*\n[\s\S]*?end\s*$/g, ''); // Remove entire subgraph blocks
      mermaidCode = mermaidCode.replace(/\n\s*end\s*$/g, ''); // Remove trailing 'end'
      mermaidCode = mermaidCode.replace(/\n\s*end\s*\n/g, '\n'); // Remove 'end' in middle
      mermaidCode = mermaidCode.replace(/^\s*end\s*$/gm, ''); // Remove standalone 'end' lines

      // Validate that it starts with graph TD
      if (!mermaidCode.startsWith('graph TD')) {
        mermaidCode = `graph TD
    title[Deployment Architecture]
    
    Client[Client Browser]
    LoadBalancer[Load Balancer]
    WebServer[Web Server]
    DatabaseServer[Database Server]
    MessageQueue[Message Queue]
    
    Client --> LoadBalancer
    LoadBalancer --> WebServer
    WebServer --> DatabaseServer
    WebServer --> MessageQueue
    MessageQueue --> WebServer`;
      }

      // Final cleanup - remove any remaining problematic syntax
      mermaidCode = mermaidCode
        .replace(/\n\s*title\s+[^\n]*\n/g, '\n') // Remove title statements in middle
        .replace(/^\s*title\s+[^\n]*$/gm, '') // Remove standalone title lines
        .replace(/\n\s*title\s+[^\n]*$/g, '') // Remove trailing title statements
        .replace(/\n\s*title\s+["'][^"']*["']\s*$/g, '') // Remove trailing quoted titles
        .replace(/\n\s*title\s+[A-Za-z\s]+\s*$/g, '') // Remove trailing plain text titles
        .replace(/\n\s*subgraph\s+["'][^"']*["']\s*$/g, '') // Remove trailing subgraph statements
        .replace(/\n\s*subgraph\s+[^\n]*\n[\s\S]*?end\s*$/g, '') // Remove entire subgraph blocks
        .replace(/\n\s*end\s*$/g, '') // Remove trailing 'end'
        .replace(/\n\s*end\s*\n/g, '\n') // Remove 'end' in middle
        .replace(/^\s*end\s*$/gm, '') // Remove standalone 'end' lines
        .replace(/\n\s*}\s*$/g, '') // Remove trailing closing braces
        .replace(/\n\s*\)\s*$/g, '') // Remove trailing closing parentheses
        .trim();

      // Rebuild diagram with bulletproof title logic
      const rebuildDiagram = (code: string) => {
        const lines = code.split('\n');
        const nodes: string[] = [];
        const connections: string[] = [];
        let foundGraph = false;
        let titleInserted = false;
        let afterGraphLine = false;
        let cleanDiagram = '';

        for (let i = 0; i < lines.length; i++) {
          const trimmedLine = lines[i].trim();
          if (!foundGraph) {
            if (trimmedLine.toLowerCase().startsWith('graph td')) {
              cleanDiagram += 'graph TD\n';
              foundGraph = true;
              afterGraphLine = true;
            }
            continue;
          }
          // Only allow a title line as the first non-empty line after 'graph TD'
          if (afterGraphLine) {
            cleanDiagram += '    title[Deployment Architecture]\n\n';
            titleInserted = true;
            afterGraphLine = false;
            continue;
          }
          // Remove any other title lines (case-insensitive)
          if (/^title\b/i.test(trimmedLine)) {
            continue;
          }
          // Skip subgraph statements
          if (trimmedLine.toLowerCase().startsWith('subgraph')) {
            continue;
          }
          // Skip empty lines
          if (!trimmedLine) continue;
          if (trimmedLine.includes('[') && !trimmedLine.includes('-->')) {
            nodes.push(trimmedLine);
          } else if (trimmedLine.includes('-->')) {
            connections.push(trimmedLine);
          }
        }
        // If no title was inserted, add it after 'graph TD'
        if (!titleInserted) {
          cleanDiagram += '    title[Deployment Architecture]\n\n';
        }
        // Add nodes
        nodes.forEach(node => {
          cleanDiagram += `    ${node}\n`;
        });
        cleanDiagram += '\n';
        // Add connections
        connections.forEach(conn => {
          cleanDiagram += `    ${conn}\n`;
        });
        return cleanDiagram.trim();
      };

      const finalDiagram = rebuildDiagram(mermaidCode);
      console.log('Generated deployment diagram:', finalDiagram);
      
      res.json({ mermaidCode: finalDiagram });
    } catch (error) {
      console.error('Deployment diagram generation failed:', error);
      res.status(500).json({ error: 'Failed to generate deployment diagram' });
    }
  });

  app.post('/api/impact/analyze', async (req, res) => {
    try {
      const { componentName, componentType, apis } = req.body;
      if (!componentName) {
        return res.status(400).json({ error: 'Missing component name' });
      }

      const impactPrompt = `Analyze the impact of changes to the ${componentName} component:

Component: ${componentName}
Type: ${componentType || 'service'}
APIs: ${apis ? apis.join(', ') : 'N/A'}

Assess the risk level (low/medium/high) and identify affected services if this component changes.
Return JSON with:
- riskLevel: "low", "medium", or "high"
- affectedServices: array of service names
- description: brief explanation
- recommendations: array of mitigation strategies

Return only valid JSON, no additional text.`;

      const response = await ollamaService.generate(impactPrompt, { model: 'codellama:7b', temperature: 0.1 });
      const analysis = JSON.parse(response);

      res.json(analysis);
    } catch (error) {
      console.error('Impact analysis failed:', error);
      res.status(500).json({ error: 'Failed to analyze impact' });
    }
  });

  // Debug endpoint for testing Ollama service
  app.post('/api/debug/ollama', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
      }

      console.log('Testing Ollama with prompt:', prompt);
      const response = await ollamaService.generate(prompt, { model: 'codellama:7b', temperature: 0.1 });
      console.log('Ollama response:', response);

      res.json({ response });
    } catch (error: any) {
      console.error('Ollama debug failed:', error);
      res.status(500).json({ error: `Ollama failed: ${error.message}` });
    }
  });

  // Debug endpoint for checking environment variables
  app.get('/api/debug/env', (req, res) => {
    res.json({
      jiraUsername: process.env.JIRA_USERNAME ? 'set' : 'not_set',
      jiraToken: process.env.JIRA_API_TOKEN ? 'set' : 'not_set',
      jiraBaseUrl: process.env.JIRA_BASE_URL || 'https://jira.telekom.de',
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT || '3000'
    });
  });

  // Debug endpoint for testing Jira connection
  app.get('/api/debug/jira/:issueKey', async (req, res) => {
    try {
      const { issueKey } = req.params;
      console.log(`Testing Jira connection for issue: ${issueKey}`);
      
      const issue = await fetchJiraIssue(issueKey);
      res.json({ 
        success: true, 
        issue: {
          key: issue.key,
          summary: issue.fields?.summary,
          status: issue.fields?.status?.name,
          description: issue.fields?.description?.substring(0, 100) + '...'
        }
      });
    } catch (error: any) {
      console.error('Jira debug failed:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        details: error.toString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to get file extension based on language
function getFileExtension(language: string): string {
  const extensions: { [key: string]: string } = {
    'javascript': 'js',
    'typescript': 'ts',
    'python': 'py',
    'java': 'java',
    'go': 'go',
    'rust': 'rs',
    'cpp': 'cpp',
    'c': 'c',
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}
