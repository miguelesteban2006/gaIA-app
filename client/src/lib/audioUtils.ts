// Simulated transcription function (in production, use Vosk.js or similar)
export async function simulateTranscription(audioBlob: Blob): Promise<string> {
  // In a real implementation, this would use Vosk.js or send to a transcription service
  // For now, we'll simulate with some realistic Spanish phrases
  
  const sampleTranscriptions = [
    "Estoy muy contento con los resultados del proyecto. El equipo ha trabajado excelentemente y superamos todas las expectativas.",
    "Necesitamos revisar algunos aspectos del informe. Hay varios puntos que requieren más análisis antes de continuar.",
    "Estoy bastante frustrado con los retrasos. Esto está afectando negativamente nuestros planes y necesitamos una solución urgente.",
    "Me siento optimista sobre las próximas oportunidades. Creo que vamos por buen camino y los resultados serán positivos.",
    "La reunión de hoy fue muy productiva. Logramos aclarar muchas dudas y establecer un plan claro para seguir adelante.",
    "Tengo algunas preocupaciones sobre el presupuesto. Es importante que evaluemos todas las opciones antes de tomar una decisión.",
    "Excelente trabajo en la presentación. Los clientes quedaron muy impresionados con nuestra propuesta y el nivel de detalle.",
    "Creo que deberíamos considerar alternativas. La estrategia actual no está dando los resultados que esperábamos.",
    "Estoy emocionado por comenzar este nuevo proyecto. Las posibilidades son infinitas y el equipo está muy motivado.",
    "La situación requiere atención inmediata. No podemos permitir que estos problemas se prolonguen más tiempo."
  ];
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Return a random transcription
  return sampleTranscriptions[Math.floor(Math.random() * sampleTranscriptions.length)];
}

// Audio visualization utilities
export function createAudioVisualizer(canvas: HTMLCanvasElement, audioContext: AudioContext, stream: MediaStream) {
  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaStreamSource(stream);
  
  source.connect(analyser);
  
  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  
  const canvasCtx = canvas.getContext('2d')!;
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  
  function draw() {
    requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    canvasCtx.fillStyle = 'rgb(248, 250, 252)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    
    const barWidth = (WIDTH / bufferLength) * 2.5;
    let barHeight;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      barHeight = (dataArray[i] / 255) * HEIGHT;
      
      canvasCtx.fillStyle = `hsl(207, 90%, ${50 + (barHeight/HEIGHT) * 20}%)`;
      canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  draw();
  
  return () => {
    source.disconnect();
  };
}
