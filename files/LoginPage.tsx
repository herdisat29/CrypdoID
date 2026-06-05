import { motion } from "motion/react";
import { Shield, Zap, X } from "lucide-react";
import { useAuth } from "./AuthContext";
import WalletLoginButton from "../../components/auth/WalletLoginButton";
import { useWalletStore } from "../../store/walletStore";
import { useEffect } from 'react';
import { cn } from "../../lib/utils";
import logo from "../../assets/logo-clean.png";

interface LoginPageProps {
  onClose?: () => void;
}

export default function LoginPage({ onClose }: LoginPageProps) {
  const { user, signInWithGoogle } = useAuth();
  const mockAddress = useWalletStore(state => state.mockAddress);
  const isRealConnected = useWalletStore(state => state.isRealConnected);
  const isConnected = !!mockAddress || isRealConnected;

  useEffect(() => {
    if (user || mockAddress) {
      const timer = setTimeout(() => { onClose?.(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, mockAddress, onClose]);

  const handleClose = () => { onClose?.(); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "fixed inset-0 z-[200] flex items-center justify-center p-4",
        onClose ? "bg-black/80 backdrop-blur-xl" : "bg-[#05010a]"
      )}
    >
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-1/3 -left-1/4 w-[600px] h-[600px] bg-vibrant-purple/15 blur-[160px] rounded-full" />
        <div className="absolute -bottom-1/3 -right-1/4 w-[400px] h-[400px] bg-gold-accent/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ scale: 0.93, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative z-10 bg-[#0f0718] border border-white/10 rounded-[2rem] w-full max-w-md shadow-[0_0_80px_rgba(126,34,206,0.25)] overflow-hidden"
      >
        {/* Close */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all z-10 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Top: Logo + headline */}
        <div className="px-7 pt-8 pb-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-vibrant-purple/20 border border-vibrant-purple/30 rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_12px_rgba(126,34,206,0.3)]">
              <img src={logo} alt="CrypdoID" className="w-full h-full object-cover p-0.5" />
            </div>
            <div>
              <p className="text-white font-black text-sm uppercase tracking-wider leading-none">CrypdoID</p>
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">Web3 Learning Platform</p>
            </div>
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight leading-tight">
            Cek Scam Project<br />
            <span className="text-vibrant-purple drop-shadow-[0_0_10px_rgba(126,34,206,0.6)]">Gratis, Tanpa Login</span>
          </h2>
          <p className="text-slate-400 text-xs font-semibold mt-2 leading-relaxed">
            Scam Radar bisa langsung dipakai. Login untuk unlock learning path, missions, dan rewards.
          </p>
        </div>

        {/* FREE feature highlight */}
        <div className="mx-7 mt-5 mb-4 rounded-2xl bg-vibrant-purple/8 border border-vibrant-purple/25 p-4 flex items-center gap-4">
          <div className="text-2xl flex-shrink-0">🛡️</div>
          <div className="flex-1 min-w-0">
            <p className="text-vibrant-purple font-black text-xs uppercase tracking-wider">Scam Radar — Free</p>
            <p className="text-slate-300 text-xs font-semibold mt-0.5 leading-snug">Cek contract token, red flags, risk score — langsung tanpa daftar</p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 px-3 py-2 bg-vibrant-purple text-white text-[10px] font-black uppercase rounded-xl hover:bg-purple-500 transition-all whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(126,34,206,0.4)]"
          >
            Coba →
          </button>
        </div>

        {/* Divider */}
        <div className="relative flex items-center gap-4 px-7 my-1">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Atau login untuk lebih</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Auth */}
        <div className="px-7 pt-3 pb-7 space-y-3">
          {user ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <img src={user.photoURL || "https://www.google.com/favicon.ico"} className="w-9 h-9 rounded-full border-2 border-emerald-500" alt="G" />
              <div>
                <p className="text-emerald-400 font-black text-xs uppercase">Authenticated</p>
                <p className="text-white text-xs font-bold mt-0.5">{user.displayName || user.email || 'Senior'}</p>
              </div>
              <div className="ml-auto">
                <Zap size={16} className="text-emerald-400" />
              </div>
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white text-black font-black py-3.5 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-xl text-sm italic tracking-tight cursor-pointer"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="G" />
              LOGIN WITH GOOGLE
            </button>
          )}

          <div className="relative flex items-center gap-4">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <WalletLoginButton />

          {/* What login unlocks */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { icon: '🔥', label: 'Daily Streak' },
              { icon: '🎯', label: 'Missions' },
              { icon: '🎓', label: 'Learning Path' },
            ].map(f => (
              <div key={f.label} className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white/4 border border-white/6">
                <span className="text-lg">{f.icon}</span>
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center leading-tight">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
