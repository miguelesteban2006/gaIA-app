import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { simulateTranscription } from "@/lib/audioUtils";
import { analyzeSentiment } from "@/lib/sentimentAnalysis";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [liveTranscription, setLiveTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("POST", "/api/upload-audio", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Grabación procesada",
        description: "Tu grabación ha sido analizada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sentiment-data"] });
      
      // Reset state
      setAudioBlob(null);
      setAudioUrl("");
      setLiveTranscription("");
      setIsProcessing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to process recording",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  useEffect(() => {
    if (isRecording && timerRef.current === null) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Start processing
        processRecording(blob);
      };
      
      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscription("Escuchando...");
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not access microphone",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const playRecording = () => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  };

  const processRecording = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Simulate transcription (in real app, this would use Vosk.js or similar)
      const transcription = await simulateTranscription(blob);
      setLiveTranscription(transcription);
      
      // Analyze sentiment
      const sentiment = analyzeSentiment(transcription);
      
      // Calculate additional metadata
      const duration = recordingTime;
      const wordCount = transcription.split(' ').filter(word => word.length > 0).length;
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('transcription', transcription);
      formData.append('sentimentScore', sentiment.score.toString());
      formData.append('sentimentLabel', sentiment.label);
      formData.append('duration', duration.toString());
      formData.append('wordCount', wordCount.toString());
      
      // Upload to server
      uploadMutation.mutate(formData);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process recording",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900">Nueva Grabación</h3>
          <div className="flex items-center space-x-2 text-sm text-slate-500">
            <i className={`fas fa-circle ${isRecording ? 'text-red-500 animate-pulse' : 'text-green-500'}`}></i>
            <span>{isRecording ? 'Grabando...' : 'Listo para grabar'}</span>
          </div>
        </div>
        
        <div className="text-center py-8">
          {/* Recording Visualizer */}
          <div className="mb-6">
            <div className="flex justify-center items-end space-x-1 h-16">
              {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 rounded-full transition-all duration-200 ${
                    isRecording 
                      ? `bg-primary animate-pulse h-${4 + (i * 2)}` 
                      : 'bg-slate-300 h-4'
                  }`}
                  style={{
                    animationDelay: `${i * 100}ms`,
                    height: isRecording ? `${16 + (i * 8)}px` : '16px'
                  }}
                ></div>
              ))}
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <Button
              onClick={toggleRecording}
              disabled={isProcessing}
              className={`rounded-full w-16 h-16 shadow-lg transition-all duration-200 transform hover:scale-105 ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'} text-xl`}></i>
            </Button>
            
            <Button
              variant="secondary"
              onClick={playRecording}
              disabled={!audioUrl || isRecording || isProcessing}
              className="rounded-full w-12 h-12"
            >
              <i className="fas fa-play text-sm"></i>
            </Button>
          </div>

          {/* Recording Status */}
          <div className="text-center">
            <p className="text-slate-600 mb-2">
              {isRecording ? 'Grabando...' : 'Presiona el botón para comenzar a grabar'}
            </p>
            <div className="text-sm text-slate-500">
              <span>{formatTime(recordingTime)}</span> / 05:00 máx.
            </div>
          </div>

          {/* Live Transcription Preview */}
          <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Transcripción en tiempo real:</h4>
            <p className="text-slate-600 italic min-h-[3rem]">
              {liveTranscription || "La transcripción aparecerá aquí mientras hablas..."}
            </p>
            {isProcessing && (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                <span className="text-sm text-slate-500">Procesando...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden audio element for playback */}
        <audio ref={audioRef} src={audioUrl} />
      </CardContent>
    </Card>
  );
}
