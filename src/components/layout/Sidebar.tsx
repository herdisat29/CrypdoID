import { 
  LayoutDashboard, 
  Trophy, 
  Zap, 
  Fingerprint, 
  Shield, 
  PanelLeftClose, 
  ArrowRight, 
  Wallet, 
  LogOut,
  Unlink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../features/auth/AuthContext';
import ScrambleText from '../common/ScrambleText';
import { cn } from '../../lib/utils';
import logo from '../../assets/logo-clean.png';
import { playSfx } from '../../lib/audio';
import { useWalletStore } from '../../store/walletStore';
import { INVESTOR_REFRAME, getShortName } from '../../data/archetypeReframe';
import { useUIStore } from '../../store/uiStore';
import { useUserStore } from '../../store/userStore';

// Uses global INVESTOR_REFRAME

const SIDEBAR_RARITY_STYLE: Record<string, {
  border: string;
  bg: string;
  text: string;
  borderIcon: string;
  shadow: string;
}> = {
  deep_diver: { // Legendary (Gold)
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    text: 'text-yellow-400',
    borderIcon: 'border-yellow-500/40',
    shadow: 'shadow-[0_0_12px_rgba(234,179,8,0.2)]'
  },
  conviction_holder: { // Epic (Purple)
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/5',
    text: 'text-purple-400',
    borderIcon: 'border-purple-500/40',
    shadow: 'shadow-[0_0_12px_rgba(168,85,247,0.2)]'
  },
  narrative_reader: { // Rare (Blue)
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-400',
    borderIcon: 'border-blue-500/40',
    shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]'
  },
  accumulator: { // Rare (Blue)
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    text: 'text-blue-400',
    borderIcon: 'border-blue-500/40',
    shadow: 'shadow-[0_0_12px_rgba(59,130,246,0.2)]'
  },
  reward_hunter: { // Uncommon (Green)
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    borderIcon: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
  },
  momentum_chaser: { // Uncommon (Green)
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-400',
    borderIcon: 'border-emerald-500/40',
    shadow: 'shadow-[0_0_12px_rgba(16,185,129,0.2)]'
  },
  community_native: { // Common (Slate / Silver)
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/5',
    text: 'text-slate-400',
    borderIcon: 'border-slate-500/40',
    shadow: 'shadow-[0_0_8px_rgba(148,163,184,0.1)]'
  },
  dopamine_trader: { // Common (Slate / Silver)
    border: 'border-slate-500/30',
    bg: 'bg-slate-500/5',
    text: 'text-slate-400',
    borderIcon: 'border-slate-500/40',
    shadow: 'shadow-[0_0_8px_rgba(148,163,184,0.1)]'
  }
};

import { View } from '../../types';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: (expanded: boolean) => void;
}

export default function Sidebar({
  view,
  setView,
  isSidebarExpanded,
  setIsSidebarExpanded,
}: SidebarProps) {
  const { setShowLogoutConfirm, setShowLoginOverlay } = useUIStore();
  const { user } = useAuth();
  const archetypeId = useUserStore(state => state.archetype);
  const isWalletConnected = useWalletStore(state => !!state.mockAddress || state.isRealConnected);
  const activeWalletAddress = useWalletStore(state => state.mockAddress || state.realAddress);

  const menuItems = [
    { id: 'dashboard' as View, icon: <LayoutDashboard size={24} />, label: 'Dashboard' },
    { id: 'missions' as View, icon: <Trophy size={24} />, label: 'Missions' },
    { id: 'learning' as View, icon: <Zap size={24} />, label: 'Materi Belajar' },
    { id: 'quiz' as View, icon: <Fingerprint size={24} />, label: 'Kuis Profil' },
    { id: 'security' as View, icon: <Shield size={24} />, label: 'Anti-Scam' },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarExpanded ? 240 : 80 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={() => {
        if (!isSidebarExpanded) setIsSidebarExpanded(true);
      }}
      className={cn(
        "hidden md:flex bg-surface-dark border-r border-border-purple flex-col items-center py-6 gap-8 z-55 sticky top-0 h-screen overflow-hidden",
        !isSidebarExpanded && "cursor-pointer hover:bg-white/5 transition-colors"
      )}
    >
      <div className="w-full px-4 mb-2">
        <div className="flex items-center gap-3">
          <motion.div
            layout
            className={cn(
              "flex-shrink-0 bg-vibrant-purple/20 border border-vibrant-purple/30 rounded-xl flex items-center justify-center font-black text-white italic transition-all overflow-hidden shadow-[0_0_15px_rgba(126,34,206,0.2)]",
              isSidebarExpanded ? "w-8 h-8 text-sm" : "w-10 h-10 text-xl mx-auto"
            )}
          >
            <img src={logo} alt="CrypdoID Logo" className="w-full h-full object-cover p-1" />
          </motion.div>
          <AnimatePresence>
            {isSidebarExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ScrambleText 
                  text="CrypdoID" 
                  className="text-sm font-black bg-gradient-to-r from-vibrant-purple to-gold-accent bg-clip-text text-transparent tracking-tighter pr-2" 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <nav className="flex-1 w-full px-3 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={(e) => {
              playSfx('click');
              if (isSidebarExpanded) {
                setView(item.id);
              } else {
                e.stopPropagation();
                setView(item.id);
                setIsSidebarExpanded(true);
              }
            }}
            onMouseEnter={() => playSfx('hover')}
            title={!isSidebarExpanded ? item.label : undefined}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all relative group overflow-hidden cursor-pointer",
              view === item.id 
                ? "bg-vibrant-purple/20 text-gold-accent shadow-[0_0_20px_rgba(250,204,21,0.1)]" 
                : "text-slate-500 hover:text-white hover:bg-white/5"
            )}
          >
            <div className="flex-shrink-0">
              {item.icon}
            </div>
            
            <AnimatePresence>
              {isSidebarExpanded && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {view === item.id && (
              <div className="text-gold-accent">•</div>
            )}

            {view === item.id && (
              <motion.div 
                layoutId="active-indicator"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gold-accent rounded-r-full shadow-[0_0_10px_#facc15]"
              />
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto w-full px-3 flex flex-col gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsSidebarExpanded(!isSidebarExpanded);
          }}
          className="w-full flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all group cursor-pointer"
        >
          <div className="flex-shrink-0">
            {isSidebarExpanded ? (
              <motion.div initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }}>
                <PanelLeftClose size={20} />
              </motion.div>
            ) : (
              <ArrowRight size={20} />
            )}
          </div>
          {isSidebarExpanded && (
            <span className="text-[10px] font-black uppercase tracking-widest">Collapse Side</span>
          )}
        </button>

        <div className="h-px bg-border-purple/30 mx-2" />

        {(() => {
          const sidebarStyle = archetypeId && SIDEBAR_RARITY_STYLE[archetypeId] ? SIDEBAR_RARITY_STYLE[archetypeId] : {
            border: 'border-slate-800/30',
            bg: 'bg-slate-800/5',
            text: 'text-slate-400',
            borderIcon: 'border-slate-800/40',
            shadow: ''
          };
          const showArchetype = (user || (isWalletConnected && activeWalletAddress)) && archetypeId && INVESTOR_REFRAME[archetypeId];
          
          return showArchetype ? (
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl border transition-all duration-300",
              sidebarStyle.border,
              sidebarStyle.bg,
              sidebarStyle.shadow,
              !isSidebarExpanded && "justify-center"
            )} title={getShortName(INVESTOR_REFRAME[archetypeId].quizName)}>
              <div className={cn(
                "w-8 h-8 rounded-lg border p-0.5 bg-black/40 flex-shrink-0 flex items-center justify-center text-lg transition-all duration-300",
                sidebarStyle.borderIcon
              )}>
                {INVESTOR_REFRAME[archetypeId].emoji}
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[9px] font-black uppercase tracking-widest mb-0.5 transition-all duration-300", sidebarStyle.text)}>Archetype</p>
                  <p className="text-[11px] font-bold text-white truncate italic">
                    {getShortName(INVESTOR_REFRAME[archetypeId].quizName)}
                  </p>
                </div>
              )}
            </div>
          ) : null;
        })()}

        {user ? (
          <div className="flex flex-col gap-2">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl border border-vibrant-purple/10 bg-black/20",
              !isSidebarExpanded && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-lg border border-vibrant-purple/30 p-0.5 bg-black/40 flex-shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="U" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <div className="w-full h-full rounded-lg bg-vibrant-purple/10 flex items-center justify-center">
                    <Fingerprint size={16} className="text-vibrant-purple" />
                  </div>
                )}
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white truncate uppercase italic">
                    {user.displayName || (user.uid?.startsWith('0x') ? `${user.uid.slice(0,6)}...${user.uid.slice(-4)}` : 'Senior')}
                  </p>
                  <p className="text-[8px] text-slate-500 font-extrabold truncate uppercase tracking-tighter">
                    {user?.providerData[0]?.providerId === 'twitter.com' && (user as any).reloadUserInfo?.screenName 
                      ? `@${(user as any).reloadUserInfo.screenName}`
                      : user?.email || 'Connected'}
                  </p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer",
                !isSidebarExpanded && "justify-center"
              )}
            >
              <LogOut size={20} className="flex-shrink-0" />
              {isSidebarExpanded && (
                <span className="text-[10px] font-black uppercase tracking-widest">Exit</span>
              )}
            </button>
          </div>
        ) : isWalletConnected && activeWalletAddress ? (
          <div className="flex flex-col gap-2">
            <div className={cn(
              "flex items-center gap-3 p-2 rounded-xl border border-emerald-500/10 bg-black/20",
              !isSidebarExpanded && "justify-center"
            )}>
              <div className="w-8 h-8 rounded-lg border border-emerald-500/30 p-0.5 bg-black/40 flex-shrink-0 flex items-center justify-center text-emerald-400">
                <Wallet size={16} />
              </div>
              {isSidebarExpanded && (
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white truncate uppercase italic">
                    {activeWalletAddress.slice(0, 6)}...{activeWalletAddress.slice(-4)}
                  </p>
                  <p className="text-[8px] text-emerald-500 font-extrabold truncate uppercase tracking-tighter">Synced Address</p>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer",
                !isSidebarExpanded && "justify-center"
              )}
            >
              <Unlink size={20} className="flex-shrink-0 text-red-500" />
              {isSidebarExpanded && (
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Disconnect</span>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginOverlay(true)}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl text-gold-accent bg-gold-accent/10 border border-gold-accent/20 hover:bg-gold-accent hover:text-black transition-all animate-pulse cursor-pointer",
              !isSidebarExpanded && "justify-center"
            )}
          >
            <Zap size={20} className="flex-shrink-0" />
            {isSidebarExpanded && (
              <span className="text-[10px] font-black uppercase tracking-widest italic">Login</span>
            )}
          </button>
        )}
      </div>
    </motion.aside>
  );
}
