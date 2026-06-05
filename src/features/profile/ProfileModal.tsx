import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, Link as LinkIcon, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, twitterProvider } from '../../lib/firebase';
import { linkWithPopup } from 'firebase/auth';
import { useUserStore } from '../../store/userStore';
import { useWalletStore } from '../../store/walletStore';
import { INVESTOR_REFRAME, getShortName } from '../../data/archetypeReframe';

// Uses global INVESTOR_REFRAME

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet: () => void;
  onNavigate?: (view: any) => void;
}

export default function ProfileModal({ isOpen, onClose, onOpenWallet, onNavigate }: ProfileModalProps) {
  const { user, userData } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLinkingWallet, setIsLinkingWallet] = useState(false);
  const [isLinkingTwitter, setIsLinkingTwitter] = useState(false);
  const [walletConflict, setWalletConflict] = useState(false);

  // Status Checkers
  const isWalletLinked = !!userData?.walletAddress || (!user && isConnected);
  const isTwitterLinked = !!userData?.twitterId || user?.providerData.some(p => p.providerId === 'twitter.com');
  const isDiscordLinked = !!userData?.discordId;
  const isTelegramLinked = !!userData?.telegramId;
  const archetypeId = useUserStore(state => state.archetype);
  const isArchetypeLinked = !!archetypeId;
  const walletAddress = useWalletStore(state => state.activeAddress);

  const handleLinkWallet = async () => {
    if (!isConnected || !address || !user) return;
    try {
      setIsLinkingWallet(true);
      setWalletConflict(false);

      // Conflict Check Rule 4
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('walletAddress', '==', address));
      const querySnapshot = await getDocs(q);
      
      let isConflict = false;
      querySnapshot.forEach((doc) => {
        if (doc.id !== user.uid) {
          isConflict = true;
        }
      });

      if (isConflict) {
        setWalletConflict(true);
        return;
      }

      // Prove ownership by signing a message
      const message = `Welcome to CrypdoID!\n\nClick to sign in and prove ownership of this wallet.\n\nAddress: ${address}\nNonce: ${Date.now()}`;
      await signMessageAsync({ message });
      
      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        walletAddress: address
      });
      alert("Wallet successfully linked!");
    } catch (error) {
      console.error("Failed to link wallet:", error);
      alert("Gagal menghubungkan wallet. Coba lagi.");
    } finally {
      setIsLinkingWallet(false);
    }
  };

  const handleLinkTwitter = async () => {
    if (!user) return;
    try {
      setIsLinkingTwitter(true);
      await linkWithPopup(user, twitterProvider);
      alert("X/Twitter successfully linked!");
    } catch (error: any) {
      console.error("Failed to link Twitter:", error);
      if (error.code === 'auth/credential-already-in-use') {
        alert("Akun X ini udah dipakai di akun CrypdoID lain!");
      } else {
        alert("Gagal menghubungkan X.");
      }
    } finally {
      setIsLinkingTwitter(false);
    }
  };

  const handleLinkDiscord = () => {
    if (!user) return;
    window.location.href = `/api/auth/discord/connect?uid=${user.uid}`;
  };

  const handleLinkTelegram = () => {
    alert("Telegram linking coming soon!");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="profile-modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f0718] border border-white/10 rounded-[2rem] w-full max-w-lg my-auto h-fit max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide shadow-[0_0_80px_rgba(126,34,206,0.3)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-vibrant-purple/10 to-transparent">
              <div>
                <h2 className="text-xl font-black text-white italic uppercase tracking-wider">Manage Connections</h2>
                <p className="text-xs text-slate-400 font-medium">Tautkan identitas lu buat selesain misi Web3.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              
              {/* Primary Identity */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                {user ? (
                  <>
                    <img 
                      src={user?.photoURL || "https://www.google.com/favicon.ico"} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full border-2 border-emerald-500/50 object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Primary Identity</p>
                        <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-xl text-slate-300 uppercase tracking-widest font-bold">
                          {user?.providerData[0]?.providerId === 'twitter.com' ? 'X (Twitter)' : 'Google'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{user?.displayName || 'Senior'}</p>
                      <p className="text-xs text-slate-400">
                        {user?.providerData[0]?.providerId === 'twitter.com' && (user as any).reloadUserInfo?.screenName 
                          ? `@${(user as any).reloadUserInfo.screenName}`
                          : user?.email}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center">
                      <Wallet size={24} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Primary Identity</p>
                        <span className="text-[8px] bg-white/10 px-2 py-0.5 rounded-xl text-slate-300 uppercase tracking-widest font-bold">
                          Web3 Wallet
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white font-mono">{walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Unknown'}</p>
                      <p className="text-xs text-slate-400 italic">Unlinked Guest Account</p>
                    </div>
                  </>
                )}
                <ShieldAlert className="text-emerald-500 opacity-50" size={24} />
              </div>

              {/* Connections List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest pl-2 mb-4">Linked Accounts</h3>

                {/* 0. Archetype (Soulbound Identity) */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-gold-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-accent/10 text-gold-accent flex items-center justify-center border border-gold-accent/20 text-lg shadow-[0_0_10px_rgba(250,204,21,0.15)]">
                      {isArchetypeLinked ? INVESTOR_REFRAME[archetypeId]?.emoji : '🛡️'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Soulbound Archetype</p>
                      <p className="text-[10px] text-slate-400">Identitas psikologi Web3 lo.</p>
                    </div>
                  </div>
                  {isArchetypeLinked ? (
                    <div className="flex items-center gap-1.5 text-gold-accent bg-gold-accent/10 px-2.5 py-1 rounded-full border border-gold-accent/20">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold uppercase italic">{getShortName(INVESTOR_REFRAME[archetypeId]?.quizName)}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        onClose();
                        if (onNavigate) onNavigate('quiz');
                      }}
                      className="flex items-center gap-2 bg-vibrant-purple/10 text-vibrant-purple border border-vibrant-purple/30 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-vibrant-purple hover:text-white transition-all"
                    >
                      Test Now
                    </button>
                  )}
                </div>

                {/* 1. Wallet */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-gold-accent/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Web3 Wallet</p>
                      <p className="text-[10px] text-slate-400">Buktiin lo anak crypto beneran.</p>
                      {!isConnected && !isWalletLinked && (
                        <p className="text-[9px] text-emerald-400 mt-1.5 italic max-w-[200px] leading-relaxed">
                          <strong className="text-white">Baru di Crypto?</strong> Web3 Wallet adalah identitas digital & gerbang menuju internet masa depan.
                        </p>
                      )}
                    </div>
                  </div>
                  {isWalletLinked ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold font-mono">{(userData?.walletAddress || walletAddress)?.slice(0,6)}...</span>
                    </div>
                  ) : walletConflict ? (
                    <div className="flex items-center gap-1.5 text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 group relative cursor-help">
                      <ShieldAlert size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Conflict</span>
                      <div className="absolute top-full mt-2 right-0 w-48 bg-red-950 border border-red-500/30 text-red-200 text-[9px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl leading-relaxed">
                        Sudah dipakai akun lain. Blocked.
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          onOpenWallet();
                        } else {
                          handleLinkWallet();
                        }
                      }}
                      disabled={isLinkingWallet}
                      className="flex items-center gap-2 bg-vibrant-purple text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-gold-accent hover:text-black transition-all disabled:opacity-50"
                    >
                      {isLinkingWallet ? 'Linking...' : 'Connect'}
                    </button>
                  )}
                </div>

                {/* 2. Twitter */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#1DA1F2]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#1DA1F2]/10 text-[#1DA1F2] flex items-center justify-center border border-[#1DA1F2]/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 3.827H5.078z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">X (Twitter)</p>
                      <p className="text-[10px] text-slate-400">Social graph & influence score.</p>
                    </div>
                  </div>
                  {isTwitterLinked ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold">{userData?.twitterUsername || 'Connected'}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLinkTwitter}
                      disabled={isLinkingTwitter}
                      className="flex items-center gap-2 bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/30 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#1DA1F2] hover:text-white transition-all disabled:opacity-50"
                    >
                      {isLinkingTwitter ? 'Linking...' : 'Connect'}
                    </button>
                  )}
                </div>

                {/* 3. Discord */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#5865F2]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center border border-[#5865F2]/20">
                      <svg viewBox="0 0 127.14 96.36" className="w-5 h-5 fill-current">
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-19.32-72.1M42.56,65.36c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.46,11-9.8,11m42.24,0c-5.36,0-9.8-4.93-9.8-11s4.38-11,9.8-11,9.85,4.92,9.8,11-4.46,11-9.8,11" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Discord</p>
                      <p className="text-[10px] text-slate-400">Join role eksklusif di server.</p>
                    </div>
                  </div>
                  {isDiscordLinked ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold">{userData?.discordUsername || 'Connected'}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLinkDiscord}
                      className="flex items-center gap-2 bg-[#5865F2]/10 text-[#5865F2] border border-[#5865F2]/30 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#5865F2] hover:text-white transition-all"
                    >
                      <LinkIcon size={14} /> Link
                    </button>
                  )}
                </div>

                {/* 4. Telegram */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-[#229ED9]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center border border-[#229ED9]/20">
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Telegram</p>
                      <p className="text-[10px] text-slate-400">Notifikasi & mini-app access.</p>
                    </div>
                  </div>
                  {isTelegramLinked ? (
                    <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg border border-emerald-400/20">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold">{userData?.telegramUsername || 'Connected'}</span>
                    </div>
                  ) : (
                    <button 
                      onClick={handleLinkTelegram}
                      className="flex items-center gap-2 bg-[#229ED9]/10 text-[#229ED9] border border-[#229ED9]/30 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider hover:bg-[#229ED9] hover:text-white transition-all opacity-50 cursor-not-allowed"
                    >
                      Soon
                    </button>
                  )}
                </div>

              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
