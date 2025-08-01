import { useState, useEffect, useCallback, useRef } from "react";
import { FileText, Download, Eye, AlertTriangle, CheckCircle, Clock, Loader2, Brain, Code, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useArchitectureContext } from "@/contexts/architecture-context";
import { api } from "@/lib/api";
import MermaidDiagram from "./mermaid-diagram";
import MarkdownRenderer from "./markdown-renderer";

interface ArchitectureDocument {
  title: string;
  summary: string;
  components: Array<{
    name: string;
    type: string;
    description: string;
    apis: Array<string | { method: string; endpoint: string }>;
  }>;
  sequenceDiagrams: Array<{
    title: string;
    description: string;
    mermaidCode: string;
  }>;
  impactAnalysis: Array<{
    component: string;
    riskLevel: 'low' | 'medium' | 'high';
    affectedServices: string[];
    description: string;
  }>;
}

interface ArchitectureDocumentGeneratorProps {
  onDocumentGenerated?: (doc: ArchitectureDocument) => void;
  initialData?: ArchitectureDocument | null;
  initialContent?: string;
  initialTitle?: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
}

export default function ArchitectureDocumentGenerator({
  onDocumentGenerated,
  initialData,
  initialContent = "",
  initialTitle = "",
  onContentChange,
  onTitleChange
}: ArchitectureDocumentGeneratorProps) {
  const { 
    generationState, 
    startGeneration, 
    updateProgress, 
    completeGeneration, 
    resetGeneration,
    setDocumentContent,
    setDocumentTitle
  } = useArchitectureContext();
  
  const [content, setContent] = useState(initialContent);
  const [title, setTitle] = useState(initialTitle);
  const [architectureDoc, setArchitectureDoc] = useState<ArchitectureDocument | null>(initialData || null);
  const [selectedDiagram, setSelectedDiagram] = useState<string>("");
  const { toast } = useToast();
  const currentStepRef = useRef(0);

  // Sync local state with global context (only on initial load)
  useEffect(() => {
    if (initialContent && !generationState.isGenerating) {
      setDocumentContent(initialContent);
    }
    if (initialTitle && !generationState.isGenerating) {
      setDocumentTitle(initialTitle);
    }
  }, [initialContent, initialTitle, setDocumentContent, setDocumentTitle, generationState.isGenerating]);

  // Update local state when global state changes
  useEffect(() => {
    if (generationState.generatedDocument && !architectureDoc) {
      setArchitectureDoc(generationState.generatedDocument);
      if (onDocumentGenerated) {
        onDocumentGenerated(generationState.generatedDocument);
      }
    }
  }, [generationState.generatedDocument, architectureDoc, onDocumentGenerated]);

  const generationSteps = [
    { name: "Analyzing Architecture", icon: Brain, progress: 20 },
    { name: "Extracting Components", icon: Code, progress: 40 },
    { name: "Generating Sequence Diagrams", icon: Eye, progress: 60 },
    { name: "Performing Impact Analysis", icon: BarChart3, progress: 80 },
    { name: "Creating Summary", icon: FileText, progress: 100 }
  ];

  const handleGenerate = async () => {
    if (!content.trim() || !title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    // Don't start if already generating
    if (generationState.isGenerating) {
      toast({
        title: "Generation in Progress",
        description: "Please wait for the current generation to complete",
      });
      return;
    }

    startGeneration();
    updateProgress(0, "Starting generation...");

    try {
      // Update global context with current content and title
      setDocumentContent(content);
      setDocumentTitle(title);

      // Step-by-step progress updates using ref to avoid closure issues
      currentStepRef.current = 0;
      
      const updateStepProgress = () => {
        if (currentStepRef.current < generationSteps.length) {
          const step = generationSteps[currentStepRef.current];
          updateProgress(step.progress, step.name);
          currentStepRef.current++;
        }
      };

      // Start with first step
      updateStepProgress();

      // Progress through steps with realistic timing
      const stepIntervals = [
        setTimeout(() => updateStepProgress(), 3000),  // Analyzing Architecture
        setTimeout(() => updateStepProgress(), 8000),  // Extracting Components  
        setTimeout(() => updateStepProgress(), 15000), // Generating Sequence Diagrams
        setTimeout(() => updateStepProgress(), 20000), // Performing Impact Analysis
      ];

      const doc = await api.generateArchitectureDocument(content, title);
      
      // Clear any remaining timeouts
      stepIntervals.forEach(clearTimeout);
      
      console.log('Generated architecture document:', doc);
      console.log('Number of sequence diagrams:', doc.sequenceDiagrams?.length);
      if (doc.sequenceDiagrams) {
        doc.sequenceDiagrams.forEach((diagram: any, index: number) => {
          console.log(`Diagram ${index}:`, diagram.title, 'Code length:', diagram.mermaidCode?.length);
        });
      }
      
      updateProgress(100, "Generation complete!");
      
      // Complete generation in global context
      completeGeneration(doc);
      
      // Update local state
      setArchitectureDoc(doc);
      console.log('Architecture doc set:', doc);
      console.log('Sequence diagrams in doc:', doc.sequenceDiagrams);
      onDocumentGenerated?.(doc);
      
      toast({
        title: "Document Generated",
        description: "Architecture document created successfully",
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate architecture document",
        variant: "destructive",
      });
      resetGeneration();
    }
  };

  const handleGeneratePDF = async () => {
    if (!architectureDoc) return;

    try {
      const pdfBlob = await api.generatePDFDocument(architectureDoc);
      
      // Create and download PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${architectureDoc.title.replace(/\s+/g, '_')}_architecture.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF Generated",
        description: "Architecture document downloaded as PDF",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "Failed to generate PDF document",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-ai-dark-100 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Architecture Document Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Document Title</label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                // Only update global context if not currently generating
                if (!generationState.isGenerating) {
                  setDocumentTitle(e.target.value);
                }
                onTitleChange?.(e.target.value);
              }}
              placeholder="e.g., Service Details V-26 API Architecture"
              className="bg-ai-dark-200 border-gray-600 text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-white">Architecture Content</label>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                // Only update global context if not currently generating
                if (!generationState.isGenerating) {
                  setDocumentContent(e.target.value);
                }
                onContentChange?.(e.target.value);
              }}
              placeholder="Paste your software architecture documentation, API specifications, or system descriptions here..."
              rows={8}
              className="bg-ai-dark-200 border-gray-600 text-white"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generationState.isGenerating || !content.trim() || !title.trim()}
            className="w-full bg-ai-pink hover:bg-ai-pink/90 text-white"
          >
            {generationState.isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Architecture Document...
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Generate Architecture Document
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Loading Overlay */}
      {generationState.isGenerating && (
        <Card className="bg-ai-dark-100 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              AI Processing in Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-300">
                <span>Progress</span>
                <span>{Math.round(generationState.progress)}%</span>
              </div>
              <Progress 
                value={generationState.progress} 
                className="h-3 bg-ai-dark-200"
              />
            </div>

            {/* Current Step */}
            <div className="text-center">
              <p className="text-white font-medium">{generationState.currentStep}</p>
              <p className="text-sm text-gray-400 mt-1">This may take 30-60 seconds</p>
            </div>

            {/* Generation Steps */}
            <div className="space-y-3">
              {generationSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = generationState.progress >= step.progress;
                const isCompleted = generationState.progress > step.progress;
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isCompleted ? 'bg-green-500' : isActive ? 'bg-ai-pink' : 'bg-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-4 w-4 text-white" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      ) : (
                        <StepIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCompleted ? 'text-green-400' : isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.name}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* AI Processing Info */}
            <div className="bg-ai-dark-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-ai-pink" />
                <span className="text-sm font-medium text-white">AI Processing</span>
              </div>
              <p className="text-xs text-gray-400">
                The AI is analyzing your architecture content, extracting components, 
                generating sequence diagrams, and performing impact analysis. 
                This process uses advanced NLP and machine learning techniques.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Document */}
      {architectureDoc && (
        <div className="space-y-6">
          {/* Summary */}
          <Card className="bg-ai-dark-100 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Document Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={architectureDoc.summary} />
            </CardContent>
          </Card>

          {/* Components */}
          <Card className="bg-ai-dark-100 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">System Components</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {architectureDoc.components && architectureDoc.components.length > 0 ? (
                  architectureDoc.components.map((component, index) => (
                    <div key={index} className="bg-ai-dark-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">{component.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {component.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{component.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {component.apis && component.apis.length > 0 ? (
                          component.apis.map((api, apiIndex) => (
                            <Badge key={apiIndex} variant="secondary" className="text-xs">
                              {typeof api === 'string' ? api : 'method' in api && 'endpoint' in api ? `${api.method} ${api.endpoint}` : JSON.stringify(api)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No APIs defined</span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-gray-400 py-8">
                    No components defined
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sequence Diagrams */}
          <Card className="bg-ai-dark-100 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sequence Diagrams ({architectureDoc.sequenceDiagrams?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {architectureDoc.sequenceDiagrams && architectureDoc.sequenceDiagrams.length > 0 ? (
                  architectureDoc.sequenceDiagrams.map((diagram, index) => {
                    console.log(`Rendering diagram ${index}:`, diagram.title, 'Code length:', diagram.mermaidCode.length);
                    return (
                      <div key={index} className="bg-ai-dark-200 p-4 rounded-lg">
                        <h4 className="font-medium text-white mb-2">{diagram.title}</h4>
                        <p className="text-sm text-gray-400 mb-3">{diagram.description}</p>
                        <MermaidDiagram 
                          chart={diagram.mermaidCode} 
                          title={diagram.title}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No sequence diagrams generated
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          <Card className="bg-ai-dark-100 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Impact Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {architectureDoc.impactAnalysis && architectureDoc.impactAnalysis.length > 0 ? (
                  architectureDoc.impactAnalysis.map((impact, index) => (
                  <div key={index} className="bg-ai-dark-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-white">{impact.component}</h4>
                      <Badge className={`${getRiskColor(impact.riskLevel)} text-white flex items-center gap-1`}>
                        {getRiskIcon(impact.riskLevel)}
                        {impact.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{impact.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {impact.affectedServices && impact.affectedServices.length > 0 ? (
                        impact.affectedServices.map((service, serviceIndex) => (
                          <Badge key={serviceIndex} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">No affected services</span>
                      )}
                    </div>
                  </div>
                ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No impact analysis available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="bg-ai-dark-100 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Export Document</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleGeneratePDF}
                className="bg-ai-pink hover:bg-ai-pink/90 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Architecture Document
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}