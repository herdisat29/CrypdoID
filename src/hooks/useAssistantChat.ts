import { useState, useCallback, useEffect } from 'react';
import { type ChatMessage } from '../services/geminiService';
import { getGroqResponse } from '../services/groqService';
import { checkTokenSecurity, type TokenSecurityResult } from '../services/tokenSecurity';

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('crypdo_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('crypdo_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('crypdo_chat_history');
        if (!saved) {
          setMessages([]);
        }
      } catch (e) {
        setMessages([]);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSend = useCallback(async (text: string = input) => {
    if (!text.trim()) return;
    
    // Anti-spam 1.5s rate limiting check
    const now = Date.now();
    if (now - lastSentTime < 1500) {
      setMessages(prev => [
        ...prev,
        { role: 'user', message: text },
        { 
          role: 'model', 
          message: "Sabar dulu Senior! Ketikan lo cepet banget kayak high-frequency trader. Kasih gue waktu 1.5 detik buat cooling down bentar ya! 🥶💨" 
        }
      ]);
      setInput('');
      return;
    }
    
    if (isLoading) return;

    setLastSentTime(now);
    const userMessage: ChatMessage = { role: 'user', message: text };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let securityResult: TokenSecurityResult | null = null;
    let textToSubmit = text;

    // Auto-detect contract address
    const caMatch = text.match(/(0x[a-fA-F0-9]{40})/i);
    if (caMatch) {
      const ca = caMatch[1];
      try {
        const isBsc = text.toLowerCase().includes('bsc') || text.toLowerCase().includes('bnb');
        const chainId = isBsc ? 56 : 1;
        const scan = await checkTokenSecurity(ca, chainId);
        securityResult = scan;
        textToSubmit = `${text}\n\n[CONTEXT REPORT: Sistem mendeteksi contract address ${ca} dan mengembalikan data real-time scan berikut dari node blockchain:
        Token Name: ${scan.tokenName}
        Token Symbol: ${scan.tokenSymbol}
        Chain: ${scan.chain}
        Overall Risk Level: ${scan.overallRisk}
        Risk Score: ${scan.riskScore}/100
        Buy Tax: ${scan.buyTax}%
        Sell Tax: ${scan.sellTax}%
        Is Honeypot: ${scan.isHoneypot ? 'YES' : 'NO'}
        Has Mint Capability: ${scan.hasMint ? 'YES' : 'NO'}
        Has Blacklist Capability: ${scan.hasBlacklist ? 'YES' : 'NO'}
        Owner Can Change Balance: ${scan.ownerCanChangeBalance ? 'YES' : 'NO'}
        Warnings: ${scan.warnings.join(', ')}

        Tolong jelaskan data laporan on-chain ini secara asik, santai, dan penuh slang anak muda Indonesia/Jaksel/crypto community! Berikan saran yang protektif dan edukatif, soroti red flags yang bahaya jika ada, dan jangan sebutkan kode [CONTEXT REPORT...] ini secara mentah-mentah ke user. Buat respons kamu personal dan interaktif!]`;
      } catch (err) {
        console.warn("Auto check token security in chat failed:", err);
      }
    }

    try {
      const response = await getGroqResponse(newMessages, textToSubmit);
      setMessages(prev => [...prev, { 
        role: 'model', 
        message: response, 
        securityResult: securityResult ?? undefined 
      }]);
    } catch (error) {
      console.error("Groq Error:", error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        message: "Waduh, sori banget nih Senior! Lagi ada hambatan komunikasi sama API. Coba tanyain lagi dalam beberapa detik ya. 🙏" 
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, lastSentTime, messages]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem('crypdo_chat_history');
  }, []);

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    handleSend,
    clearHistory
  };
}
