import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: number;
  change: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const colorClasses = {
  blue: 'bg-agent-blue/20 text-agent-blue',
  green: 'bg-agent-green/20 text-agent-green',
  orange: 'bg-agent-orange/20 text-agent-orange',
  purple: 'bg-purple-500/20 text-purple-400',
};

export function MetricsCard({ title, value, change, icon: Icon, color }: MetricsCardProps) {
  return (
    <Card className="bg-dark-secondary border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
            <Icon className="w-6 h-6" />
          </div>
          <span className="text-green-400 text-sm font-medium">{change}</span>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-gray-400 text-sm">{title}</div>
      </CardContent>
    </Card>
  );
}
