import { motion, AnimatePresence } from "motion/react";
import { Flame, X } from "lucide-react";

interface StreakPopupProps {
  streak: number;
  onClose: () => void;
}

export default function StreakPopup({ streak, onClose }: StreakPopupProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-surface-dark border border-orange-500/30 rounded-[3rem] max-w-md w-full overflow-hidden shadow-[0_0_50px_rgba(249,115,22,0.15)]"
        >
          <div className="relative p-10 text-center">
            <button 
              onClick={onClose} 
              className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>

            <div className="mx-auto w-28 h-28 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
              <Flame className="w-16 h-16 text-orange-500" />
            </div>

            <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-widest">Login Harian</h2>
            <p className="text-7xl font-black text-orange-400 mb-6 italic tracking-tighter">{streak} DAYS</p>
            
            <p className="text-slate-400 text-lg font-bold italic mb-10 leading-relaxed">
              Keren Senior! Tetap konsisten ya 🔥<br />
              Setiap sync nambah Bits dan XP lo.
            </p>

            <button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black py-5 rounded-2xl text-lg transition-all active:scale-95 shadow-xl shadow-orange-500/20 italic tracking-tighter"
            >
              LANJUTKAN
            </button>

            <p className="text-[10px] font-black text-slate-600 mt-8 uppercase tracking-[0.3em]">CrypdoID System v1.0 • Sistem Sinkron</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
