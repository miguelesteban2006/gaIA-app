import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const response = await fetch("/api/stats", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatSentiment = (score: number) => {
    return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-slate-200 rounded animate-pulse mb-2"></div>
                  <div className="h-6 bg-slate-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-microphone-alt text-blue-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Total Grabaciones</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats?.totalRecordings || 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-smile text-green-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Sentimiento Promedio</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats?.avgSentiment ? formatSentiment(stats.avgSentiment) : '0.00'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-purple-600"></i>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-slate-600">Tiempo Total</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats?.totalDuration ? formatDuration(stats.totalDuration) : '0m'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
