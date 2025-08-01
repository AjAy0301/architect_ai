
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

export default function CodeGeneratorArchitecture() {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [techStack, setTechStack] = useState({
    frontend: '',
    backend: '',
    database: '',
    deployment: ''
  });
  const [generatedArchitecture, setGeneratedArchitecture] = useState<GeneratedArchitecture | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

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

  const handleGenerate = () => {
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
                Code Architecture Generator
              </h1>
              <p className="text-[hsl(322,100%,45%)] text-lg">Generate complete application architectures with code scaffolding</p>
            </div>
            <div className="text-right">
              <div className="text-[hsl(322,100%,45%)] text-sm">Powered by</div>
              <div className="text-white font-semibold">AI Architecture Engine</div>
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
                    Project Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Project Details */}
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
                    disabled={generateArchitectureMutation.isPending}
                    className="w-full bg-[hsl(322,100%,45%)] hover:bg-[hsl(322,100%,35%)] text-black h-12 text-lg font-medium shadow-lg"
                  >
                    {generateArchitectureMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Generate Architecture
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-2 space-y-6">
              {generatedArchitecture ? (
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
                      <Code className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-400 mb-2">Ready to Generate Architecture</h3>
                      <p className="text-gray-500">Configure your project and generate complete code architecture</p>
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
