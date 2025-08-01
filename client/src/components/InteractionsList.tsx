import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function InteractionsList() {
  const [limit, setLimit] = useState(10);

  const { data: interactions, isLoading } = useQuery({
    queryKey: ["/api/interactions", limit],
    queryFn: async () => {
      const response = await fetch(`/api/interactions?limit=${limit}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch interactions");
      return response.json();
    },
  });

  const getSentimentBadge = (score: number, label: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    if (label === 'positive') {
      return `${baseClasses} bg-green-100 text-green-800`;
    } else if (label === 'negative') {
      return `${baseClasses} bg-red-100 text-red-800`;
    } else {
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  const getSentimentIcon = (label: string) => {
    if (label === 'positive') return 'fa-smile';
    if (label === 'negative') return 'fa-frown';
    return 'fa-meh';
  };

  const getSentimentText = (label: string) => {
    if (label === 'positive') return 'Positivo';
    if (label === 'negative') return 'Negativo';
    return 'Neutral';
  };

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadMore = () => {
    setLimit(prev => prev + 10);
  };

  if (isLoading && limit === 10) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Interacciones Recientes</h3>
          <button className="text-primary hover:text-primary/80 text-sm font-medium">
            Ver todas <i className="fas fa-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-slate-200">
        {interactions && interactions.length > 0 ? (
          interactions.map((interaction: any) => (
            <div key={interaction.id} className="px-6 py-4 hover:bg-slate-50 transition-colors duration-150">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 p-0"
                      onClick={() => playAudio(interaction.audioUrl)}
                    >
                      <i className="fas fa-play text-xs text-slate-600"></i>
                    </Button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm text-slate-500">
                        {formatDistanceToNow(new Date(interaction.createdAt), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                      <span className={getSentimentBadge(interaction.sentimentScore, interaction.sentimentLabel)}>
                        <i className={`fas ${getSentimentIcon(interaction.sentimentLabel)} mr-1`}></i>
                        {getSentimentText(interaction.sentimentLabel)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {interaction.sentimentScore > 0 ? '+' : ''}{interaction.sentimentScore.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-slate-900 text-sm">
                      "{interaction.transcription}"
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {formatDuration(interaction.duration)}
                      </span>
                      <span>
                        <i className="fas fa-font mr-1"></i>
                        {interaction.wordCount} palabras
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600 p-1">
                    <i className="fas fa-ellipsis-v"></i>
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="px-6 py-8 text-center">
            <i className="fas fa-microphone-alt text-slate-300 text-4xl mb-4"></i>
            <p className="text-slate-500">No hay grabaciones aún</p>
            <p className="text-sm text-slate-400">Comienza grabando tu primera interacción</p>
          </div>
        )}
      </div>
      
      {interactions && interactions.length > 0 && interactions.length >= limit && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <Button
            variant="ghost"
            onClick={loadMore}
            className="w-full text-slate-600 hover:text-slate-800"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-400 mr-2"></div>
                Cargando...
              </>
            ) : (
              "Cargar más interacciones"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}
