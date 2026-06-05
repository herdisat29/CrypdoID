import { type ChatMessage } from './geminiService';
import { getGeminiResponse } from './geminiService';

export const getGroqResponse = async (
  history: ChatMessage[],
  message: string
): Promise<string> => {
  try {
    const response = await fetch('/api/groq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: history.map(h => ({ role: h.role, message: h.message })),
        message,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(errData.error ?? `Server responded with status ${response.status}`);
    }

    const data = await response.json() as { text?: string };
    return data.text ?? "Sori Senior, Groq lagi nge-blank. Coba tanya lagi ya!";
  } catch (error) {
    console.error("Groq Chat Error, falling back to Gemini:", error);
    // Fallback to Gemini if Groq fails
    return await getGeminiResponse(history, message);
  }
};
