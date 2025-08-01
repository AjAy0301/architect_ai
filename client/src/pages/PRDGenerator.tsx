
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/Sidebar";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { 
  Loader2, 
  FileText, 
  Upload, 
  Paperclip, 
  Eye, 
  ExternalLink, 
  Copy, 
  Download, 
  CheckCircle, 
  Zap,
  X,
  Plus
} from "lucide-react";

interface PRDData {
  title: string;
  introduction: string;
  problem_statement: string;
  user_stories: string[];
  technical_requirements: string[];
  non_functional_requirements: Record<string, string>;
  out_of_scope: string[];
  success_metrics: string[];
}

interface GeneratedPRD {
  prd_data: PRDData;
  ticket_key?: string;
  confluence_link?: string;
  status: string;
}

export default function PRDGenerator() {
  const [description, setDescription] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [generatedPRD, setGeneratedPRD] = useState<GeneratedPRD | null>(null);
  const [inputMode, setInputMode] = useState<'description' | 'ticket'>('description');
  const { toast } = useToast();

  const generatePRDMutation = useMutation({
    mutationFn: async (data: { description?: string; ticketId?: string; attachments?: File[] }) => {
      const formData = new FormData();
      
      if (data.description) {
        formData.append('description', data.description);
      }
      if (data.ticketId) {
        formData.append('ticketId', data.ticketId);
      }
      if (data.attachments) {
        data.attachments.forEach((file, index) => {
          formData.append(`attachment_${index}`, file);
        });
      }

      const response = await fetch('/api/workflows/prd-generator', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate PRD');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPRD(data);
      toast({
        title: "PRD Generated Successfully",
        description: "Your Product Requirements Document is ready",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate PRD",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = () => {
    if (inputMode === 'description' && !description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'ticket' && !ticketNumber.trim()) {
      toast({
        title: "Error",
        description: "Please provide a ticket number",
        variant: "destructive",
      });
      return;
    }

    // Demo PRD generation
    const demoPRD: GeneratedPRD = {
      prd_data: {
        title: inputMode === 'ticket' ? `PRD for ${ticketNumber}` : "Custom Feature PRD",
        introduction: "This PRD outlines the requirements for implementing a new feature that will enhance user experience and business value.",
        problem_statement: "Users currently face challenges with the existing workflow that impacts productivity and satisfaction.",
        user_stories: [
          "As a user, I want to easily access the feature so that I can improve my workflow",
          "As an admin, I want to monitor usage so that I can optimize performance",
          "As a developer, I want clear APIs so that I can integrate effectively"
        ],
        technical_requirements: [
          "Implement RESTful API endpoints",
          "Add database schema changes",
          "Create responsive UI components",
          "Integrate with existing authentication system"
        ],
        non_functional_requirements: {
          "Performance": "Response time < 200ms",
          "Security": "OAuth 2.0 authentication required",
          "Scalability": "Support up to 10,000 concurrent users",
          "Availability": "99.9% uptime SLA"
        },
        out_of_scope: [
          "Mobile app implementation",
          "Third-party integrations beyond specified APIs",
          "Legacy system migration"
        ],
        success_metrics: [
          "User adoption rate > 80% within 3 months",
          "User satisfaction score > 4.5/5",
          "Performance benchmarks met",
          "Zero critical security vulnerabilities"
        ]
      },
      ticket_key: inputMode === 'ticket' ? ticketNumber : undefined,
      confluence_link: "https://confluence.telekom.com/prd/12345",
      status: "completed"
    };

    setTimeout(() => {
      setGeneratedPRD(demoPRD);
      toast({
        title: "PRD Generated Successfully",
        description: "Your Product Requirements Document is ready",
      });
    }, 2000);

    generatePRDMutation.mutate({
      description: inputMode === 'description' ? description : undefined,
      ticketId: inputMode === 'ticket' ? ticketNumber : undefined,
      attachments: attachments
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Link copied to clipboard",
    });
  };

  const exportToPDF = () => {
    toast({
      title: "Export Started",
      description: "PRD is being exported to PDF",
    });
  };

  const openConfluence = () => {
    if (generatedPRD?.confluence_link) {
      window.open(generatedPRD.confluence_link, '_blank');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-pink-950 via-purple-950 to-pink-900 text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        {/* Header with Deutsche Telekom magenta theme */}
        <header className="bg-gradient-to-r from-pink-600 to-purple-600 px-8 py-8 shadow-xl">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                  <span className="text-pink-600 font-bold text-xl">T</span>
                </div>
                PRD Generator
              </h1>
              <p className="text-pink-100 text-lg">Create comprehensive Product Requirements Documents</p>
            </div>
            <div className="text-right">
              <div className="text-pink-100 text-sm">Deutsche Telekom</div>
              <div className="text-white font-semibold">AI-Powered PRD Creation</div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-pink-500/30 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <FileText className="w-6 h-6 mr-3 text-pink-400" />
                    Generate PRD
                  </CardTitle>
                  <p className="text-gray-400 mt-2">Choose your input method to generate a comprehensive PRD</p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Input Mode Selection */}
                  <div className="flex space-x-2 bg-gray-700/30 p-1 rounded-lg">
                    <Button
                      variant={inputMode === 'description' ? 'default' : 'ghost'}
                      onClick={() => setInputMode('description')}
                      className={`flex-1 ${inputMode === 'description' ? 'bg-pink-600 hover:bg-pink-700' : 'hover:bg-gray-600'}`}
                    >
                      Description + Attachments
                    </Button>
                    <Button
                      variant={inputMode === 'ticket' ? 'default' : 'ghost'}
                      onClick={() => setInputMode('ticket')}
                      className={`flex-1 ${inputMode === 'ticket' ? 'bg-pink-600 hover:bg-pink-700' : 'hover:bg-gray-600'}`}
                    >
                      OAUS Ticket
                    </Button>
                  </div>

                  {inputMode === 'description' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-300">Feature Description</label>
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Describe the feature you want to create a PRD for..."
                          className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 min-h-32"
                        />
                      </div>

                      {/* Attachments */}
                      <div>
                        <label className="block text-sm font-medium mb-3 text-gray-300">Attachments</label>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              className="border-pink-500/50 text-pink-400 hover:bg-pink-500/10"
                            >
                              <Paperclip className="w-4 h-4 mr-2" />
                              Add Files
                            </Button>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              onChange={handleFileUpload}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                            />
                            <span className="text-sm text-gray-400">
                              PDF, DOC, TXT, Images
                            </span>
                          </div>

                          {attachments.length > 0 && (
                            <div className="space-y-2">
                              {attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <Paperclip className="w-4 h-4 text-pink-400" />
                                    <span className="text-sm">{file.name}</span>
                                    <span className="text-xs text-gray-400">
                                      ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeAttachment(index)}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-3 text-gray-300">OAUS Ticket Number</label>
                      <Input
                        type="text"
                        value={ticketNumber}
                        onChange={(e) => setTicketNumber(e.target.value)}
                        placeholder="e.g., OAUS-1234"
                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 h-12 text-lg"
                      />
                    </div>
                  )}

                  <Button 
                    onClick={handleGenerate}
                    disabled={generatePRDMutation.isPending}
                    className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 h-12 text-lg font-medium shadow-lg"
                  >
                    {generatePRDMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating PRD...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Generate PRD
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Preview Section */}
            <div className="space-y-6">
              <Card className="bg-gray-800/50 border-pink-500/30 backdrop-blur-sm shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center text-xl">
                      <Eye className="w-6 h-6 mr-3 text-purple-400" />
                      PRD Preview
                    </CardTitle>
                    {generatedPRD && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openConfluence}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Confluence
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPRD.confluence_link || '')}
                          className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportToPDF}
                          className="border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Export PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedPRD ? (
                    <div className="space-y-6 max-h-[800px] overflow-y-auto">
                      <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 p-4 rounded-lg border border-green-500/30">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-green-400 font-semibold">PRD Generated Successfully</span>
                        </div>
                        {generatedPRD.ticket_key && (
                          <p className="text-green-300 text-sm">Source: {generatedPRD.ticket_key}</p>
                        )}
                      </div>

                      <div className="prose prose-invert max-w-none">
                        <h1 className="text-2xl font-bold text-pink-400 mb-4">{generatedPRD.prd_data.title}</h1>
                        
                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Introduction</h2>
                          <p className="text-gray-300">{generatedPRD.prd_data.introduction}</p>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Problem Statement</h2>
                          <p className="text-gray-300">{generatedPRD.prd_data.problem_statement}</p>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">User Stories</h2>
                          <ul className="space-y-2">
                            {generatedPRD.prd_data.user_stories.map((story, index) => (
                              <li key={index} className="text-gray-300 flex items-start">
                                <span className="text-pink-400 mr-2">•</span>
                                {story}
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Technical Requirements</h2>
                          <ul className="space-y-2">
                            {generatedPRD.prd_data.technical_requirements.map((req, index) => (
                              <li key={index} className="text-gray-300 flex items-start">
                                <span className="text-pink-400 mr-2">•</span>
                                {req}
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Non-Functional Requirements</h2>
                          <div className="space-y-2">
                            {Object.entries(generatedPRD.prd_data.non_functional_requirements).map(([key, value]) => (
                              <div key={key} className="text-gray-300">
                                <span className="text-pink-400 font-medium">{key}:</span> {value}
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Out of Scope</h2>
                          <ul className="space-y-2">
                            {generatedPRD.prd_data.out_of_scope.map((item, index) => (
                              <li key={index} className="text-gray-300 flex items-start">
                                <span className="text-pink-400 mr-2">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </section>

                        <section className="mb-6">
                          <h2 className="text-xl font-semibold text-purple-400 mb-2">Success Metrics</h2>
                          <ul className="space-y-2">
                            {generatedPRD.prd_data.success_metrics.map((metric, index) => (
                              <li key={index} className="text-gray-300 flex items-start">
                                <span className="text-pink-400 mr-2">•</span>
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">PRD preview will appear here</p>
                      <p className="text-gray-500 text-sm mt-2">Generate a PRD to see the preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
