import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X as CloseIcon, Copy, Check, Facebook, Linkedin, Send } from 'lucide-react';
import { useReward } from '../../contexts/RewardContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl?: string;
  title?: string;
}

export default function ShareModal({ 
  isOpen, 
  onClose, 
  shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'http://localhost:3000/dashboard', 
  title = "Cek hasil scan Scam Radar gue!"
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { addReward } = useReward();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: string) => {
    // Reward XP on share click (Max 3x per day to prevent spam)
    const today = new Date().toISOString().split('T')[0];
    const lastShareDate = localStorage.getItem('crypdo_last_share_date');
    const shareCountToday = parseInt(localStorage.getItem('crypdo_share_count') || '0');

    if (lastShareDate !== today) {
      localStorage.setItem('crypdo_last_share_date', today);
      localStorage.setItem('crypdo_share_count', '1');
      addReward(100);
    } else if (shareCountToday < 3) {
      localStorage.setItem('crypdo_share_count', String(shareCountToday + 1));
      addReward(100);
    }
    
    // Simulate share popup
    let url = '';
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    
    if (platform === 'twitter') {
      url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
    } else if (platform === 'facebook') {
      url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    } else if (platform === 'linkedin') {
      url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    } else if (platform === 'telegram') {
      url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
    }
    
    if (url) {
      // Open in a normal new tab. Constrained popups often break Telegram Web's service workers.
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
          >
            <div className="bg-[#1e1b30] border border-white/10 rounded-3xl p-8 relative shadow-2xl overflow-hidden">
              {/* Background glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gold-accent/20 blur-[60px] pointer-events-none" />
              
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <CloseIcon size={20} />
              </button>

              <div className="text-center mt-4">
                <h2 className="text-4xl font-black text-gold-accent mb-2 tracking-tight">
                  EARN 100 XP
                </h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-8">
                  BAGIKAN HASIL SCAN INI KE TEMAN LO
                </p>

                {/* Link Box */}
                <div className="bg-[#120f22] border border-white/10 rounded-2xl p-4 flex items-center gap-4 mb-8">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-white truncate text-sm font-mono text-left">
                      {shareUrl}
                    </p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-white transition-colors flex-shrink-0"
                  >
                    {copied ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                  </button>
                </div>

                <p className="text-white text-sm font-bold mb-4">Share it NOW on:</p>
                
                {/* Social Buttons */}
                <div className="flex justify-center gap-4">
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] transition-all"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleShare('facebook')}
                    className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(24,119,242,0.5)] transition-all"
                  >
                    <Facebook size={20} />
                  </button>
                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="w-12 h-12 rounded-full bg-[#0A66C2] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(10,102,194,0.5)] transition-all"
                  >
                    <Linkedin size={20} />
                  </button>
                  <button 
                    onClick={() => handleShare('telegram')}
                    className="w-12 h-12 rounded-full bg-[#26A5E4] flex items-center justify-center text-white hover:scale-110 hover:shadow-[0_0_15px_rgba(38,165,228,0.5)] transition-all"
                  >
                    <Send size={20} className="ml-[-2px] mt-[2px]" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
