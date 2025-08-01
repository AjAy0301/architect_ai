import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Database, 
  FlaskConical, 
  LayoutDashboard, 
  User, 
  GitBranch,
  Settings 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { OllamaModel } from "@/types/agents";

export function Sidebar() {
  const [location] = useLocation();

  const { data: models } = useQuery<OllamaModel[]>({
    queryKey: ['/api/ollama/models'],
  });

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Jira Analyst', href: '/jira-analyst', icon: FlaskConical },
    { name: 'Tech Architect', href: '/tech-architect', icon: GitBranch },
    { name: 'Product Manager', href: '/product-manager', icon: User },
    { name: 'Vector Store', href: '/vector-store', icon: Database },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
  ];

  return (
    <div className="w-64 bg-dark-secondary border-r border-gray-700 flex-shrink-0 flex flex-col">
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-agent-blue rounded-lg flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">AI Multi-Agent</h1>
            <p className="text-sm text-gray-400">Ollama Edition</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-b border-gray-700">
        <div className="text-sm text-gray-400 mb-2">System Status</div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm">Ollama Running</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Models: {models?.length || 0} available
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer",
                isActive 
                  ? "bg-gray-700 text-white" 
                  : "hover:bg-gray-700 text-gray-300 hover:text-white"
              )}>
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Active Model Display */}
      <div className="p-4 border-t border-gray-700">
        <div className="text-sm text-gray-400 mb-1">Active Model</div>
        <select className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm">
                          <option>llama3.1:8b</option>
          {models?.map((model) => (
            <option key={model.name} value={model.name}>
              {model.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
