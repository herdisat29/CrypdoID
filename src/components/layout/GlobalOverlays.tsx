import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuth } from '../../features/auth/AuthContext';
import { useReward } from '../../contexts/RewardContext';
import { useWalletStore } from '../../store/walletStore';
import { useUserStore } from '../../store/userStore';
import { useDisconnect } from 'wagmi';
import { playSfx } from '../../lib/audio';
import { missionRules, initialMissions } from '../../features/missions/missionRules';

import ConfirmationModal from '../common/ConfirmationModal';
import LoginPage from '../../features/auth/LoginPage';
import EmailVerificationNotice from '../common/EmailVerificationNotice';
import OnboardingFlow from '../onboarding/OnboardingFlow';
import RewardToast from '../common/RewardToast';
import WalletModal from '../auth/WalletModal';

export default function GlobalOverlays() {
  const { user, logout } = useAuth();
  const { toast, hideRewardToast } = useReward();
  const { disconnect } = useDisconnect();

  const profile = useUserStore();
  const completedIdsRef = useRef<number[] | null>(null);
  const [missionToast, setMissionToast] = useState<{ isVisible: boolean; title: string; xp: number } | null>(null);

  // Auto-dismiss mission completion toast after 4s
  useEffect(() => {
    if (missionToast?.isVisible) {
      const timer = setTimeout(() => {
        setMissionToast(prev => prev ? { ...prev, isVisible: false } : null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [missionToast]);

  // Global background mission completion detector
  useEffect(() => {
    // Evaluate mission statuses based on current userStore profile
    const completedIds: number[] = [];
    const prevMissions: any[] = [];
    
    for (let i = 0; i < initialMissions.length; i++) {
      const m = { ...initialMissions[i] };
      const rule = missionRules[m.id];
      const status = rule ? rule(profile, prevMissions) : 'locked';
      m.status = status;
      prevMissions.push(m);
      if (status === 'completed' || status === 'claimed') {
        completedIds.push(m.id);
      }
    }

    // On mount/first load, just set the reference of already completed mission IDs
    if (completedIdsRef.current === null) {
      completedIdsRef.current = completedIds;
      return;
    }

    // Check if there are newly completed mission IDs
    const newlyCompletedId = completedIds.find(id => !completedIdsRef.current!.includes(id));
    if (newlyCompletedId) {
      const completedMission = initialMissions.find(m => m.id === newlyCompletedId);
      if (completedMission && completedMission.status !== 'claimed') {
        // Play epic achievement sound
        playSfx('claim');
        // Trigger glowing global overlay toast
        setMissionToast({
          isVisible: true,
          title: completedMission.title,
          xp: completedMission.xpReward
        });
      }
    }

    completedIdsRef.current = completedIds;
  }, [profile.scanCount, profile.completedModules, profile.hasHoneypot, profile.hasRoadmapStarted, profile.hasFullTrack, profile.hasSharedArchetype, profile.streak, profile.hasArchetype]);

  const {
    showLogoutConfirm,
    showLoginOverlay,
    showOnboarding,
    setShowLogoutConfirm,
    setShowLoginOverlay,
    setShowOnboarding,
    setIsGuest,
    showWalletModal,
    setShowWalletModal,
  } = useUIStore();

  return (
    <>
      <AnimatePresence>
        {showLogoutConfirm && (
          <ConfirmationModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={async () => {
              try {
                if (user) {
                  await logout();
                } else {
                  // Clear specific localStorage elements for guests
                  const keysToRemove: string[] = [];
                  for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('crypdo_') && key !== 'crypdo_onboarding_complete') {
                      keysToRemove.push(key);
                    }
                  }
                  keysToRemove.forEach(k => localStorage.removeItem(k));
                  useUserStore.getState().resetStore();
                }
                useWalletStore.getState().disconnectAll();
                try {
                  disconnect();
                } catch (e) {
                  // Ignore connector not found error
                }
                window.dispatchEvent(new Event('storage'));
              } catch (err) {
                console.error("Logout failed:", err);
              } finally {
                setIsGuest(false);
                setShowLogoutConfirm(false);
              }
            }}
            title="MAU KELUAR?"
            message="Yakin mau keluar Senior? Perjalanan lo belum selesai nih. XP dan Progress lo bakal aman kok di blockchain (cloud)."
            confirmText="Ya, Exit"
            cancelText="Stay Here"
          />
        )}
        {user && user.email && !user.emailVerified && <EmailVerificationNotice key="verification" />}
        {showLoginOverlay && (
          <LoginPage
            key="auth_overlay"
            onClose={() => setShowLoginOverlay(false)}
          />
        )}
      </AnimatePresence>

      <WalletModal 
        isOpen={showWalletModal} 
        onClose={() => setShowWalletModal(false)} 
      />

      {showOnboarding && (
        <OnboardingFlow
          onComplete={() => {
            setShowOnboarding(false);
          }}
        />
      )}

      <RewardToast
        xp={toast.xp}
        newTitle={toast.newTitle}
        isVisible={toast.isVisible}
        onClose={hideRewardToast}
      />

      {/* Global Mission Completed Toast */}
      <AnimatePresence>
        {missionToast?.isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: -50, scale: 0.95, x: '-50%' }}
            className="fixed top-6 left-1/2 z-[200] w-full max-w-[420px] px-4"
          >
            <div className="bg-[#0b0817] border-2 border-emerald-500/40 rounded-[2rem] shadow-[0_20px_50px_rgba(16,185,129,0.3)] overflow-hidden relative backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50" />
              
              <div className="relative z-10 p-5 flex items-center gap-4">
                {/* Icon Circle */}
                <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] shrink-0 animate-pulse">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>

                {/* Text Block */}
                <div className="flex-1">
                  <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-0.5">
                    🎉 MISSION COMPLETED!
                  </p>
                  <h4 className="text-sm font-black text-white italic uppercase tracking-tight leading-tight line-clamp-1">
                    {missionToast.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    Buka tab <span className="text-gold-accent font-black">Mission</span> buat klaim <span className="text-emerald-400">+{missionToast.xp} XP</span>!
                  </p>
                </div>

                <button 
                  onClick={() => setMissionToast(prev => prev ? { ...prev, isVisible: false } : null)}
                  className="text-slate-600 hover:text-white transition-colors p-2 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Glowing countdown bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: 'linear' }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 origin-left shadow-[0_0_8px_#10b981]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
