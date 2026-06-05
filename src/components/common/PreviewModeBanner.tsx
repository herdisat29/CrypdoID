import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Zap, X } from 'lucide-react';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAuth } from '../../features/auth/AuthContext';

interface PreviewModeBannerProps {
  onOpenConnections?: () => void;
}

export default function PreviewModeBanner({ onOpenConnections }: PreviewModeBannerProps) {
  const { user, userData } = useAuth();
  const { isConnected } = useAccount();
  const [dismissed, setDismissed] = useState(false);

  // Show banner ONLY when: user is logged in with Google, but hasn't linked a real wallet yet
  const walletLinked = !!userData?.walletAddress || isConnected;
  const showBanner = !!user && !walletLinked && !dismissed;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="relative overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-vibrant-purple/10 via-orange-500/5 to-vibrant-purple/10 border border-vibrant-purple/20 rounded-2xl p-4 md:p-5 backdrop-blur-sm">
            {/* Animated border glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-vibrant-purple/5 via-gold-accent/5 to-vibrant-purple/5 animate-pulse pointer-events-none" />
            
            <div className="relative flex items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-vibrant-purple/20 border border-vibrant-purple/30 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-gold-accent" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold-accent italic">
                    🏆 Unlock NFT Minting
                  </span>
                </div>
                <p className="text-[11px] md:text-xs text-slate-400 font-bold leading-snug">
                  Connect wallet Web3 buat bisa <span className="text-white">mint Archetype NFT</span> dan klaim reward on-chain lo!
                </p>
              </div>

              {/* CTA Button */}
              <motion.button
                onClick={onOpenConnections}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-vibrant-purple/20 hover:bg-vibrant-purple/40 border border-vibrant-purple/30 text-vibrant-purple rounded-xl text-[10px] font-black uppercase tracking-widest italic transition-colors cursor-pointer flex-shrink-0"
              >
                <Wallet size={14} />
                Connect Wallet
              </motion.button>

              {/* Dismiss button */}
              <button
                onClick={() => setDismissed(true)}
                className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5 text-slate-600 hover:text-slate-400 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
