import { motion } from "motion/react";
import { Shield, Zap, Flame, X, Info, GraduationCap } from "lucide-react";
import { useAuth } from "./AuthContext";
import { useEffect, useState } from 'react';
import { useWalletStore } from "../../store/walletStore";
import { cn } from "../../lib/utils";
import logo from "../../assets/logo-clean.png";
import { useNavigate } from "react-router-dom";
import { useUIStore } from "../../store/uiStore";

interface LoginPageProps {
  onClose?: () => void;
}

export default function LoginPage({ onClose }: LoginPageProps) {
  const { user, signInWithGoogle, signInWithTwitter } = useAuth();
  const mockAddress = useWalletStore(state => state.mockAddress);
  const setMockAddress = useWalletStore(state => state.setMockAddress);
  const navigate = useNavigate();
  const setShowOnboarding = useUIStore(state => state.setShowOnboarding);

  const isDev = import.meta.env.DEV;
  const [sandboxCredits, setSandboxCredits] = useState(() => {
    const saved = localStorage.getItem('crypdo_sandbox_credits');
    return saved !== null ? parseInt(saved) : 5;
  });
  useEffect(() => {
    if (user || mockAddress) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, mockAddress, onClose]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // If no onClose (mandatory wall), we could redirect to a public view or just refresh
      // For now, let's just make it do nothing or show a hint if you're not logged in
      console.log("Senior, login dulu ya biar sinkron datanya!");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto",
        onClose ? "bg-black/80 backdrop-blur-xl" : "bg-[#05010a]"
      )}
    >
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-vibrant-purple/20 blur-[150px] rounded-full" />
        <div className="absolute -bottom-1/4 -right-1/4 w-full h-full bg-gold-accent/5 blur-[150px] rounded-full" />
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0f0718] border border-white/10 rounded-[2.5rem] max-w-4xl w-full max-h-[95vh] overflow-y-auto shadow-[0_0_80px_rgba(126,34,206,0.2)] flex flex-col md:flex-row relative z-10 scrollbar-thin"
      >
        {/* Left Side: Auth Options */}
        <div className="flex-1 p-6 md:p-8 border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-vibrant-purple/5 to-transparent">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-vibrant-purple/20 border border-vibrant-purple/30 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(126,34,206,0.2)] overflow-hidden">
              <img src={logo} alt="CrypdoID Logo" className="w-full h-full object-cover p-1" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">CONNECT</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">CrypdoID Network</p>
            </div>
          </div>

          {/* FREE feature highlight */}
          <div className="mb-6 rounded-2xl bg-vibrant-purple/10 border border-vibrant-purple/30 p-4 flex items-center gap-4">
            <div className="text-2xl flex-shrink-0">🛡️</div>
            <div className="flex-1 min-w-0">
              <p className="text-vibrant-purple font-black text-[11px] uppercase tracking-wider">Scam Radar — Free</p>
              <p className="text-slate-300 text-[11px] font-semibold mt-0.5 leading-snug">Cek smart contract & risk score token, gratis tanpa daftar!</p>
            </div>
            <button
              onClick={() => {
                setShowOnboarding(false);
                navigate('/security');
                if (onClose) onClose();
              }}
              className="flex-shrink-0 px-3 py-2 bg-vibrant-purple text-white text-[10px] font-black uppercase rounded-xl hover:bg-purple-500 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(126,34,206,0.4)]"
            >
              Coba →
            </button>
          </div>

          <div className="space-y-5">
            {user ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4 italic shadow-lg">
                <div className="relative">
                  <img src={user.photoURL || "https://www.google.com/favicon.ico"} className="w-10 h-10 rounded-full border-2 border-emerald-500" alt="G" />
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-[#0f0718]">
                    <Zap size={10} fill="white" className="text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-black text-sm uppercase leading-none">Authenticated</h4>
                  <p className="text-white text-xs font-bold mt-1">{user.displayName || user.email || (user.uid?.startsWith('0x') ? `${user.uid.slice(0,6)}...${user.uid.slice(-4)}` : 'Senior')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* === PERMANENT ACCOUNT SECTION === */}
                <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-3xl p-6 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✨</span>
                    <h3 className="font-black text-emerald-400 text-lg uppercase tracking-tight italic">BUAT AKUN UTAMA</h3>
                  </div>
                  <p className="text-emerald-500/80 text-[11px] font-bold mb-5 leading-snug">
                    Simpan progress, XP, dan badge lo dengan aman. Lanjut belajar dari perangkat mana pun.
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={signInWithGoogle}
                      className="w-full bg-white text-black font-black py-3 rounded-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl italic tracking-tight"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5 rounded-full border border-slate-200" alt="G" />
                      LOGIN WITH GOOGLE
                    </button>
                    <button
                      onClick={signInWithTwitter}
                      className="w-full bg-black text-white border border-white/20 font-black py-3 rounded-xl flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95 transition-all shadow-xl italic tracking-tight"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      LOGIN WITH X
                    </button>
                  </div>
                </div>

                {/* === SANDBOX SECTION === */}
                <div className="border border-amber-500/30 bg-amber-500/5 rounded-3xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.05)]">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-amber-400 text-lg uppercase tracking-tight italic">MODE TAMU</h3>
                  </div>
                  
                  <p className="text-amber-500/80 text-[11px] font-bold mb-5 leading-snug">
                    Coba CrypdoID tanpa daftar. Progress hanya tersimpan di perangkat ini.
                  </p>

                  <button
                    disabled={!isDev && sandboxCredits <= 0}
                    onClick={() => {
                      if (!isDev && sandboxCredits <= 0) return;
                      
                      if (!isDev) {
                        const newCredits = sandboxCredits - 1;
                        setSandboxCredits(newCredits);
                        localStorage.setItem('crypdo_sandbox_credits', String(newCredits));
                      }

                      const mockAddr = '0x' + Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('');
                      setMockAddress(mockAddr);
                      if (onClose) onClose();
                    }}
                    className={cn(
                      "w-full font-black py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all italic tracking-widest text-xs",
                      (!isDev && sandboxCredits <= 0) 
                        ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                        : "text-amber-950 bg-amber-400 hover:bg-amber-300 active:scale-95 shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {!isDev && sandboxCredits <= 0 ? "⚠️ JATAH HABIS" : "⚡ COBA SEKARANG"}
                    </span>
                  </button>

                  {!isDev && sandboxCredits <= 0 ? (
                    <p className="text-[10px] text-center mt-3 text-red-400 font-bold leading-tight">
                      Jatah uji coba lo sudah habis (0/5).<br/>Login dengan Google/X untuk progress permanen + mint NFT asli.
                    </p>
                  ) : (
                    <p className="text-[10px] text-center mt-3 text-amber-500/70 font-black tracking-widest uppercase">
                      {isDev ? "Credit: ∞ (DEV)" : `Jatah Uji Coba: ${sandboxCredits}/5`}
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-[11px] font-black text-slate-500 italic px-4 mt-8">
              "Skill dulu. Hype belakangan."
            </p>
          </div>

          <p className="text-[9px] font-bold text-slate-600 mt-8 italic leading-relaxed text-center">
            Dengan login, lo setuju sama Terms & Privacy Policy CrypdoID. <br/> No debat, Senior.
          </p>
        </div>

        {/* Right Side: Info / Benefits */}
        <div className="hidden md:flex flex-1 p-8 bg-black/30 flex-col justify-center">
          <h3 className="text-lg md:text-xl font-black text-slate-100 italic mb-6 tracking-widest leading-tight uppercase text-center md:text-left drop-shadow-md">Kenapa Perlu Login?</h3>
          
          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 border border-emerald-500/20">
                <Shield size={22} />
              </div>
              <div>
                <h4 className="text-white font-black italic text-lg leading-none mb-1.5 tracking-tight uppercase">Identity Integrity</h4>
                <p className="text-slate-500 text-[13px] font-bold leading-relaxed italic">Profile lo aman & terenskripsi. Gak ada yang bisa utak-atik progress lo, Senior.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 shrink-0 border border-orange-500/20">
                <Flame size={22} />
              </div>
              <div>
                <h4 className="text-white font-black italic text-lg leading-none mb-1.5 tracking-tight uppercase">Masuk / Login</h4>
                <p className="text-slate-500 text-[13px] font-bold leading-relaxed italic">Cuma user yang synced yang bisa claim reward harian dan Mint NFT eksklusif.</p>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="w-12 h-12 bg-gold-accent/10 rounded-2xl flex items-center justify-center text-gold-accent shrink-0 border border-gold-accent/20">
                <GraduationCap size={22} />
              </div>
              <div>
                <h4 className="text-white font-black italic text-lg leading-none mb-1.5 tracking-tight uppercase">Career Path</h4>
                <p className="text-slate-500 text-[13px] font-bold leading-relaxed italic">Dapetin akses ke roadmap belajar level lanjut dan peluang karir di industri Web3.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-vibrant-purple/20 flex items-center justify-center text-vibrant-purple shrink-0">
               <Info size={16} />
            </div>
            <p className="text-[10px] text-slate-400 font-bold leading-tight italic uppercase tracking-wider">Login cuma butuh 5 detik. Gas terus jangan kasih kendor!</p>
          </div>
        </div>

        {/* Close Button - Moved to end for stacking order */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 bg-black/50 hover:bg-black p-2 rounded-full backdrop-blur-md text-white transition-colors z-[100] group flex items-center justify-center border border-white/10 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {!onClose && <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Stay as Guest</span>}
            <X size={20} />
          </div>
        </button>
      </motion.div>
    </motion.div>
  );
}
