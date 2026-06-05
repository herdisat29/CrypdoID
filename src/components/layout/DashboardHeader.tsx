import { motion } from 'motion/react';
import { Activity, User as UserIcon, Award } from 'lucide-react';
import { useReward, getTitleColorClass } from '../../contexts/RewardContext';
import { useAuth } from '../../features/auth/AuthContext';
import { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import ProfileDropdown from '../../features/profile/ProfileDropdown';
import ScrambleText from '../common/ScrambleText';
import logo from '../../assets/logo-clean.png';

interface DashboardHeaderProps {
  gasFee: number;
  onNavigate: (view: 'dashboard' | 'quiz' | 'security' | 'learning' | 'missions' | 'assistant') => void;
  onLogin?: () => void;
  onLogout?: () => void;
}

export default function DashboardHeader({ gasFee, onNavigate, onLogin, onLogout }: DashboardHeaderProps) {
  const { level, xp, maxXp, title } = useReward();
  const { user } = useAuth();
  const [showGasDetail, setShowGasDetail] = useState(false);
  const isWalletConnected = useWalletStore(state => state.isConnected);
  const walletAddress = useWalletStore(state => state.activeAddress);
  const getCumulativeXp = (lvl: number, progressXp: number): number => {
    let cumulative = 0;
    let currentMax = 1000;
    for (let i = 1; i < lvl; i++) {
      cumulative += currentMax;
      currentMax = Math.floor(currentMax * 1.25);
    }
    return cumulative + progressXp;
  };

  const totalXp = getCumulativeXp(level, xp);
  const progress = Math.floor((xp / maxXp) * 100);
  const gasLow = gasFee < 40;

  return (
    <header className="bg-surface-dark border-b border-border-purple px-3 py-3 md:px-10 md:py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
      {/* ── Left: Brand + Level + Title ── */}
      <div className="flex items-center gap-4 md:gap-8">
        {/* Logo */}
        <div
          className="flex items-center gap-3 group cursor-pointer"
          onClick={() => onNavigate('dashboard')}
        >
          <div className="w-10 h-10 bg-vibrant-purple/20 border border-vibrant-purple/30 rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-[0_0_15px_rgba(126,34,206,0.2)] overflow-hidden">
            <img src={logo} alt="CrypdoID Logo" className="w-full h-full object-cover p-1" />
          </div>
          <div className="hidden md:block">
            <h2 className="text-lg font-black text-white tracking-tighter leading-none uppercase">
              <ScrambleText text="CrypdoID" />
            </h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mt-1">Terminal</p>
          </div>
        </div>

        <div className="h-10 w-px bg-border-purple hidden lg:block opacity-30" />

        {/* Unified Level + XP HUD */}
        {((user && !user.isAnonymous) || isWalletConnected) && (
          <>
            <div
              title={`Total XP lo sejak awal: ${totalXp.toLocaleString()} XP`}
              className="flex items-center bg-black/40 border border-white/10 rounded-full pl-1.5 pr-3 md:pr-4 py-1.5 shadow-inner relative group cursor-pointer hover:border-gold-accent/30 transition-colors"
            >
              
              {/* Circular Level Badge (Left inside the pill) */}
              <div className="relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shrink-0 mr-2 md:mr-3">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="rgba(5, 1, 10, 0.9)"
                    stroke="rgba(126, 34, 206, 0.3)"
                    strokeWidth="3"
                    className="shadow-inner"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="url(#levelGradient)"
                    strokeWidth="3"
                    strokeDasharray="100.53"
                    initial={{ strokeDashoffset: 100.53 }}
                    animate={{ strokeDashoffset: 100.53 - (100.53 * Math.min(progress, 100)) / 100 }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]"
                  />
                  <defs>
                    <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#facc15" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="relative z-10 text-center flex flex-col justify-center items-center leading-none">
                  <span className="text-[6px] text-slate-400 font-extrabold uppercase tracking-widest leading-none mb-0.5">LV</span>
                  <span className="text-[10px] md:text-xs font-black text-gold-accent italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-pulse">{level}</span>
                </div>

              </div>

              {/* XP Bar (Right inside the pill) */}
              <div className="flex flex-col justify-center w-20 sm:w-28 md:w-32">
                <div className="flex justify-between items-center text-[7px] md:text-[8px] font-black uppercase tracking-[0.1em] mb-1 leading-none">
                  <span className="text-slate-400 italic flex items-center gap-1.5">
                    XP
                  </span>
                  <span className="text-gold-accent">{xp}/{maxXp}</span>
                </div>
                <div className="h-1.5 md:h-2 bg-slate-900/80 rounded-full overflow-hidden border border-white/5 relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold-accent to-orange-500 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Title / Badge — replaces BITS */}
            <div className="flex items-center gap-2 md:gap-3 bg-black/40 px-2 py-1 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border border-gold-accent/10 shadow-inner">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-gold-accent/5 flex items-center justify-center border border-gold-accent/10 flex-shrink-0">
                <Award size={12} className="text-gold-accent md:size-[16px]" />
              </div>
              <div>
                <p className="text-[7px] md:text-[9px] text-gold-accent font-black uppercase tracking-widest mb-0.5 opacity-60 italic leading-none">Title</p>
                <p className={`text-[10px] md:text-sm font-black leading-tight tracking-tight pb-0.5 ${getTitleColorClass(level)}`}>{title}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Right: Gas + Auth ── */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Gas indicator with popover */}
        <div className="relative group">
          <button
            onClick={() => setShowGasDetail(!showGasDetail)}
            onMouseEnter={() => setShowGasDetail(true)}
            onMouseLeave={() => setShowGasDetail(false)}
            className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest italic cursor-pointer ${
              gasLow
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/25 transition-colors'
                : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/25 transition-colors'
            }`}
          >
            <Activity size={12} className="animate-pulse" />
            GAS: {gasFee} GWEI
          </button>

          {showGasDetail && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-surface-dark border border-vibrant-purple/40 rounded-2xl p-4 shadow-2xl z-50 text-[11px] font-medium text-slate-300 leading-normal animate-fadeIn text-left">
              <div className="flex items-center gap-2 font-black uppercase text-xs italic tracking-wider text-gold-accent mb-2">
                <span>⚡</span>
                <span>Analogi & Estimasi Gas Fee</span>
              </div>
              <p className="text-slate-400 mb-2 font-normal leading-relaxed">
                <strong className="text-white">Gas Fee</strong> di blockchain itu kayak <strong className="text-gold-accent">Ongkos Bensin</strong> atau tips kurir. Dihitung pakai <strong className="text-white">GWEI</strong> (satuan kecil ETH). Makin ramai orang pakai jaringan, tarif ongkos makin mahal!
              </p>
              
              <div className="space-y-1.5 py-2 border-y border-white/5 my-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span>Status Jaringan:</span>
                  <span className={gasLow ? "text-emerald-400" : "text-red-400 font-bold"}>
                    {gasLow ? "🟢 LOW (Lancar & Murah)" : "🔴 CONGESTED (Padat & Mahal)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Prediksi Transfer:</span>
                  <span className="font-bold text-white">~${(gasFee * 0.04).toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span>Prediksi Swap Token:</span>
                  <span className="font-bold text-white">~${(gasFee * 0.15).toFixed(2)} USD</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic block leading-snug">
                💡 <strong className="text-slate-400">Tips Senior:</strong> Kalau gas di atas 50 GWEI, mending sabar dulu. Tunggu sampe gas turun (biasanya subuh waktu Indonesia) biar hemat gas fee!
              </p>
            </div>
          )}
        </div>



        {/* Auth states */}
        {(user || (isWalletConnected && walletAddress)) ? (
          <ProfileDropdown onLogout={onLogout!} onNavigate={onNavigate} />
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="bg-vibrant-purple hover:bg-gold-accent hover:text-black text-white font-black text-[10px] md:text-xs px-3 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl transition-all shadow-xl shadow-vibrant-purple/20 active:scale-95 uppercase tracking-widest border border-vibrant-purple/30 italic group flex items-center gap-2"
            >
              <UserIcon size={14} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">LOGIN / MASUK</span>
              <span className="sm:hidden">LOGIN</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
