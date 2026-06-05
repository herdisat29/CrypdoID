import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Flame, Award } from 'lucide-react';
import { useReward, type FirestoreTimestamp } from '../../../contexts/RewardContext';
import StreakPopup from '../../../components/common/StreakPopup';
import { useAuth } from '../../../features/auth/AuthContext';
import { useAccount } from 'wagmi';

export default function DailyStreak() {
  const { addReward, streak: contextStreak, updateStreak, lastVisit, verifyStreak } = useReward();
  const [isNewStreak, setIsNewStreak] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const hasCheckedRef = useRef(false);

  const { user } = useAuth();
  const { address } = useAccount();
  const mockWallet = localStorage.getItem('crypdo_mock_wallet');
  const isLoggedIn = !!user || !!address || !!mockWallet;
  const isOnboarding = !localStorage.getItem('crypdo_onboarding_complete');

  useEffect(() => {
    if (contextStreak !== undefined) {
      localStorage.setItem('crypdo_streak', String(contextStreak));
    }
  }, [contextStreak]);

  useEffect(() => {
    if (!isLoggedIn || isOnboarding) return;
    if (lastVisit === undefined) return;
    if (hasCheckedRef.current) return;

    const today = new Date().toISOString().split('T')[0];
    let lastVisitStr = '';

    const lv = lastVisit as FirestoreTimestamp | string;
    if (lv) {
      if (typeof lv !== 'string' && lv.toDate && typeof lv.toDate === 'function') {
        lastVisitStr = lv.toDate().toISOString().split('T')[0];
      } else if (typeof lv !== 'string' && lv.seconds) {
        lastVisitStr = new Date(lv.seconds * 1000).toISOString().split('T')[0];
      } else {
        lastVisitStr = new Date(lv as string).toISOString().split('T')[0];
      }
    }

    // Already checked-in today
    if (lastVisitStr === today) {
      if (contextStreak === 0) {
        // Fix for accounts that were created with 0 streak and lastVisit=today
        updateStreak(1);
        setIsNewStreak(true);
      }
      return;
    }

    hasCheckedRef.current = true;

    const timer = setTimeout(() => {
      const check = verifyStreak(lastVisit);

      if (check.increment) {
        const newStreak = lastVisit ? (contextStreak + 1) : 1;
        updateStreak(newStreak);
        localStorage.setItem('crypdo_last_visit', today);
        setIsNewStreak(true);
        addReward(20 * newStreak); 
      } else {
        updateStreak(1);
        localStorage.setItem('crypdo_last_visit', today);
        addReward(50);
      }
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isOnboarding, lastVisit, contextStreak]);

  if (!isLoggedIn || isOnboarding) return null;

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowPopup(true)}
        className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-[2.5rem] p-8 cursor-pointer flex items-center justify-between group relative overflow-hidden backdrop-blur-md"
      >
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <Flame className="w-12 h-12 text-orange-500" />
          </div>

          <div>
            <p className="text-orange-400 text-xs font-black tracking-[0.3em] uppercase italic mb-1">
              Current Streak
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl font-black text-white italic tracking-tighter">{contextStreak}</span>
              <span className="text-2xl font-black text-orange-300/70 tracking-widest italic">DAYS</span>
            </div>
            {contextStreak >= 3 && (
              <p className="text-emerald-400 text-sm font-black italic tracking-wider mt-1 animate-pulse">
                🔥 ON FIRE!
              </p>
            )}
          </div>
        </div>

        <div className="hidden md:flex flex-col items-end gap-2 relative z-10">
          <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500 group-hover:text-black transition-all">
            <Award size={20} />
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Details</p>
        </div>



        {isNewStreak && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] px-3 py-1 rounded-bl-xl font-black uppercase tracking-tighter shadow-lg z-20"
          >
            Synced
          </motion.div>
        )}
      </motion.div>

      {showPopup && <StreakPopup streak={contextStreak} onClose={() => setShowPopup(false)} />}
    </>
  );
}
