import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-md bg-surface-dark border-2 border-border-purple rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Corner Accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-vibrant-purple/10 to-transparent blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                  type === 'danger' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                  type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
                  'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple'
                }`}>
                  <AlertTriangle size={24} />
                </div>
                <button 
                  onClick={onClose}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-3 leading-none">
                {title}
              </h2>
              <p className="text-slate-400 text-sm font-bold italic leading-relaxed mb-10">
                {message}
              </p>

              <div className="flex gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] italic hover:bg-white/10 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
                <button
                  onClick={async () => {
                    await onConfirm();
                    onClose();
                  }}
                  className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] italic transition-all active:scale-95 shadow-xl ${
                    type === 'danger' ? 'bg-red-600 text-white hover:bg-red-500 shadow-red-600/20' :
                    type === 'warning' ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-amber-500/20' :
                    'bg-vibrant-purple text-white hover:bg-gold-accent hover:text-black shadow-vibrant-purple/20'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
