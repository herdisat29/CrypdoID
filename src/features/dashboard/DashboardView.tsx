import { motion } from 'motion/react';
import { Trophy, Shield, ArrowRight, Zap } from 'lucide-react';
import { useState } from 'react';
import DailyStreak from './components/DailyStreak';
import MiniLeaderboard from './components/MiniLeaderboard';
import InteractiveCard from '../../components/common/InteractiveCard';
import PreviewModeBanner from '../../components/common/PreviewModeBanner';
import ProfileModal from '../profile/ProfileModal';
import WalletModal from '../../components/auth/WalletModal';

import { View } from '../../types';

interface DashboardViewProps {
  setView: (view: View) => void;
}

export default function DashboardView({ setView }: DashboardViewProps) {
  const [showConnections, setShowConnections] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  
  return (
    <div className="flex flex-col gap-10 pb-10 w-full max-w-7xl mx-auto">
      {/* Connect Wallet Banner — muncul buat user Google yang belum link wallet */}
      <PreviewModeBanner onOpenConnections={() => setShowConnections(true)} />
      <ProfileModal 
        isOpen={showConnections} 
        onClose={() => setShowConnections(false)} 
        onOpenWallet={() => {
          setShowConnections(false);
          setTimeout(() => setShowWallet(true), 200);
        }}
      />
      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />
      <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
        <div className="flex-1 space-y-10 w-full">
          {/* Hero Intro */}
          <section className="text-center md:text-left pt-8">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-white uppercase italic leading-none"
            >
              GRIND MISSIONS. <br/> <span className="text-gold-accent">CLAIM YOUR BAGS.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-500 text-sm md:text-xl max-w-2xl font-bold leading-relaxed italic"
            >
              Selesaikan misi seru, asah skill Web3-mu, kumpulkan XP dan mint NFT eksklusif setiap hari.
              Santai aja Senior, belajarnya sambil main!
            </motion.p>
          </section>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-md mx-auto md:mx-0"
          >
            <DailyStreak />
          </motion.div>
        </div>

        <div className="w-full xl:w-[28rem] shrink-0 xl:pt-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <MiniLeaderboard />
          </motion.div>
        </div>
      </div>

      {/* Bottom Full-Width Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <InteractiveCard 
          variant="purple" 
          delay={0.1}
          onClick={() => setView('missions')} 
          className="rounded-[2.5rem]"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-all text-vibrant-purple -rotate-12 group-hover:rotate-0">
            <Trophy size={160} />
          </div>
          <div className="w-14 h-14 bg-vibrant-purple/10 border border-vibrant-purple/20 rounded-2xl flex items-center justify-center text-vibrant-purple mb-8 shadow-xl group-hover:scale-110 transition-transform">
            <Zap size={28} />
          </div>
          <h3 className="text-3xl font-black text-white italic mb-3 uppercase tracking-tighter">Missions Hub</h3>
          <p className="text-slate-500 text-sm font-bold leading-tight">Sikat airdrop dan reward token dengan nyelesain quest edukasi yang gak ngebosenin.</p>
          <div className="mt-10 flex items-center gap-3 text-gold-accent font-black text-[11px] uppercase tracking-[0.4em] italic group-hover:translate-x-2 transition-transform">
            MULAI MISI <ArrowRight size={14} />
          </div>
        </InteractiveCard>

        <InteractiveCard 
          variant="red" 
          delay={0.2}
          onClick={() => setView('security')} 
          className="rounded-3xl"
        >
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-20 transition-all text-red-500 rotate-12 group-hover:rotate-0">
            <Shield size={160} />
          </div>
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 mb-6 font-black italic group-hover:animate-pulse">!</div>
          <h3 className="text-2xl font-black text-white italic mb-2 tracking-tighter uppercase">Scam Radar</h3>
          <p className="text-slate-500 text-sm font-bold leading-tight italic">Jangan sampe kena rered. Cek project inceran lo di Scam Radar mutakhir.</p>
          <div className="mt-8 flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform">
            Buka Radar <ArrowRight size={14} />
          </div>
        </InteractiveCard>
      </div>

      <InteractiveCard 
        variant="gold"
        delay={0.3}
        onClick={() => setView('learning')}
        className="rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8"
      >
        <div className="relative z-10 space-y-2 text-center md:text-left flex-1">
          <h4 className="text-2xl font-black text-white italic uppercase">Akademi Belajar Web3 (Learning Path)</h4>
          <p className="text-slate-400 font-bold italic">Ikuti jalur belajar yang udah kita kurasi buat lo jadi expert.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-gold-accent text-black font-black uppercase text-xs rounded-xl transition-all z-10 italic shadow-lg shadow-gold-accent/20"
        >
          Explore Learning Path
        </motion.button>
      </InteractiveCard>
    </div>
  );
}
