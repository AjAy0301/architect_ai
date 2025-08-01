import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "@/types/agents";
import { formatDistanceToNow } from "date-fns";

export function RecentActivity() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ['/api/activities'],
  });

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'ticket_analyzed':
        return 'bg-agent-blue';
      case 'impact_completed':
        return 'bg-agent-green';
      case 'solution_completed':
        return 'bg-agent-green';
      case 'prd_completed':
        return 'bg-agent-orange';
      default:
        return 'bg-purple-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-dark-secondary border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-gray-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-600 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-dark-secondary border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <a href="#" className="text-agent-blue hover:text-blue-400 text-sm font-medium">
            View All
          </a>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full mt-2`}></div>
                <div className="flex-1">
                  <div className="text-sm">{activity.message}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {activity.createdAt ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }) : 'Just now'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8">
              No recent activity
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
