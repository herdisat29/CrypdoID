import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Link as LinkIcon, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useState, useRef, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import { useUIStore } from '../../store/uiStore';
import { useWalletStore } from '../../store/walletStore';

interface ProfileDropdownProps {
  onLogout: () => void;
  onNavigate?: (view: any) => void;
}

export default function ProfileDropdown({ onLogout, onNavigate }: ProfileDropdownProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const setShowWalletModal = useUIStore(state => state.setShowWalletModal);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const walletAddress = useWalletStore(state => state.activeAddress);

  if (!user && !walletAddress) return null;

  const displayName = user?.displayName?.split(' ')[0] || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Senior');
  const fullDisplayName = user?.displayName || (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Senior');
  const userEmail = user?.email || (walletAddress ? 'Web3 Wallet Connected' : '');

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 md:gap-3 bg-vibrant-purple/10 border border-vibrant-purple/30 rounded-2xl px-2.5 md:px-4 py-1.5 shadow-lg hover:bg-vibrant-purple/20 transition-all active:scale-95"
        >
          <div className="relative flex-shrink-0">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="P" className="w-7 h-7 rounded-lg border border-vibrant-purple/40 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-vibrant-purple/20 flex items-center justify-center border border-vibrant-purple/40">
                <UserIcon size={14} className="text-vibrant-purple" />
              </div>
            )}
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-emerald-500 border-2 border-surface-dark rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          </div>
          <div className="hidden sm:block text-left">
            <p className={`text-[8px] font-black uppercase tracking-[0.2em] italic mb-0.5 ${user?.emailVerified || walletAddress ? 'text-vibrant-purple' : 'text-slate-500'}`}>
              {user?.emailVerified || walletAddress ? 'Identity Verified' : 'Unverified Account'}
            </p>
            <p className="text-[11px] md:text-xs font-black text-white italic uppercase tracking-tight leading-none">
              {displayName}
            </p>
          </div>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-3 w-56 bg-surface-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-3 border-b border-white/5 bg-white/5">
                <p className="text-sm font-bold text-white truncate">{fullDisplayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              </div>

              <div className="p-2 space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-vibrant-purple/20 transition-colors"
                >
                  <LinkIcon size={16} className="text-vibrant-purple" />
                  Profile & Connections
                </button>
              </div>

              <div className="p-2 border-t border-white/5">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
                >
                  <LogOut size={16} />
                  {user ? 'Logout' : 'Disconnect Wallet'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigate={onNavigate}
        onOpenWallet={() => {
          setIsModalOpen(false);
          setTimeout(() => setShowWalletModal(true), 200);
        }}
      />
    </>
  );
}
