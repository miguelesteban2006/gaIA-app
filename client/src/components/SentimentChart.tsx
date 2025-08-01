import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

export default function SentimentChart() {
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  const { data: sentimentData, isLoading } = useQuery({
    queryKey: ["/api/sentiment-data", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/sentiment-data?days=${selectedPeriod}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch sentiment data");
      return response.json();
    },
  });

  const formatData = (data: any[]) => {
    if (!data) return [];
    return data.map(item => ({
      date: new Date(item.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      sentiment: parseFloat(item.sentiment || 0),
    }));
  };

  const getSentimentColor = (value: number) => {
    if (value > 0.3) return '#10b981'; // green
    if (value < -0.3) return '#ef4444'; // red
    return '#f59e0b'; // yellow
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-slate-700">{label}</p>
          <p className="text-sm" style={{ color: getSentimentColor(value) }}>
            Sentimiento: {value > 0 ? '+' : ''}{value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Análisis de Sentimientos</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedPeriod === 7 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(7)}
            >
              7d
            </Button>
            <Button
              variant={selectedPeriod === 30 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(30)}
            >
              30d
            </Button>
            <Button
              variant={selectedPeriod === 90 ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(90)}
            >
              90d
            </Button>
          </div>
        </div>
        
        <div className="h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatData(sentimentData)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(207, 90%, 54%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b"
                  fontSize={12}
                />
                <YAxis 
                  domain={[-1, 1]}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sentiment"
                  stroke="hsl(207, 90%, 54%)"
                  strokeWidth={3}
                  fill="url(#sentimentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Chart Legend */}
        <div className="flex items-center justify-center space-x-6 mt-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Positivo (0.3+)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Neutral (-0.3 a 0.3)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-slate-600">Negativo (-0.3-)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
