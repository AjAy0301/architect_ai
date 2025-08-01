import { useEffect, useRef, useState, useCallback } from 'react';

// Use CDN version of mermaid for better compatibility
declare global {
  interface Window {
    mermaid: any;
  }
}

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function
  const cleanup = useCallback(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
  }, []);
  
  // Debug: Check if mermaid is available on component mount
  useEffect(() => {
    console.log('MermaidDiagram mounted, mermaid available:', !!window.mermaid);
    
    // Cleanup function for component unmount
    return () => {
      console.log('MermaidDiagram unmounting');
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      setSvgContent('');
      
      if (!chart) {
        console.log('No chart content available');
        if (isMounted) setIsLoading(false);
        return;
      }

      console.log('Rendering diagram for:', title || 'Untitled');
      console.log('Chart content length:', chart.length);
      
      try {
        // Check if mermaid is available
        if (!window.mermaid) {
          console.log('Waiting for Mermaid to load...');
          
          // Try to load Mermaid dynamically if CDN failed
          const loadMermaid = async () => {
            return new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js';
              script.onload = () => {
                console.log('Mermaid loaded dynamically');
                resolve(true);
              };
              script.onerror = () => {
                console.error('Failed to load Mermaid dynamically');
                reject(new Error('Failed to load Mermaid'));
              };
              document.head.appendChild(script);
            });
          };
          
          try {
            await loadMermaid();
          } catch (error) {
            console.error('Dynamic loading failed, trying retries...');
            // Fallback to retries
            for (let i = 0; i < 20; i++) {
              if (!isMounted) return;
              await new Promise(resolve => setTimeout(resolve, 300));
              if (window.mermaid) {
                console.log('Mermaid loaded after retry', i + 1);
                break;
              }
              console.log(`Mermaid not available, retry ${i + 1}/20`);
            }
          }
          
                  if (!window.mermaid) {
          console.error('Mermaid library failed to load. Available window properties:', Object.keys(window));
          throw new Error('Mermaid library not loaded from CDN. Please refresh the page and try again.');
        }
        
        // Test if Mermaid is working
        try {
          window.mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose'
          });
          console.log('Mermaid initialization successful');
        } catch (initError) {
          console.error('Mermaid initialization failed:', initError);
          throw new Error('Mermaid library is not working properly. Please refresh the page.');
        }
        }
        
        if (!isMounted) return;
        console.log('Mermaid library loaded successfully');

        // Initialize mermaid with minimal configuration for compatibility
        window.mermaid.initialize({
          startOnLoad: false, // Disable auto-start
          theme: 'dark',
          securityLevel: 'loose',
          fontFamily: 'monospace',
          fontSize: 12
        });

        // Create a unique ID for the diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

        console.log('Rendering with ID:', id);
        console.log('Chart content:', chart);

        // Render the diagram to get SVG content
        const { svg } = await window.mermaid.render(id, chart);
        
        // Update state instead of directly manipulating DOM
        if (isMounted) {
          setSvgContent(svg);
          setIsLoading(false);
          console.log('Diagram rendered successfully');
        }
      } catch (error: any) {
        console.error('Mermaid rendering error:', error);
        if (isMounted) {
          setError(error.message);
          setIsLoading(false);
        }
      }
    };

    // Use a timeout to debounce rapid changes
    cleanup();
    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram().catch((error) => {
        console.error('Render diagram error:', error);
        if (isMounted) {
          setError('Failed to render diagram');
          setIsLoading(false);
        }
      });
    }, 100);

    // Cleanup function
    return () => {
      isMounted = false;
      cleanup();
    };
  }, [chart, title, cleanup]);

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="font-medium text-white mb-2">{title}</h4>
      )}
      <div 
        className="bg-ai-dark-200 p-4 rounded border border-ai-pink/20 overflow-x-auto flex items-center justify-center"
        style={{ minHeight: '200px' }}
      >
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ai-pink mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Rendering diagram...</p>
          </div>
        )}
        {error && (
          <div className="text-red-400 p-4 border border-red-500/30 rounded bg-ai-dark-100 w-full">
            <p className="font-medium">Diagram Rendering Error</p>
            <p className="text-sm mb-2">{error}</p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-ai-pink">Show Mermaid Code</summary>
              <pre className="mt-2 p-2 bg-ai-dark-200 rounded text-xs overflow-x-auto text-gray-300 border border-ai-pink/20">{chart}</pre>
            </details>
          </div>
        )}
        {!isLoading && !error && svgContent && (
          <div 
            className="w-full"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  );
} 