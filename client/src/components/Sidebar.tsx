import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  CheckCircle, 
  Database, 
  FlaskConical, 
  LayoutDashboard, 
  FileText, 
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
    { name: 'OneButton', href: '/onebutton', icon: CheckCircle },
    { name: 'HSD Generator', href: '/hsd-generator', icon: FlaskConical },
    { name: 'PRD Generator', href: '/prd-generator', icon: FileText },
    { name: 'Code Generator', href: '/code-generator', icon: GitBranch },
    { name: 'Architecture', href: '/architecture', icon: Database },
    { name: 'Workflows', href: '/workflows', icon: GitBranch },
  ];

  return (
    <div className="w-64 bg-gray-900 border-r border-pink-500/30 flex-shrink-0 flex flex-col">
      {/* Brand Header */}
      <div className="p-6 border-b border-pink-500/30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-pink-600 font-bold text-lg">T</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Deutsche Telekom</h1>
            <p className="text-sm text-pink-300">AI Architect</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="p-4 border-b border-pink-500/30">
        <div className="text-sm text-pink-300 mb-2">System Status</div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-white">AI Services Online</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
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
                  ? "bg-pink-600 text-white shadow-lg" 
                  : "hover:bg-pink-600/20 text-gray-300 hover:text-white"
              )}>
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Active Model Display */}
      <div className="p-4 border-t border-pink-500/30">
        <div className="text-sm text-pink-300 mb-1">Active Model</div>
        <select className="w-full bg-gray-800 border border-pink-500/30 rounded px-3 py-2 text-sm text-white">
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