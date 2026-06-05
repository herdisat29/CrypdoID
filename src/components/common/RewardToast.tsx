import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { Star, Award } from 'lucide-react';

interface RewardToastProps {
  xp: number;
  newTitle: string | null; // null = no level up, string = new title earned
  isVisible: boolean;
  onClose: () => void;
}

export default function RewardToast({ xp, newTitle, isVisible, onClose }: RewardToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 50, scale: 0.95, x: '-50%' }}
          className="fixed bottom-10 left-1/2 z-[200] w-full max-w-[400px] px-4"
        >
          <div className="bg-surface-dark border-2 border-gold-accent/40 rounded-[2rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-vibrant-purple/10 to-gold-accent/10 opacity-50" />

            <div className="relative z-10 p-6 flex items-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 bg-gold-accent/20 rounded-2xl flex items-center justify-center border border-gold-accent/30 shadow-[0_0_20px_rgba(250,204,21,0.2)] shrink-0">
                {newTitle
                  ? <Award className="w-9 h-9 text-gold-accent" />
                  : <Star className="w-9 h-9 text-gold-accent animate-pulse" />
                }
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="text-[10px] font-black text-gold-accent uppercase tracking-[0.3em] italic mb-1">
                  {newTitle ? 'Level Up!' : 'XP Earned'}
                </p>
                <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">
                  {newTitle ? `Title Baru!` : 'Reward Received!'}
                </h4>

                <div className="flex flex-wrap gap-3">
                  {/* XP badge */}
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                    <span className="text-sm font-black text-white italic">+{xp}</span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">XP</span>
                  </div>

                  {/* New title badge — only shown on level up */}
                  {newTitle && (
                    <div className="flex items-center gap-2 bg-gold-accent/10 px-3 py-1.5 rounded-xl border border-gold-accent/20">
                      <Award size={12} className="text-gold-accent" />
                      <span className="text-sm font-black text-gold-accent italic">{newTitle}</span>
                    </div>
                  )}
                </div>
              </div>

              <button onClick={onClose} className="text-slate-600 hover:text-white transition-colors p-2">
                ✕
              </button>
            </div>

            {/* Countdown bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 4, ease: 'linear' }}
              className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-vibrant-purple to-gold-accent origin-left"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
