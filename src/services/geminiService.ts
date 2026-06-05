import { TokenSecurityResult } from './tokenSecurity';

export interface ChatMessage {
  role: 'user' | 'model';
  message: string;
  securityResult?: TokenSecurityResult;
}

export const getGeminiResponse = async (
  history: ChatMessage[],
  message: string
): Promise<string> => {
  const response = await fetch('/api/gemini', {
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
  return data.text ?? "Sori Senior, sinyal lagi bapuk. Coba tanya lagi ya!";
};
