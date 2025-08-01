
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { 
  Loader2, 
  Code, 
  FileText, 
  GitBranch, 
  Database, 
  Server, 
  Globe, 
  Zap,
  Download,
  Copy,
  Play,
  Settings,
  Layers,
  Box,
  CheckCircle,
  ArrowRight,
  Terminal,
  Folder,
  FileCode,
  Package
} from "lucide-react";

interface ArchitectureComponent {
  id: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'api';
  technology: string;
  description: string;
  dependencies: string[];
}

interface GeneratedArchitecture {
  projectName: string;
  description: string;
  components: ArchitectureComponent[];
  diagram: string;
  codeScaffolding: {
    [key: string]: {
      files: Array<{
        path: string;
        content: string;
        language: string;
      }>;
    };
  };
  workflow: {
    setupSteps: string[];
    runCommands: string[];
    deploySteps: string[];
  };
  dependencies: {
    [key: string]: string[];
  };
}

interface GeneratedCode {
  language: string;
  framework?: string;
  files: Array<{
    path: string;
    content: string;
    description: string;
  }>;
  setupInstructions: string[];
  runCommands: string[];
}

const architectureTemplates = [
  { value: 'microservices', label: 'Microservices Architecture', icon: Server },
  { value: 'fullstack', label: 'Full-Stack Web App', icon: Globe },
  { value: 'api-first', label: 'API-First Design', icon: Database },
  { value: 'serverless', label: 'Serverless Functions', icon: Zap },
  { value: 'monolith', label: 'Monolithic Application', icon: Box },
  { value: 'jamstack', label: 'JAMStack', icon: Layers }
];

const techStacks = {
  frontend: ['React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Nuxt.js'],
  backend: ['Node.js', 'Python Flask', 'Python FastAPI', 'Java Spring', 'Go Gin', 'Ruby Rails'],
  database: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'SQLite', 'DynamoDB'],
  deployment: ['Docker', 'Kubernetes', 'Vercel', 'AWS', 'Google Cloud', 'Azure']
};

const programmingLanguages = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'csharp', label: 'C#', icon: '🟣' },
  { value: 'cpp', label: 'C++', icon: '⚡' }
];

const frameworksByLanguage: Record<string, string[]> = {
  javascript: ['React', 'Vue.js', 'Angular', 'Express.js', 'Next.js'],
  typescript: ['React', 'Vue.js', 'Angular', 'Express.js', 'Next.js', 'NestJS'],
  python: ['Flask', 'FastAPI', 'Django', 'Streamlit', 'Tornado'],
  java: ['Spring Boot', 'Spring MVC', 'Quarkus', 'Micronaut'],
  go: ['Gin', 'Echo', 'Fiber', 'Gorilla Mux'],
  rust: ['Actix Web', 'Warp', 'Rocket', 'Axum'],
  csharp: ['.NET Core', 'ASP.NET', 'Blazor'],
  cpp: ['Qt', 'FLTK', 'wxWidgets']
};

export default function CodeGeneratorArchitecture() {
  const [mode, setMode] = useState<'architecture' | 'code-generation'>('architecture');
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [prdSolutionSummary, setPrdSolutionSummary] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedFramework, setSelectedFramework] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [techStack, setTechStack] = useState({
    frontend: '',
    backend: '',
    database: '',
    deployment: ''
  });
  const [generatedArchitecture, setGeneratedArchitecture] = useState<GeneratedArchitecture | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const generateCodeMutation = useMutation({
    mutationFn: async (data: { prdSolutionSummary: string; language: string; framework?: string }) => {
      const response = await fetch('/api/code/generate-from-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data);
      toast({
        title: "Code Generated Successfully",
        description: `Generated ${data.language} code from PRD solution summary`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate code from PRD",
        variant: "destructive",
      });
    },
  });

  const generateArchitectureMutation = useMutation({
    mutationFn: async (data: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
      return data;
    },
    onSuccess: (data) => {
      const demoArchitecture: GeneratedArchitecture = {
        projectName: data.projectName,
        description: data.description,
        components: [
          {
            id: 'frontend',
            name: 'Frontend Application',
            type: 'frontend',
            technology: data.techStack.frontend || 'React',
            description: 'User interface and client-side application',
            dependencies: ['API Gateway', 'Authentication Service']
          },
          {
            id: 'api-gateway',
            name: 'API Gateway',
            type: 'api',
            technology: 'Express.js',
            description: 'Central API routing and middleware',
            dependencies: ['Backend Services', 'Database']
          },
          {
            id: 'backend',
            name: 'Backend Services',
            type: 'backend',
            technology: data.techStack.backend || 'Node.js',
            description: 'Business logic and data processing',
            dependencies: ['Database', 'External APIs']
          },
          {
            id: 'database',
            name: 'Database',
            type: 'database',
            technology: data.techStack.database || 'PostgreSQL',
            description: 'Data storage and management',
            dependencies: []
          },
          {
            id: 'auth-service',
            name: 'Authentication Service',
            type: 'service',
            technology: 'JWT + OAuth',
            description: 'User authentication and authorization',
            dependencies: ['Database']
          }
        ],
        diagram: `graph TB
    A[Frontend App] --> B[API Gateway]
    B --> C[Auth Service]
    B --> D[Backend Services]
    D --> E[Database]
    C --> E
    B --> F[External APIs]`,
        codeScaffolding: {
          frontend: {
            files: [
              {
                path: 'src/App.tsx',
                content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`,
                language: 'typescript'
              },
              {
                path: 'src/components/Header.tsx',
                content: `import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white p-4">
      <h1 className="text-2xl font-bold">${data.projectName}</h1>
    </header>
  );
};

export default Header;`,
                language: 'typescript'
              }
            ]
          },
          backend: {
            files: [
              {
                path: 'server.js',
                content: `const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`,
                language: 'javascript'
              },
              {
                path: 'routes/api.js',
                content: `const express = require('express');
const router = express.Router();

router.get('/users', async (req, res) => {
  // Get users logic
  res.json({ users: [] });
});

router.post('/users', async (req, res) => {
  // Create user logic
  res.json({ message: 'User created' });
});

module.exports = router;`,
                language: 'javascript'
              }
            ]
          }
        },
        workflow: {
          setupSteps: [
            'Install Node.js and npm',
            'Clone the repository',
            'Install dependencies: npm install',
            'Set up environment variables',
            'Initialize database'
          ],
          runCommands: [
            'npm run dev (Frontend)',
            'npm run start:server (Backend)',
            'npm run db:migrate (Database)'
          ],
          deploySteps: [
            'Build production assets',
            'Run tests',
            'Deploy to staging',
            'Run integration tests',
            'Deploy to production'
          ]
        },
        dependencies: {
          frontend: ['react', 'react-dom', 'react-router-dom', 'axios', 'tailwindcss'],
          backend: ['express', 'cors', 'dotenv', 'jsonwebtoken', 'bcryptjs'],
          database: ['pg', 'sequelize', 'redis']
        }
      };

      setGeneratedArchitecture(demoArchitecture);
      toast({
        title: "Architecture Generated",
        description: "Code architecture and scaffolding ready for use",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate architecture",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCode = () => {
    if (!prdSolutionSummary.trim()) {
      toast({
        title: "Error",
        description: "Please enter the High Level Solution Summary from PRD",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLanguage) {
      toast({
        title: "Error",
        description: "Please select a programming language",
        variant: "destructive",
      });
      return;
    }

    // Demo code generation
    const demoCode: GeneratedCode = {
      language: selectedLanguage,
      framework: selectedFramework,
      files: [
        {
          path: selectedLanguage === 'python' ? 'main.py' : 'main.js',
          content: generateDemoCode(prdSolutionSummary, selectedLanguage, selectedFramework),
          description: 'Main application entry point'
        },
        {
          path: selectedLanguage === 'python' ? 'models.py' : 'models.js',
          content: generateDemoModels(selectedLanguage),
          description: 'Data models and schemas'
        },
        {
          path: selectedLanguage === 'python' ? 'api.py' : 'api.js',
          content: generateDemoAPI(selectedLanguage, selectedFramework),
          description: 'API endpoints and routes'
        }
      ],
      setupInstructions: [
        selectedLanguage === 'python' ? 'Install Python 3.8+' : 'Install Node.js 16+',
        selectedLanguage === 'python' ? 'pip install -r requirements.txt' : 'npm install',
        'Set up environment variables',
        'Initialize database (if required)'
      ],
      runCommands: [
        selectedLanguage === 'python' ? 'python main.py' : 'npm start',
        'Access the application at http://localhost:5000'
      ]
    };

    setTimeout(() => {
      setGeneratedCode(demoCode);
      toast({
        title: "Code Generated Successfully",
        description: `Generated ${selectedLanguage} code from PRD solution summary`,
      });
    }, 2000);

    generateCodeMutation.mutate({
      prdSolutionSummary,
      language: selectedLanguage,
      framework: selectedFramework
    });
  };

  const handleGenerate = () => {
    if (mode === 'code-generation') {
      handleGenerateCode();
      return;
    }

    if (!projectName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project name",
        variant: "destructive",
      });
      return;
    }

    generateArchitectureMutation.mutate({
      projectName,
      description,
      template: selectedTemplate,
      techStack
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const downloadScaffolding = () => {
    toast({
      title: "Download Started",
      description: "Code scaffolding is being prepared for download",
    });
  };

  const createWorkflow = () => {
    toast({
      title: "Workflow Created",
      description: "Development workflow has been set up",
    });
  };

  const generateDemoCode = (summary: string, language: string, framework?: string): string => {
    const languageTemplates: Record<string, string> = {
      python: `"""
${summary}

This module implements the core functionality based on the PRD solution summary.
"""

import os
import logging
from typing import Dict, List, Optional
${framework === 'FastAPI' ? 'from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel' : ''}
${framework === 'Flask' ? 'from flask import Flask, request, jsonify' : ''}

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Application:
    """Main application class implementing the solution requirements."""
    
    def __init__(self):
        self.config = self._load_config()
        logger.info("Application initialized")
    
    def _load_config(self) -> Dict:
        """Load application configuration."""
        return {
            'port': int(os.getenv('PORT', 5000)),
            'debug': os.getenv('DEBUG', 'False').lower() == 'true'
        }
    
    def process_request(self, data: Dict) -> Dict:
        """Process incoming request based on PRD requirements."""
        try:
            # Implement core business logic here
            result = {
                'status': 'success',
                'message': 'Request processed successfully',
                'data': data
            }
            logger.info(f"Request processed: {result}")
            return result
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            raise

${framework === 'FastAPI' ? '''
app = FastAPI(title="PRD Solution", description="Implementation based on PRD")

@app.get("/")
async def root():
    return {"message": "PRD Solution API"}

@app.post("/process")
async def process_data(data: dict):
    app_instance = Application()
    return app_instance.process_request(data)
''' : ''}

${framework === 'Flask' ? '''
app = Flask(__name__)
app_instance = Application()

@app.route('/', methods=['GET'])
def root():
    return jsonify({"message": "PRD Solution API"})

@app.route('/process', methods=['POST'])
def process_data():
    data = request.get_json()
    return jsonify(app_instance.process_request(data))
''' : ''}

if __name__ == "__main__":
    app_instance = Application()
    print("Application starting...")
    ${framework === 'FastAPI' ? 'import uvicorn\n    uvicorn.run(app, host="0.0.0.0", port=app_instance.config["port"])' : ''}
    ${framework === 'Flask' ? 'app.run(host="0.0.0.0", port=app_instance.config["port"], debug=app_instance.config["debug"])' : ''}
`,
      javascript: `/**
 * ${summary}
 * 
 * This module implements the core functionality based on the PRD solution summary.
 */

${framework === 'Express.js' ? "const express = require('express');" : ''}
${framework === 'React' ? "import React, { useState, useEffect } from 'react';" : ''}

class Application {
  constructor() {
    this.config = this._loadConfig();
    console.log('Application initialized');
  }

  _loadConfig() {
    return {
      port: process.env.PORT || 5000,
      debug: process.env.DEBUG === 'true'
    };
  }

  async processRequest(data) {
    try {
      // Implement core business logic here
      const result = {
        status: 'success',
        message: 'Request processed successfully',
        data: data
      };
      console.log('Request processed:', result);
      return result;
    } catch (error) {
      console.error('Error processing request:', error);
      throw error;
    }
  }
}

${framework === 'Express.js' ? `
const app = express();
const appInstance = new Application();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'PRD Solution API' });
});

app.post('/process', async (req, res) => {
  try {
    const result = await appInstance.processRequest(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(appInstance.config.port, '0.0.0.0', () => {
  console.log(\`Server running on port \${appInstance.config.port}\`);
});
` : ''}

${framework === 'React' ? `
function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const processData = async (inputData) => {
    setLoading(true);
    try {
      const app = new Application();
      const result = await app.processRequest(inputData);
      setData(result);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>PRD Solution</h1>
      <p>${summary}</p>
      {loading && <p>Processing...</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default App;
` : ''}

module.exports = Application;
`,
      typescript: `/**
 * ${summary}
 * 
 * This module implements the core functionality based on the PRD solution summary.
 */

interface Config {
  port: number;
  debug: boolean;
}

interface ProcessResult {
  status: string;
  message: string;
  data: any;
}

class Application {
  private config: Config;

  constructor() {
    this.config = this._loadConfig();
    console.log('Application initialized');
  }

  private _loadConfig(): Config {
    return {
      port: parseInt(process.env.PORT || '5000'),
      debug: process.env.DEBUG === 'true'
    };
  }

  async processRequest(data: any): Promise<ProcessResult> {
    try {
      // Implement core business logic here
      const result: ProcessResult = {
        status: 'success',
        message: 'Request processed successfully',
        data: data
      };
      console.log('Request processed:', result);
      return result;
    } catch (error) {
      console.error('Error processing request:', error);
      throw error;
    }
  }
}

export default Application;
`
    };

    return languageTemplates[language] || '// Generated code will appear here';
  };

  const generateDemoModels = (language: string): string => {
    const modelTemplates: Record<string, string> = {
      python: `"""
Data models and schemas for the PRD solution.
"""

from typing import Optional, List, Dict
from datetime import datetime
from pydantic import BaseModel, Field

class BaseEntity(BaseModel):
    """Base entity with common fields."""
    id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class User(BaseEntity):
    """User model."""
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    is_active: bool = True

class ProcessRequest(BaseModel):
    """Request processing model."""
    action: str = Field(..., min_length=1)
    parameters: Dict = Field(default_factory=dict)
    user_id: Optional[str] = None

class ProcessResponse(BaseModel):
    """Response model for processed requests."""
    success: bool
    message: str
    data: Optional[Dict] = None
    timestamp: datetime = Field(default_factory=datetime.now)
`,
      javascript: `/**
 * Data models and schemas for the PRD solution.
 */

class BaseEntity {
  constructor() {
    this.id = null;
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

class User extends BaseEntity {
  constructor(username, email) {
    super();
    this.username = username;
    this.email = email;
    this.is_active = true;
  }

  validate() {
    if (!this.username || this.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}

class ProcessRequest {
  constructor(action, parameters = {}, user_id = null) {
    this.action = action;
    this.parameters = parameters;
    this.user_id = user_id;
  }
}

class ProcessResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date();
  }
}

module.exports = {
  BaseEntity,
  User,
  ProcessRequest,
  ProcessResponse
};
`,
      typescript: `/**
 * Data models and schemas for the PRD solution.
 */

interface IBaseEntity {
  id?: string;
  created_at: Date;
  updated_at: Date;
}

interface IUser extends IBaseEntity {
  username: string;
  email: string;
  is_active: boolean;
}

interface IProcessRequest {
  action: string;
  parameters: Record<string, any>;
  user_id?: string;
}

interface IProcessResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

export class BaseEntity implements IBaseEntity {
  id?: string;
  created_at: Date;
  updated_at: Date;

  constructor() {
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}

export class User extends BaseEntity implements IUser {
  username: string;
  email: string;
  is_active: boolean;

  constructor(username: string, email: string) {
    super();
    this.username = username;
    this.email = email;
    this.is_active = true;
  }

  validate(): void {
    if (!this.username || this.username.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}

export class ProcessRequest implements IProcessRequest {
  action: string;
  parameters: Record<string, any>;
  user_id?: string;

  constructor(action: string, parameters: Record<string, any> = {}, user_id?: string) {
    this.action = action;
    this.parameters = parameters;
    this.user_id = user_id;
  }
}

export class ProcessResponse implements IProcessResponse {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;

  constructor(success: boolean, message: string, data?: Record<string, any>) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date();
  }
}
`
    };

    return modelTemplates[language] || '// Model definitions will appear here';
  };

  const generateDemoAPI = (language: string, framework?: string): string => {
    const apiTemplates: Record<string, string> = {
      python: framework === 'FastAPI' ? `"""
API endpoints and routes using FastAPI.
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import logging

from .models import User, ProcessRequest, ProcessResponse

logger = logging.getLogger(__name__)

app = FastAPI(
    title="PRD Solution API",
    description="RESTful API implementing PRD requirements",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}

@app.get("/users", response_model=List[User])
async def get_users():
    """Get all users."""
    # Implement user retrieval logic
    return []

@app.post("/users", response_model=User)
async def create_user(user: User):
    """Create a new user."""
    try:
        user.validate()
        # Implement user creation logic
        logger.info(f"Created user: {user.username}")
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/process", response_model=ProcessResponse)
async def process_request(request: ProcessRequest):
    """Process a request according to PRD specifications."""
    try:
        # Implement request processing logic
        response = ProcessResponse(
            success=True,
            message="Request processed successfully",
            data={"action": request.action, "parameters": request.parameters}
        )
        logger.info(f"Processed request: {request.action}")
        return response
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        raise HTTPException(status_code=500, detail=str(e))
` : `"""
API endpoints and routes using Flask.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging

from .models import User, ProcessRequest, ProcessResponse

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"})

@app.route('/users', methods=['GET'])
def get_users():
    """Get all users."""
    # Implement user retrieval logic
    return jsonify([])

@app.route('/users', methods=['POST'])
def create_user():
    """Create a new user."""
    try:
        data = request.get_json()
        user = User(**data)
        user.validate()
        # Implement user creation logic
        logger.info(f"Created user: {user.username}")
        return jsonify(user.__dict__)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/process', methods=['POST'])
def process_request():
    """Process a request according to PRD specifications."""
    try:
        data = request.get_json()
        req = ProcessRequest(**data)
        # Implement request processing logic
        response = ProcessResponse(
            success=True,
            message="Request processed successfully",
            data={"action": req.action, "parameters": req.parameters}
        )
        logger.info(f"Processed request: {req.action}")
        return jsonify(response.__dict__)
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({"error": str(e)}), 500
`,
      javascript: `/**
 * API endpoints and routes using Express.js
 */

const express = require('express');
const cors = require('cors');
const { User, ProcessRequest, ProcessResponse } = require('./models');

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// User endpoints
router.get('/users', async (req, res) => {
  try {
    // Implement user retrieval logic
    const users = [];
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body.username, req.body.email);
    user.validate();
    // Implement user creation logic
    console.log(\`Created user: \${user.username}\`);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process endpoint
router.post('/process', async (req, res) => {
  try {
    const request = new ProcessRequest(
      req.body.action,
      req.body.parameters,
      req.body.user_id
    );
    
    // Implement request processing logic
    const response = new ProcessResponse(
      true,
      'Request processed successfully',
      { action: request.action, parameters: request.parameters }
    );
    
    console.log(\`Processed request: \${request.action}\`);
    res.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
`,
      typescript: `/**
 * API endpoints and routes using Express.js with TypeScript
 */

import express, { Request, Response, Router } from 'express';
import cors from 'cors';
import { User, ProcessRequest, ProcessResponse } from './models';

const router: Router = express.Router();

// Middleware
router.use(cors());
router.use(express.json());

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// User endpoints
router.get('/users', async (req: Request, res: Response) => {
  try {
    // Implement user retrieval logic
    const users: User[] = [];
    res.json(users);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const user = new User(req.body.username, req.body.email);
    user.validate();
    // Implement user creation logic
    console.log(\`Created user: \${user.username}\`);
    res.status(201).json(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

// Process endpoint
router.post('/process', async (req: Request, res: Response) => {
  try {
    const request = new ProcessRequest(
      req.body.action,
      req.body.parameters,
      req.body.user_id
    );
    
    // Implement request processing logic
    const response = new ProcessResponse(
      true,
      'Request processed successfully',
      { action: request.action, parameters: request.parameters }
    );
    
    console.log(\`Processed request: \${request.action}\`);
    res.json(response);
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
`
    };

    return apiTemplates[language] || '// API endpoints will appear here';
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-black border-b border-[hsl(322,100%,45%)] px-8 py-8">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center text-white">
                <img src="/deutsche-telekom-logo.svg" alt="Deutsche Telekom" className="w-8 h-8 mr-3" />
                {mode === 'architecture' ? 'Code Architecture Generator' : 'PRD Code Generator'}
              </h1>
              <p className="text-[hsl(322,100%,45%)] text-lg">
                {mode === 'architecture' 
                  ? 'Generate complete application architectures with code scaffolding'
                  : 'Generate code from PRD High Level Solution Summary'
                }
              </p>
            </div>
            <div className="text-right">
              <div className="text-[hsl(322,100%,45%)] text-sm">Powered by</div>
              <div className="text-white font-semibold">AI Code Engine</div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Configuration Panel */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-black border-[hsl(322,100%,45%)] shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl text-white">
                    <Settings className="w-6 h-6 mr-3 text-[hsl(322,100%,45%)]" />
                    {mode === 'architecture' ? 'Project Configuration' : 'Code Generation'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Mode Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-300">Generation Mode</label>
                    <div className="flex space-x-2 bg-gray-900 p-1 rounded-lg">
                      <Button
                        variant={mode === 'architecture' ? 'default' : 'ghost'}
                        onClick={() => setMode('architecture')}
                        className={`flex-1 ${mode === 'architecture' ? 'bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black' : 'hover:bg-gray-700 text-white'}`}
                      >
                        <Layers className="w-4 h-4 mr-2" />
                        Architecture
                      </Button>
                      <Button
                        variant={mode === 'code-generation' ? 'default' : 'ghost'}
                        onClick={() => setMode('code-generation')}
                        className={`flex-1 ${mode === 'code-generation' ? 'bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black' : 'hover:bg-gray-700 text-white'}`}
                      >
                        <Code className="w-4 h-4 mr-2" />
                        PRD Code Gen
                      </Button>
                    </div>
                  </div>

                  {mode === 'code-generation' ? (
                    /* PRD Code Generation Mode */
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">High Level Solution Summary</label>
                        <Textarea
                          value={prdSolutionSummary}
                          onChange={(e) => setPrdSolutionSummary(e.target.value)}
                          placeholder="Paste the High Level Solution Summary from your PRD document here..."
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-32"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Copy the solution summary section from your PRD document
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">Programming Language</label>
                        <div className="grid grid-cols-2 gap-2">
                          {programmingLanguages.map((lang) => (
                            <Button
                              key={lang.value}
                              variant={selectedLanguage === lang.value ? "default" : "outline"}
                              onClick={() => {
                                setSelectedLanguage(lang.value);
                                setSelectedFramework('');
                              }}
                              className={`justify-start h-auto p-3 ${
                                selectedLanguage === lang.value
                                  ? 'bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black'
                                  : 'border-gray-600 text-white hover:bg-gray-700'
                              }`}
                            >
                              <span className="mr-2">{lang.icon}</span>
                              {lang.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {selectedLanguage && frameworksByLanguage[selectedLanguage] && (
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Framework (Optional)</label>
                          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                            <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                              <SelectValue placeholder="Select framework" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-600">
                              {frameworksByLanguage[selectedLanguage].map((framework) => (
                                <SelectItem key={framework} value={framework} className="text-white hover:bg-gray-700">
                                  {framework}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Architecture Mode */
                    <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Project Name</label>
                      <Input
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="my-awesome-app"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Description</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your application..."
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-20"
                      />
                    </div>
                  </div>

                  {/* Architecture Template */}
                  <div>
                    <label className="block text-sm font-medium mb-3 text-gray-300">Architecture Template</label>
                    <div className="grid grid-cols-1 gap-2">
                      {architectureTemplates.map((template) => {
                        const IconComponent = template.icon;
                        return (
                          <Button
                            key={template.value}
                            variant={selectedTemplate === template.value ? "default" : "outline"}
                            onClick={() => setSelectedTemplate(template.value)}
                            className={`justify-start h-auto p-3 ${
                              selectedTemplate === template.value
                                ? 'bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black'
                                : 'border-gray-600 text-white hover:bg-gray-700'
                            }`}
                          >
                            <IconComponent className="w-4 h-4 mr-2" />
                            <div className="text-left">
                              <div className="font-medium">{template.label}</div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tech Stack Selection */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">Technology Stack</h3>
                    
                    {Object.entries(techStacks).map(([category, options]) => (
                      <div key={category}>
                        <label className="block text-xs font-medium mb-1 text-gray-400 capitalize">
                          {category}
                        </label>
                        <Select
                          value={techStack[category as keyof typeof techStack]}
                          onValueChange={(value) => setTechStack(prev => ({ ...prev, [category]: value }))}
                        >
                          <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white">
                            <SelectValue placeholder={`Select ${category}`} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-600">
                            {options.map((option) => (
                              <SelectItem key={option} value={option} className="text-white hover:bg-gray-700">
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleGenerate}
                    disabled={mode === 'architecture' ? generateArchitectureMutation.isPending : generateCodeMutation.isPending}
                    className="w-full bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black h-12 text-lg font-medium shadow-lg"
                  >
                    {(mode === 'architecture' ? generateArchitectureMutation.isPending : generateCodeMutation.isPending) ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        {mode === 'architecture' ? 'Generate Architecture' : 'Generate Code'}
                      </>
                    )}
                  </Button>
                  )}
                </CardContent>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-6">
              {mode === 'code-generation' && generatedCode ? (
                <Card className="bg-black border-[hsl(322,100%,45%)] shadow-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl text-white">
                        <CheckCircle className="w-6 h-6 mr-3 text-[hsl(322,100%,45%)]" />
                        Generated {generatedCode.language} Code
                        {generatedCode.framework && (
                          <Badge className="ml-2 bg-purple-500/20 text-purple-400">
                            {generatedCode.framework}
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedCode.files.map(f => f.content).join('\n\n'))}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadScaffolding}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-3 bg-gray-700/30">
                        <TabsTrigger value="code" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Generated Code
                        </TabsTrigger>
                        <TabsTrigger value="setup" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Setup Instructions
                        </TabsTrigger>
                        <TabsTrigger value="run" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Run Commands
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="code" className="mt-6">
                        <div className="space-y-6">
                          {generatedCode.files.map((file, index) => (
                            <div key={index} className="bg-gray-900/50 rounded-lg border border-gray-600">
                              <div className="flex items-center justify-between p-3 border-b border-gray-600">
                                <div className="flex items-center space-x-2">
                                  <FileCode className="w-4 h-4 text-blue-400" />
                                  <span className="text-sm font-mono text-blue-400">{file.path}</span>
                                  <Badge className="bg-gray-600 text-gray-200 text-xs">
                                    {generatedCode.language}
                                  </Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(file.content)}
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Copy className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="p-4">
                                <p className="text-sm text-gray-400 mb-3">{file.description}</p>
                                <div className="max-h-96 overflow-y-auto">
                                  <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {file.content}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="setup" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-purple-400">Setup Instructions</h3>
                          <div className="space-y-3">
                            {generatedCode.setupInstructions.map((instruction, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                                  {index + 1}
                                </div>
                                <span className="text-gray-300">{instruction}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="run" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-purple-400">Run Commands</h3>
                          <div className="space-y-3">
                            {generatedCode.runCommands.map((command, index) => (
                              <div key={index} className="bg-gray-800/50 p-3 rounded border border-gray-600">
                                <code className="text-sm text-green-300">{command}</code>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : mode === 'architecture' && generatedArchitecture ? (
                <Card className="bg-black border-[hsl(322,100%,45%)] shadow-2xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-xl text-white">
                        <CheckCircle className="w-6 h-6 mr-3 text-[hsl(322,100%,45%)]" />
                        {generatedArchitecture.projectName}
                      </CardTitle>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={downloadScaffolding}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={createWorkflow}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Create Workflow
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-400 mt-2">{generatedArchitecture.description}</p>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="grid w-full grid-cols-5 bg-gray-700/30">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="diagram" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Diagram
                        </TabsTrigger>
                        <TabsTrigger value="code" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Code
                        </TabsTrigger>
                        <TabsTrigger value="workflow" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Workflow
                        </TabsTrigger>
                        <TabsTrigger value="dependencies" className="data-[state=active]:bg-[hsl(322,100%,45%)] data-[state=active]:text-black">
                          Dependencies
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-purple-400">Architecture Components</h3>
                          <div className="grid gap-4">
                            {generatedArchitecture.components.map((component) => (
                              <div key={component.id} className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      component.type === 'frontend' ? 'bg-blue-500' :
                                      component.type === 'backend' ? 'bg-green-500' :
                                      component.type === 'database' ? 'bg-purple-500' :
                                      component.type === 'api' ? 'bg-orange-500' : 'bg-pink-500'
                                    }`} />
                                    <h4 className="font-semibold text-white">{component.name}</h4>
                                  </div>
                                  <Badge className="bg-gray-600 text-gray-200 text-xs">
                                    {component.technology}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{component.description}</p>
                                {component.dependencies.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {component.dependencies.map((dep, index) => (
                                      <Badge key={index} className="bg-gray-500/30 text-gray-300 text-xs">
                                        {dep}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="diagram" className="mt-6">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-purple-400">Architecture Diagram</h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(generatedArchitecture.diagram)}
                              className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy Mermaid
                            </Button>
                          </div>
                          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-600">
                            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                              {generatedArchitecture.diagram}
                            </pre>
                          </div>
                          <div className="text-xs text-gray-400">
                            This is a Mermaid diagram. Copy the code and paste it into a Mermaid viewer for visual representation.
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="code" className="mt-6">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-purple-400">Code Scaffolding</h3>
                          {Object.entries(generatedArchitecture.codeScaffolding).map(([section, data]) => (
                            <div key={section} className="space-y-3">
                              <h4 className="text-md font-semibold text-pink-400 capitalize flex items-center">
                                <Folder className="w-4 h-4 mr-2" />
                                {section}
                              </h4>
                              {data.files.map((file, index) => (
                                <div key={index} className="bg-gray-900/50 rounded-lg border border-gray-600">
                                  <div className="flex items-center justify-between p-3 border-b border-gray-600">
                                    <div className="flex items-center space-x-2">
                                      <FileCode className="w-4 h-4 text-blue-400" />
                                      <span className="text-sm font-mono text-blue-400">{file.path}</span>
                                      <Badge className="bg-gray-600 text-gray-200 text-xs">
                                        {file.language}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => copyToClipboard(file.content)}
                                      className="text-gray-400 hover:text-white"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="p-4 max-h-64 overflow-y-auto">
                                    <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                                      {file.content}
                                    </pre>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </TabsContent>

                      <TabsContent value="workflow" className="mt-6">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-purple-400">Development Workflow</h3>
                          
                          <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <h4 className="text-md font-semibold text-green-400 flex items-center">
                                <Settings className="w-4 h-4 mr-2" />
                                Setup Steps
                              </h4>
                              <div className="space-y-2">
                                {generatedArchitecture.workflow.setupSteps.map((step, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-sm text-gray-300">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-md font-semibold text-blue-400 flex items-center">
                                <Terminal className="w-4 h-4 mr-2" />
                                Run Commands
                              </h4>
                              <div className="space-y-2">
                                {generatedArchitecture.workflow.runCommands.map((cmd, index) => (
                                  <div key={index} className="bg-gray-800/50 p-2 rounded border border-gray-600">
                                    <code className="text-sm text-blue-300">{cmd}</code>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <h4 className="text-md font-semibold text-orange-400 flex items-center">
                                <Play className="w-4 h-4 mr-2" />
                                Deploy Steps
                              </h4>
                              <div className="space-y-2">
                                {generatedArchitecture.workflow.deploySteps.map((step, index) => (
                                  <div key={index} className="flex items-start space-x-2">
                                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-black mt-0.5">
                                      {index + 1}
                                    </div>
                                    <span className="text-sm text-gray-300">{step}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="dependencies" className="mt-6">
                        <div className="space-y-6">
                          <h3 className="text-lg font-semibold text-purple-400">Project Dependencies</h3>
                          
                          <div className="grid md:grid-cols-2 gap-6">
                            {Object.entries(generatedArchitecture.dependencies).map(([category, deps]) => (
                              <div key={category} className="space-y-3">
                                <h4 className="text-md font-semibold text-pink-400 capitalize flex items-center">
                                  <Package className="w-4 h-4 mr-2" />
                                  {category} Dependencies
                                </h4>
                                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-600">
                                  <div className="space-y-2">
                                    {deps.map((dep, index) => (
                                      <div key={index} className="flex items-center justify-between">
                                        <code className="text-sm text-blue-300">{dep}</code>
                                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                                          Latest
                                        </Badge>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600">
                            <h4 className="text-md font-semibold text-yellow-400 mb-2">Installation Commands</h4>
                            <div className="space-y-2">
                              <div className="bg-gray-800/50 p-2 rounded">
                                <code className="text-sm text-green-300">npm install {generatedArchitecture.dependencies.frontend?.join(' ')}</code>
                              </div>
                              <div className="bg-gray-800/50 p-2 rounded">
                                <code className="text-sm text-green-300">npm install {generatedArchitecture.dependencies.backend?.join(' ')}</code>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-black border-[hsl(322,100%,45%)] shadow-2xl">
                  <CardContent className="py-16">
                    <div className="text-center">
                      {mode === 'code-generation' ? (
                        <>
                          <Code className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Generate Code</h3>
                          <p className="text-gray-500">Paste your PRD High Level Solution Summary and select a language</p>
                        </>
                      ) : (
                        <>
                          <Layers className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Generate Architecture</h3>
                          <p className="text-gray-500">Configure your project and generate complete code architecture</p>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
