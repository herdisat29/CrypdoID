import { useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { type ChatMessage } from '../../services/geminiService';
import mascot from '../../assets/mascot.jpg';

interface AssistantChatViewProps {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: (text?: string) => void;
}

export default function AssistantChatView({
  messages,
  input,
  setInput,
  isLoading,
  onSend,
}: AssistantChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0">
      {/* Scrollable conversation bubble arena */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-6 pb-6 pr-2 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {msg.role === 'user' ? (
              <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[10px] bg-slate-800 text-slate-400">
                ME
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden border border-vibrant-purple/40 shadow-md">
                <img src={mascot} alt="Senior" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex flex-col gap-2 max-w-full">
              <div className={cn(
                "p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                msg.role === 'user'
                  ? "bg-surface-dark border border-border-purple text-slate-200"
                  : "bg-vibrant-purple/10 border border-vibrant-purple/30 text-slate-300 italic animate-fadeIn text-left"
              )}>
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>

              {/* Quick Scan Visual Widget */}
              {msg.role === 'model' && msg.securityResult && (
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-[#121021]/95 border border-border-purple rounded-2xl p-4 space-y-3 max-w-sm md:max-w-md shadow-2xl relative overflow-hidden mt-1 text-slate-200 select-none text-left"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20 bg-vibrant-purple rounded-full" />

                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] text-vibrant-purple font-black uppercase tracking-widest">LIVE SCAN REPORT</span>
                        {msg.securityResult.isSimulated && (
                          <span className="text-[7px] bg-yellow-500/10 text-yellow-500 px-1.5 py-0.5 rounded font-black uppercase">Simulated</span>
                        )}
                      </div>
                      <h5 className="font-black text-white italic text-sm leading-tight mt-0.5">
                        {msg.securityResult.tokenName} ({msg.securityResult.tokenSymbol})
                      </h5>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] text-slate-500 font-bold uppercase">Risk Score</p>
                      <p className={cn(
                        "font-black text-base italic",
                        msg.securityResult.overallRisk === 'HIGH' ? 'text-red-500' : msg.securityResult.overallRisk === 'MEDIUM' ? 'text-yellow-500' : 'text-emerald-500'
                      )}>
                        {msg.securityResult.riskScore}/100
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="bg-black/35 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-slate-500 font-bold block uppercase tracking-wide text-[8px]">Tax (Buy/Sell)</span>
                      <span className="text-slate-200 font-black">{msg.securityResult.buyTax}% / {msg.securityResult.sellTax}%</span>
                    </div>
                    <div className="bg-black/35 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-slate-500 font-bold block uppercase tracking-wide text-[8px]">Honeypot Level</span>
                      <span className={cn("font-black", msg.securityResult.isHoneypot ? "text-red-500" : "text-emerald-400")}>
                        {msg.securityResult.isHoneypot ? "☠️ HONEYPOT" : "🟢 PASS"}
                      </span>
                    </div>
                    <div className="bg-black/35 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-slate-500 font-bold block uppercase tracking-wide text-[8px]">Mint Security</span>
                      <span className={cn("font-black", msg.securityResult.hasMint ? "text-red-500" : "text-emerald-400")}>
                        {msg.securityResult.hasMint ? "⚠️ DETECTED" : "🟢 SAFE"}
                      </span>
                    </div>
                    <div className="bg-black/35 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <span className="text-slate-500 font-bold block uppercase tracking-wide text-[8px]">Source Chain</span>
                      <span className="text-slate-300 font-black uppercase italic">{msg.securityResult.chain}</span>
                    </div>
                  </div>

                  {msg.securityResult.warnings && msg.securityResult.warnings.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl text-[9px] text-red-300 space-y-0.5">
                      <p className="font-black uppercase tracking-wider text-[7px] text-red-400 flex items-center gap-1">⚠️ CORE WARNINGS</p>
                      <p className="font-semibold line-clamp-2 leading-snug">{msg.securityResult.warnings[0]}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 mr-auto animate-pulse select-none text-left">
            <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden border border-vibrant-purple/40 relative">
              <img src={mascot} alt="Senior" className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <Loader2 size={12} className="animate-spin text-white" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-vibrant-purple/5 border border-vibrant-purple/20 text-slate-500 italic text-sm">
              Senior lagi mikir...
            </div>
          </div>
        )}
      </div>

      <footer className="pt-4 flex flex-col gap-4">
        <div className="relative group">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Tanya soal fundamental Web3..."
            className="w-full h-14 bg-surface-dark border border-border-purple rounded-2xl pl-6 pr-16 text-sm text-slate-300 focus:outline-none focus:border-vibrant-purple transition-all"
          />
          <button
            onClick={() => onSend()}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 w-10 h-10 bg-vibrant-purple text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
}
