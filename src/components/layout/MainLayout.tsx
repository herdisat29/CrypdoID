import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Zap, Shield, Fingerprint, Trophy,
  Minimize2, Send, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';
import NewsTicker from '../common/NewsTicker';
import DashboardView from '../../features/dashboard/DashboardView';
import MissionsView from '../../features/missions/MissionsView';
import LearningPath from '../../features/learning-path/LearningPath';
import QuizView from '../../features/quiz/QuizView';
import SecurityScanner from '../../features/security/SecurityScanner';
import { type ChatMessage } from '../../services/geminiService';
import { useUIStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import mascot from '../../assets/mascot.jpg';
import mascotThinking from '../../assets/mascot-thinking.png';
import mascotThumbsup from '../../assets/mascot-thumbsup.jpg';
import { View } from '../../types';

interface MainLayoutProps {
  view: View;
  setView: (view: View) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  gasFee: number;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
  missionSyncKey: number;
}

export default function MainLayout({
  view,
  setView,
  messages,
  setMessages,
  input,
  setInput,
  isLoading,
  onSend,
  gasFee,
  isSidebarExpanded,
  setIsSidebarExpanded,
  missionSyncKey,
}: MainLayoutProps) {
  const { setShowLogoutConfirm, setShowLoginOverlay } = useUIStore();
  const location = useLocation();
  const [isFloatingChatOpen, setIsFloatingChatOpen] = useState(false);
  const miniChatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (miniChatScrollRef.current) {
      miniChatScrollRef.current.scrollTop = miniChatScrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isFloatingChatOpen]);

  const handleMiniSend = () => {
    if (input.trim()) {
      onSend();
    }
  };

  const handleMiniKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleMiniSend();
    }
  };

  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { id: 'missions', icon: <Trophy size={24} />, label: 'Missions' },
    { id: 'learning', icon: <Zap size={24} />, label: 'Learning Path' },
    { id: 'quiz', icon: <Fingerprint size={24} />, label: 'Kuis Profil' },
    { id: 'security', icon: <Shield size={24} />, label: 'Security' },
  ];



  return (
    <div className="flex h-screen w-full bg-deep-purple text-slate-300 font-sans overflow-hidden select-none" style={{ height: '100dvh' }}>
      <Sidebar
        view={view}
        setView={setView}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
      />

      <main
        className="flex-1 flex flex-col min-w-0 bg-deep-purple overflow-y-auto pb-0"
      >
        <DashboardHeader
          gasFee={gasFee}
          onNavigate={setView}
          onLogin={() => setShowLoginOverlay(true)}
          onLogout={() => setShowLogoutConfirm(true)}
        />

        <div className="flex-1 flex flex-col p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 flex flex-col"
            >
              <Routes location={location}>
                <Route path="/" element={<DashboardView setView={setView} />} />
                <Route path="/missions" element={<MissionsView missionSyncKey={missionSyncKey} onNavigate={setView} />} />
                <Route path="/learning" element={<LearningPath setView={setView} />} />
                <Route path="/quiz" element={<QuizView setView={setView} />} />
                <Route path="/security" element={<SecurityScanner />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>

        <NewsTicker />

        {/* Global Footer Area */}
        <footer className="shrink-0 px-6 pt-12 pb-32 md:pb-12 bg-[#080212]/80 border-t border-border-purple/40 flex flex-col items-center text-center gap-8 mt-12 relative overflow-hidden select-none">
          {/* Subtle background grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(126,34,206,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(126,34,206,0.02)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Premium Warning Card */}
          <div className="w-full max-w-2xl bg-red-950/20 border border-red-500/25 p-6 rounded-[2rem] relative overflow-hidden shadow-[0_0_25px_rgba(239,68,68,0.05)] backdrop-blur-sm z-10 group hover:border-red-500/40 transition-colors duration-300">
            {/* Absolute accent warning glow */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-red-500/10 blur-2xl rounded-full" />

            <h5 className="text-red-400 font-black mb-2.5 uppercase tracking-[0.25em] text-xs italic flex items-center justify-center gap-2">
              <span className="animate-pulse">⚠️</span> NOT FINANCIAL ADVICE
            </h5>
            <p className="text-slate-400 text-[11px] md:text-[13px] leading-relaxed italic font-medium">
              Semua konten di Mission Center hanya untuk tujuan edukasi. Trading crypto memiliki risiko tinggi.
              Sebut saja ini simulasi game, tapi duitnya beneran. <strong className="text-red-400 uppercase font-black tracking-wider">DYOR or Rekt!</strong>
            </p>
          </div>

          {/* Divider */}
          <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-border-purple/30 to-transparent my-1" />

          {/* Decorative Web3 Console Row */}
          <div className="w-full max-w-4xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 z-10">
            <p className="italic hover:text-slate-400 transition-colors">
              © 2026 CrypdoID Ecosystem. Part of the Web3 Revolution.
            </p>
            <div className="flex items-center gap-4 text-slate-600">
              <span className="flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
                SYSTEM SECURED // 22MS
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hover:text-slate-400 transition-colors cursor-pointer">Versi: v1.0.3</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating Bottom Navigation Bar for Mobile */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-surface-dark/95 border border-border-purple/50 backdrop-blur-md rounded-2xl flex items-center justify-around z-50 px-2 shadow-2xl shadow-black/80">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all relative",
              view === item.id
                ? "text-gold-accent"
                : "text-slate-500 hover:text-slate-300"
            )}
          >
            <div className={cn(
              "transition-transform",
              view === item.id && "scale-110 text-gold-accent"
            )}>
              {item.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-wider scale-95 leading-none">
              {item.id === 'quiz' ? 'Quiz' : item.id === 'security' ? 'Anti-Scam' : item.id === 'learning' ? 'Learn' : item.label}
            </span>
            {view === item.id && (
              <motion.div
                layoutId="active-indicator-mobile"
                className="absolute -bottom-1 w-6 h-[2px] bg-gold-accent rounded-full shadow-[0_0_8px_#facc15]"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isFloatingChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="flex fixed bottom-24 right-[5vw] md:bottom-28 md:right-8 w-[90vw] md:w-[380px] h-[65vh] md:h-[520px] bg-[#0f0718]/95 border border-vibrant-purple/40 backdrop-blur-md rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-[105] flex-col overflow-hidden text-left"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-border-purple/60 to-vibrant-purple/20 px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-vibrant-purple/40">
                    <img src={mascotThumbsup} alt="Senior" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 bg-emerald-500 border border-surface-dark rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse z-10" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-white italic uppercase tracking-wider leading-none">Senior AI Robot</h5>
                  <p className="text-[9px] text-emerald-400 font-extrabold uppercase mt-0.5 tracking-widest flex items-center gap-1">
                    <span>🟢</span> online bimbingan
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Collapse */}
                <button
                  onClick={() => setIsFloatingChatOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div
              ref={miniChatScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-black/15"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-4">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-vibrant-purple/30 shadow-lg shadow-vibrant-purple/20 bg-surface-dark p-0.5 animate-bounce">
                    <img src={mascotThumbsup} alt="Thumbs Up" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h6 className="text-white font-black italic text-sm uppercase leading-none">Halo, Senior! 👋</h6>
                    <p className="text-slate-400 text-[11px] font-medium leading-relaxed italic mt-2.5 max-w-[240px]">
                      Gue Senior AI Robot. Ada kesulitan memahami pelajaran crypto, blockchain, atau mau scan smart contract? Tanya gue sekarang!
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    {msg.role === 'user' ? (
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[9px] bg-slate-800 text-slate-400">
                        ME
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden border border-vibrant-purple/40 relative">
                        <img
                          src={isLoading && i === messages.length - 1 ? mascotThinking : mascot}
                          alt="Senior"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed",
                      msg.role === 'user'
                        ? "bg-surface-dark border border-border-purple text-slate-200"
                        : "bg-vibrant-purple/10 border border-vibrant-purple/30 text-slate-300 italic text-left"
                    )}>
                      <ReactMarkdown>{msg.message}</ReactMarkdown>
                    </div>
                  </motion.div>
                ))
              )}

              {isLoading && (
                <div className="flex gap-3 mr-auto animate-pulse select-none text-left">
                  <div className="w-7 h-7 rounded-lg flex-shrink-0 overflow-hidden border border-vibrant-purple/40 relative">
                    <img src={mascotThinking} alt="Thinking" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 size={10} className="animate-spin text-white" />
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-vibrant-purple/5 border border-vibrant-purple/20 text-slate-500 italic text-[11px]">
                    Senior lagi mikir...
                  </div>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-surface-dark border-t border-white/5 flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleMiniKeyDown}
                disabled={isLoading}
                type="text"
                autoFocus
                placeholder="Tanya soal crypto, smart contract..."
                className="flex-1 h-10 bg-black/40 border border-border-purple rounded-xl px-4 text-xs text-slate-300 focus:outline-none focus:border-vibrant-purple transition-all placeholder:text-slate-600"
              />
              <button
                onClick={handleMiniSend}
                disabled={isLoading || !input.trim()}
                className="w-9 h-9 bg-vibrant-purple hover:bg-gold-accent hover:text-black text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating AI Senior Mascot Chat Widget Button */}
      <div
        className={cn(
          "fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100] cursor-pointer flex items-center justify-center",
          // Mobile: only show on dashboard
          location.pathname === '/' ? "flex" : "hidden md:flex"
        )}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (messages.length === 0) {
              setMessages([{ role: 'model', message: 'Ada apa Senior? Ada kesulitan memahami pelajaran atau mau nanya soal pasar crypto hari ini? Gue siap bimbing lo!' }]);
            }
            setIsFloatingChatOpen(!isFloatingChatOpen);
          }}
          className="relative shrink-0 shadow-[0_0_20px_rgba(126,34,206,0.4)] group rounded-full transition-all duration-300 hover:shadow-[0_0_25px_rgba(250,204,21,0.3)]"
        >
          {/* Tooltip Hover */}
          <div className="absolute top-1/2 -translate-y-1/2 right-full mr-4 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 bg-black/80 backdrop-blur-md border border-vibrant-purple/40 text-white text-[10px] font-black italic uppercase px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(126,34,206,0.3)] whitespace-nowrap">
            Tanya AI Senior
          </div>

          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-vibrant-purple/60 group-hover:border-gold-accent bg-surface-dark p-0.5 relative">
            <div className="relative w-full h-full rounded-full overflow-hidden group-hover:scale-110 transition-transform duration-300">
              <img src={mascotThinking} alt="Senior Thinking" className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 opacity-100 group-hover:opacity-0 pointer-events-none" />
              <img src={mascotThumbsup} alt="Senior Thumbsup" className="absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none" />
            </div>
          </div>
          <span className="absolute top-0 left-0 w-3.5 h-3.5 md:w-4 md:h-4 bg-emerald-500 border-2 border-deep-purple rounded-full shadow-[0_0_5px_rgba(16,185,129,0.8)] animate-pulse z-10 pointer-events-none" />
        </motion.div>
      </div>
    </div>
  );
}
