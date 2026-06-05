import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { useAccount } from 'wagmi';
import { useAuth } from '../features/auth/AuthContext';
import { db, auth } from '../lib/firebase';
import { playSfx } from '../lib/audio';
import { useUserStore } from '../store/userStore';
import { useWalletStore } from '../store/walletStore';

// ─── Title system — no monetary value, purely cosmetic ───────────────────────
export const TITLES: Record<number, string> = {
  1: 'Pemula Crypto',
  2: 'Junior Member',
  3: 'Web3 Explorer',
  4: 'Airdrop Hunter',
  5: 'Chain Navigator',
  6: 'Token Detective',
  7: 'DeFi Master',
  8: 'Web3 Native',
  9: 'Crypto OG',
  10: 'CrypdoID Legend',
};

export function getTitleForLevel(level: number): string {
  return TITLES[Math.min(level, 10)] ?? 'CrypdoID Legend';
}

export function getTitleColorClass(level: number): string {
  const l = Math.min(level, 10);
  if (l <= 2) return 'bg-gradient-to-r from-slate-400 to-slate-200 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]';
  if (l <= 4) return 'bg-gradient-to-r from-emerald-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]';
  if (l <= 6) return 'bg-gradient-to-r from-vibrant-purple to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(126,34,206,0.6)] animate-pulse';
  if (l <= 8) return 'bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_12px_rgba(249,115,22,0.7)] animate-pulse';
  return 'bg-gradient-to-r from-gold-accent to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(250,204,21,0.9)] animate-pulse font-black';
}

export interface FirestoreTimestamp {
  seconds?: number;
  nanoseconds?: number;
  toDate?: () => Date;
}

// Secure Firestore LastVisit Verifier
export function verifyStreak(lastVisit: FirestoreTimestamp | string | null | undefined): { reset: boolean; increment: boolean } {
  if (!lastVisit) {
    return { reset: false, increment: true };
  }

  const now = new Date();
  let lastDate: Date;

  if (typeof lastVisit === 'string') {
    lastDate = new Date(lastVisit);
  } else if (lastVisit.toDate && typeof lastVisit.toDate === 'function') {
    lastDate = lastVisit.toDate();
  } else if (lastVisit.seconds !== undefined && lastVisit.seconds !== null) {
    lastDate = new Date(lastVisit.seconds * 1000);
  } else {
    lastDate = new Date(lastVisit as string | number);
  }

  const todayStr = now.toISOString().split('T')[0];
  const lastStr = lastDate.toISOString().split('T')[0];

  if (todayStr === lastStr) {
    return { reset: false, increment: false };
  }

  const oneDayMs = 24 * 60 * 60 * 1000;
  const tomorrowOfLast = new Date(lastDate.getTime() + oneDayMs).toISOString().split('T')[0];

  if (todayStr === tomorrowOfLast) {
    return { reset: false, increment: true };
  }

  // Missed more than a day
  return { reset: true, increment: false };
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface RewardContextType {
  level: number;
  xp: number;
  maxXp: number;
  streak: number;
  title: string;
  lastVisit: FirestoreTimestamp | string | null;
  addReward: (xpAmount: number) => void;
  resetProgress: () => void;
  toast: { isVisible: boolean; xp: number; newTitle: string | null };
  showRewardToast: (xp: number, newTitle?: string | null) => void;
  hideRewardToast: () => void;
  syncing: boolean;
  updateStreak: (newStreak: number) => void;
  verifyStreak: (lastVisit: FirestoreTimestamp | string | null | undefined) => { reset: boolean; increment: boolean };
}

const RewardContext = createContext<RewardContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function RewardProvider({ children }: { children: ReactNode }) {
  const { user: firebaseUser } = useAuth();
  const { address: realAddress, isConnected: isRealConnected } = useAccount();

  const mockAddress = useWalletStore(state => state.mockAddress);

  const address = isRealConnected ? realAddress : mockAddress;
  const isConnected = isRealConnected || !!mockAddress;

  const [toast, setToast] = useState<{ isVisible: boolean; xp: number; newTitle: string | null }>({
    isVisible: false, xp: 0, newTitle: null,
  });
  const [syncing, setSyncing] = useState(false);

  const [state, setState] = useState({
    level: 1,
    xp: 0,
    maxXp: 1000,
    streak: 0,
    lastVisit: null as FirestoreTimestamp | string | null
  });

  const { level, xp, maxXp, streak, lastVisit } = state;
  const title = getTitleForLevel(level);

  // Use firebase UID as primary ID, fallback to wallet address
  const effectiveId = firebaseUser?.uid || address?.toLowerCase();

  // Queues & debouncing handlers
  const pendingXpRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset local state (Learning Path & Archetype) only when user ACTUALLY switches accounts
  const prevIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    // Only reset if both are defined and they are different, AND we're not just upgrading from a wallet address to a firebase UID
    if (prevIdRef.current && effectiveId && prevIdRef.current !== effectiveId) {
      // Don't reset if we are just transitioning from wallet to Firebase UID on page load
      const isWalletToUid = prevIdRef.current.startsWith('0x') && !effectiveId.startsWith('0x');
      if (!isWalletToUid) {
        useUserStore.getState().resetStore();
      }
    }
    if (effectiveId) {
      prevIdRef.current = effectiveId;
    }
  }, [effectiveId]);

  // ── Streak ────────────────────────────────────────────────────────────────
  const updateStreak = useCallback(async (newStreak: number) => {
    const nowIso = new Date().toISOString();
    setState(prev => ({
      ...prev,
      streak: newStreak,
      lastVisit: nowIso
    }));

    if (effectiveId) {
      try {
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const body: Record<string, string | number | boolean> = { streak: newStreak };

        if (currentUser && effectiveId === currentUser.uid) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          body.isSimulatedWallet = true;
          body.userId = effectiveId;
        }

        await fetch('/api/updateStreak', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error('Failed to update streak via API:', error);
      }
    } else {
      localStorage.setItem('crypdo_streak', String(newStreak));
      localStorage.setItem('crypdo_last_visit', nowIso);
    }
  }, [effectiveId]);

  // ── Firestore sync (Strict Read-Only LocalStorage Principle) ─────────────────
  useEffect(() => {
    let isMounted = true;

    if (effectiveId) {
      setTimeout(() => { if (isMounted) setSyncing(true); }, 0);
      const userRef = doc(db, 'users', effectiveId);

      const unsubscribe = onSnapshot(userRef, async (docSnap) => {
        if (isMounted) {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const localLevel = parseInt(localStorage.getItem('crypdo_level') || '1');
            const localXp = parseInt(localStorage.getItem('crypdo_xp') || '0');
            const savedLevel = Math.max(data.level || 1, localLevel);
            
            let calculatedMaxXp = 1000;
            for (let i = 1; i < savedLevel; i++) {
              calculatedMaxXp = Math.floor(calculatedMaxXp * 1.25);
            }

            // Real-time server side streak verification
            const currentStreak = data.streak || 0;
            const streakCheck = verifyStreak(data.lastVisit);
            let verifiedStreak = currentStreak;

            if (streakCheck.reset && currentStreak > 0) {
              verifiedStreak = 0;
              // Synchronize state asynchronously to prevent race conditions
              setTimeout(() => {
                updateStreak(0);
              }, 100);
            }

            setState({
              level: savedLevel,
              xp: savedLevel > (data.level || 1) ? localXp : (data.xp || 0),
              maxXp: calculatedMaxXp,
              streak: verifiedStreak,
              lastVisit: data.lastVisit || null
            });
          } else if (isConnected && address) {
            // New wallet user, initialize their profile in firestore
            try {
              await setDoc(userRef, {
                uid: address.toLowerCase(),
                xp: 0,
                level: 1,
                streak: 1,
                lastVisit: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Failed to init wallet profile:", err);
            }
          }
        }
        if (isMounted) setSyncing(false);
      }, (error) => {
        console.error('Firestore Reward Sync Error:', error);
        if (isMounted) setSyncing(false);
      });

      return () => { isMounted = false; unsubscribe(); };
    } else {
      // Guest — localStorage fallback (Strictly read ONLY)
      const savedLevel = parseInt(localStorage.getItem('crypdo_level') ?? '1');
      const savedXp = parseInt(localStorage.getItem('crypdo_xp') ?? '0');
      const savedMaxXp = parseInt(localStorage.getItem('crypdo_max_xp') ?? '1000');
      const savedStreak = parseInt(localStorage.getItem('crypdo_streak') ?? '0');
      const savedVisit = localStorage.getItem('crypdo_last_visit') || null;
      setTimeout(() => {
        if (!isMounted) return;
        setState({
          level: savedLevel,
          xp: savedXp,
          maxXp: savedMaxXp,
          streak: savedStreak,
          lastVisit: savedVisit
        });
      }, 0);
      return () => { isMounted = false; };
    }
  }, [effectiveId, isConnected, address, updateStreak]);

  // ─── Auto-Migrate Account (Simulasi ke Real Wallet) ─────────────────────────
  useEffect(() => {
    if (isRealConnected && realAddress && mockAddress && !firebaseUser && !syncing) {
      const migrate = async () => {
        try {
          const res = await fetch('/api/migrateAccount', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fromUserId: mockAddress.toLowerCase(), 
              toUserId: realAddress.toLowerCase(),
              isSimulatedWallet: true,
              userId: realAddress.toLowerCase() // Auth bypass for wallet users
            })
          });

          if (res.ok) {
            localStorage.removeItem('crypdo_mock_wallet');
            useWalletStore.getState().setMockAddress(null);
            console.log('Successfully migrated from mock wallet to real wallet');
          }
        } catch (error) {
          console.error('Failed to migrate account:', error);
        }
      };
      migrate();
    }
  }, [isRealConnected, realAddress, mockAddress, firebaseUser, syncing]);

  // Toast helpers
  const showRewardToast = useCallback((xpGained: number, newTitle: string | null = null) => {
    setToast({ isVisible: true, xp: xpGained, newTitle });
    if (newTitle) {
      playSfx('levelUp');
    } else {
      playSfx('xp');
    }
  }, []);

  const hideRewardToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  // Secure debounced flusher 
  const flushXp = useCallback(async () => {
    const xpToFlush = pendingXpRef.current;
    if (xpToFlush <= 0) return;
    pendingXpRef.current = 0;

    if (effectiveId) {
      try {
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const body: Record<string, string | number | boolean> = { xpGained: xpToFlush };

        if (currentUser && effectiveId === currentUser.uid) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          body.isSimulatedWallet = true;
          body.userId = effectiveId;
        }

        // Integrity validation
        if (xpToFlush > 2000) {
          console.warn("Client validation failed: Single-step XP increment is too high.");
          return;
        }

        const res = await fetch('/api/updateUserProgress', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errMsg = await res.text();
          throw new Error(errMsg || `HTTP error ${res.status}`);
        }
        
        // Let onSnapshot handle syncing the final remote state silently
      } catch (error) {
        console.error('Failed to update user progress via API:', error);
      }
    }
  }, [effectiveId]);

  // ── Debounced and validated addReward ─────────────────────────────────────
  const addReward = useCallback((xpAmount: number) => {
    if (xpAmount <= 0) return;

    // Optimistic UI Update instantly!
    setState(prev => {
      let newXp = prev.xp + xpAmount;
      let newLevel = prev.level;
      let newMaxXp = prev.maxXp;
      let leveledUp = false;

      while (newXp >= newMaxXp) {
        newXp -= newMaxXp;
        newLevel += 1;
        newMaxXp = Math.floor(newMaxXp * 1.25);
        leveledUp = true;
      }

      const newTitle = leveledUp ? getTitleForLevel(newLevel) : null;
      setTimeout(() => showRewardToast(xpAmount, newTitle), 0);

      localStorage.setItem('crypdo_level', String(newLevel));
      localStorage.setItem('crypdo_xp', String(newXp));
      localStorage.setItem('crypdo_max_xp', String(newMaxXp));

      return {
        ...prev,
        level: newLevel,
        xp: newXp,
        maxXp: newMaxXp
      };
    });

    pendingXpRef.current += xpAmount;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushXp();
    }, 450);
  }, [flushXp, showRewardToast]);

  // ── Reset ──────────────────────────────────────────────────────────────────
  const resetProgress = useCallback(async () => {
    if (effectiveId) {
      try {
        const currentUser = auth.currentUser;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        const body: Record<string, string | number | boolean> = {};

        if (currentUser && effectiveId === currentUser.uid) {
          const token = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          body.isSimulatedWallet = true;
          body.userId = effectiveId;
        }

        const res = await fetch('/api/resetProgress', {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errMsg = await res.text();
          throw new Error(errMsg || `HTTP error ${res.status}`);
        }

        // Server handles the Firestore update; onSnapshot will sync state automatically
      } catch (error) {
        console.error('Failed to reset progress via API:', error);
        // Fallback: reset locally
        setState({
          level: 1,
          xp: 0,
          maxXp: 1000,
          streak: 0,
          lastVisit: null
        });
      }
    } else {
      setState({
        level: 1,
        xp: 0,
        maxXp: 1000,
        streak: 0,
        lastVisit: null
      });
    }
  }, [effectiveId]);

  return (
    <RewardContext.Provider value={{
      level, xp, maxXp, streak, title,
      addReward, resetProgress, updateStreak,
      toast, showRewardToast, hideRewardToast,
      syncing,
      verifyStreak,
      lastVisit,
    }}>
      {children}
    </RewardContext.Provider>
  );
}

export const useReward = () => {
  const ctx = useContext(RewardContext);
  if (!ctx) throw new Error('useReward harus dipakai di dalam RewardProvider');
  return ctx;
};
