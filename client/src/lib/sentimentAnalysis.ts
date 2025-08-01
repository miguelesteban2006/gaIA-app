// Simulated sentiment analysis (in production, use Hugging Face API or similar)
export interface SentimentResult {
  score: number; // -1 to 1 range
  label: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1 range
}

const positiveWords = [
  'excelente', 'genial', 'fantástico', 'increíble', 'perfecto', 'maravilloso',
  'contento', 'feliz', 'alegre', 'satisfecho', 'optimista', 'entusiasmado',
  'emocionado', 'impresionado', 'positivo', 'bueno', 'bien', 'éxito',
  'logro', 'victoria', 'triunfo', 'superamos', 'excelentemente', 'productiva'
];

const negativeWords = [
  'terrible', 'horrible', 'pésimo', 'malo', 'frustrado', 'molesto',
  'preocupado', 'triste', 'decepcionado', 'negativo', 'problema', 'error',
  'retrasos', 'afectando', 'urgente', 'preocupaciones', 'problemas',
  'atención', 'inmediata', 'permitir', 'prolonguen'
];

const neutralWords = [
  'revisar', 'aspectos', 'análisis', 'continuar', 'considerar', 'alternativas',
  'estrategia', 'evaluemos', 'opciones', 'decisión', 'situación', 'requiere'
];

export function analyzeSentiment(text: string): SentimentResult {
  if (!text || text.trim().length === 0) {
    return {
      score: 0,
      label: 'neutral',
      confidence: 1
    };
  }

  const words = text.toLowerCase().split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;

  words.forEach(word => {
    // Remove punctuation
    const cleanWord = word.replace(/[^\w]/g, '');
    
    if (positiveWords.some(pw => cleanWord.includes(pw) || pw.includes(cleanWord))) {
      positiveCount++;
    } else if (negativeWords.some(nw => cleanWord.includes(nw) || nw.includes(cleanWord))) {
      negativeCount++;
    } else if (neutralWords.some(neu => cleanWord.includes(neu) || neu.includes(cleanWord))) {
      neutralCount++;
    }
  });

  const totalSentimentWords = positiveCount + negativeCount + neutralCount;
  
  if (totalSentimentWords === 0) {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0.5
    };
  }

  // Calculate weighted score
  const positiveWeight = positiveCount / totalSentimentWords;
  const negativeWeight = negativeCount / totalSentimentWords;
  
  let score = positiveWeight - negativeWeight;
  
  // Add some randomization to make it more realistic
  score += (Math.random() - 0.5) * 0.3;
  
  // Clamp to -1 to 1 range
  score = Math.max(-1, Math.min(1, score));
  
  let label: 'positive' | 'neutral' | 'negative';
  if (score > 0.3) {
    label = 'positive';
  } else if (score < -0.3) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  const confidence = Math.min(0.95, 0.5 + Math.abs(score) * 0.5);

  return {
    score: parseFloat(score.toFixed(2)),
    label,
    confidence: parseFloat(confidence.toFixed(2))
  };
}

// Simulated Hugging Face API call (for future implementation)
export async function analyzeWithHuggingFace(text: string, apiKey?: string): Promise<SentimentResult> {
  // In production, this would call the Hugging Face API
  // For now, we'll use our simulated analysis
  return analyzeSentiment(text);
}
