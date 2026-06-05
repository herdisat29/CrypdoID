import { motion } from 'motion/react';
import { Trophy, ArrowRight, CheckCircle, Target, Zap, Shield, Gift, HelpCircle, BookOpen, Flame, Share2, Star, Search, AlertTriangle, GraduationCap, LucideIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { doc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';

import { useReward } from '../../contexts/RewardContext';
import { useAuth } from '../auth/AuthContext';
import { useWalletStore } from '../../store/walletStore';
import { db, auth } from '../../lib/firebase';
import DailyStreak from '../dashboard/components/DailyStreak';
import MintBadgeButton from '../../components/common/MintBadgeButton';
import { playSfx } from '../../lib/audio';

const iconsMap: Record<string, LucideIcon> = { Target, Zap, Shield, Search, Gift, BookOpen, Flame, Share2, Star, AlertTriangle, GraduationCap, Trophy };

interface Mission {
  id: number;
  title: string;
  desc: string;
  progress: number;
  xpReward: number;
  icon: string;
  view: string;
  status: 'locked' | 'in-progress' | 'completed' | 'claimed';
  action: string;
}

const initialMissions: Mission[] = [
  {
    id: 1,
    title: 'Temukan Archetype Kamu',
    desc: 'Quiz ini akan nunjukin gaya crypto kamu biar gak salah langkah.',
    progress: 0,
    xpReward: 500,
    icon: 'Target',
    view: 'quiz',
    status: 'in-progress',
    action: 'Start Quiz',
  },
  {
    id: 2,
    title: 'Ikuti Learning Path',
    desc: 'Mulai belajar fundamental sesuai archetype yang lo dapetin.',
    progress: 0,
    xpReward: 1200,
    icon: 'Zap',
    view: 'learning',
    status: 'locked',
    action: 'Explore Learning Path',
  },
  {
    id: 3,
    title: 'Scan Project Pertama',
    desc: 'Coba Scam detector buat ngecek project yang lagi lo incer.',
    progress: 0,
    xpReward: 300,
    icon: 'Shield',
    view: 'security',
    status: 'locked',
    action: 'Start Scan',
  },
  {
    id: 4,
    title: 'Scan 3 Token Berbeda',
    desc: 'Practice makes perfect. Scan 3 project berbeda buat asah insting scam detector lo.',
    progress: 0,
    xpReward: 500,
    icon: 'Search',
    view: 'security',
    status: 'locked',
    action: 'Scan Token',
  },
  {
    id: 5,
    title: 'Selesaikan 1 Modul Belajar',
    desc: 'Pilih topik yang sesuai archetype lo dan selesaikan satu modul sampai tuntas.',
    progress: 0,
    xpReward: 800,
    icon: 'BookOpen',
    view: 'learning',
    status: 'locked',
    action: 'Buka Learning Path',
  },
  {
    id: 6,
    title: 'Streak 3 Hari Berturut',
    desc: 'Login dan belajar 3 hari berturut-turut. Konsistensi adalah senjata terkuat di crypto.',
    progress: 0,
    xpReward: 400,
    icon: 'Flame',
    view: 'dashboard',
    status: 'locked',
    action: 'Lihat Streak',
  },
  {
    id: 7,
    title: 'Temukan Token Honeypot',
    desc: 'Scan satu token yang terbukti HONEYPOT. Biar lo tau rasanya hampir kena jebakan.',
    progress: 0,
    xpReward: 600,
    icon: 'AlertTriangle',
    view: 'security',
    status: 'locked',
    action: 'Scan Honeypot',
  },
  {
    id: 8,
    title: 'Share Archetype Lo',
    desc: 'Kasih tau dunia lo tipe crypto apa. Klik tombol share di halaman hasil quiz.',
    progress: 0,
    xpReward: 200,
    icon: 'Share2',
    view: 'quiz',
    status: 'locked',
    action: 'Lihat Archetype',
  },
  {
    id: 9,
    title: 'Selesaikan 1 Learning Track Penuh',
    desc: 'Tamatkan semua modul dalam satu track belajar. Dari awal sampai badge tersebut.',
    progress: 0,
    xpReward: 1500,
    icon: 'GraduationCap',
    view: 'learning',
    status: 'locked',
    action: 'Lanjut Belajar',
  },
  {
    id: 10,
    title: 'CrypdoID Master',
    desc: 'Selesaikan semua mission sebelumnya. Lo udah siap jalan di Web3 tanpa bego-bego.',
    progress: 0,
    xpReward: 2000,
    icon: 'Trophy',
    view: 'dashboard',
    status: 'locked',
    action: 'Claim Gelar',
  },
];

import { View } from '../../types';

interface MissionHubProps {
  onNavigate?: (view: View) => void;
}

export default function MissionHub({ onNavigate }: MissionHubProps) {
  const { user: firebaseUser } = useAuth();
  const { addReward } = useReward();
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [loading, setLoading] = useState(true);
  const [claimingIds, setClaimingIds] = useState<Set<number>>(new Set());

  const mockAddress = useWalletStore(state => state.mockAddress);
  const realAddress = useWalletStore(state => state.realAddress);
  const effectiveId = mockAddress?.toLowerCase() || firebaseUser?.uid;

  // 1. Persist completion to Firestore when changed
  const updateMissionInFirestore = async (missionId: number, status: string, progress: number) => {
    if (!effectiveId) return;
    const missionRef = doc(db, "users", effectiveId, "missions", missionId.toString());
    try {
      await setDoc(missionRef, {
        missionId,
        status,
        progress,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Failed to sync mission:", error);
    }
  };

  // 2. Load missions
  const loadMissions = async (isMounted: boolean) => {
    if (!effectiveId) {
      setMissions(initialMissions);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Timeout fallback: kalau Firebase > 4 detik, pakai localStorage
    let settled = false;
    const fallback = setTimeout(() => {
      if (!settled && isMounted) {
        settled = true;
        console.warn('Firebase timeout — falling back to localStorage');
        const local = localStorage.getItem('crypdo_missions');
        try {
          setMissions(local ? JSON.parse(local) : initialMissions);
        } catch {
          setMissions(initialMissions);
        }
        setLoading(false);
      }
    }, 4000);

    try {
      const missionsRef = collection(db, 'users', effectiveId, 'missions');
      const snap = await getDocs(missionsRef);

      // Firebase berhasil respond sebelum timeout
      settled = true;
      clearTimeout(fallback);

      let loadedMissions: Mission[] = [...initialMissions];
      const remoteData: Record<string, { status: string; progress?: number }> = {};

      if (!snap.empty) {
        snap.docs.forEach(doc => {
          const data = doc.data();
          remoteData[doc.id] = { status: data.status, progress: data.progress };
        });

        loadedMissions = initialMissions.map(m => {
          const remote = remoteData[m.id.toString()];
          if (remote) {
            return {
              ...m,
              status: remote.status as 'locked' | 'in-progress' | 'completed' | 'claimed',
              progress: remote.progress || (remote.status === 'completed' || remote.status === 'claimed' ? 100 : 0),
              action: remote.status === 'claimed' ? 'Reward Claimed' : remote.status === 'completed' ? 'Claim Reward' : m.action,
            };
          }
          return m;
        });
      }

      const hasArchetype = localStorage.getItem('crypdo_archetype');
      const hasRoadmap = localStorage.getItem('crypdo_roadmap_started');
      const scanCount = parseInt(localStorage.getItem('crypdo_scan_count') || '0');
      const completedModules = (() => { try { return JSON.parse(localStorage.getItem('crypdo_completed_modules_list') || '[]'); } catch { return []; } })();
      const streak = parseInt(localStorage.getItem('crypdo_streak') || '0');
      const hasHoneypot = localStorage.getItem('crypdo_honeypot_found');
      const hasSharedArchetype = localStorage.getItem('crypdo_shared_archetype');
      const hasFullTrack = localStorage.getItem('crypdo_full_track_complete');

      let needsSync = false;
      const syncedMissions = loadedMissions.map((m, _, arr) => {
        let updated = { ...m };
        const isClearedById = (id: number) => {
          const found = arr.find(x => x.id === id);
          return found?.status === 'completed' || found?.status === 'claimed';
        };

        if (m.id === 1 && hasArchetype && m.status === 'in-progress') {
          updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' };
          needsSync = true;
        }
        if (m.id === 2 && (isClearedById(1) || hasArchetype)) {
          if (hasRoadmap && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 3 && isClearedById(2)) {
          if (scanCount >= 1 && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 4 && isClearedById(3)) {
          const pct = Math.min((scanCount / 3) * 100, 100);
          if (scanCount >= 3 && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const, progress: pct };
          else updated = { ...m, progress: pct };
        }
        if (m.id === 5 && isClearedById(4)) {
          if (completedModules.length >= 1 && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 6 && isClearedById(5)) {
          const pct = Math.min((streak / 3) * 100, 100);
          if (streak >= 3 && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const, progress: pct };
          else updated = { ...m, progress: pct };
        }
        if (m.id === 7 && isClearedById(6)) {
          if (hasHoneypot && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 8 && isClearedById(7)) {
          if (hasSharedArchetype && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 9 && isClearedById(8)) {
          if (hasFullTrack && m.status !== 'claimed' && m.status !== 'completed') { updated = { ...m, status: 'completed' as const, progress: 100, action: 'Claim Reward' }; needsSync = true; }
          else if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }
        if (m.id === 10 && [1, 2, 3, 4, 5, 6, 7, 8, 9].every(id => isClearedById(id))) {
          if (m.status === 'locked') updated = { ...m, status: 'in-progress' as const };
        }

        return updated;
      });

      if (needsSync && effectiveId) {
        syncedMissions.forEach(m => {
          const mid = m.id.toString();
          if (m.status === 'completed' && (!remoteData[mid] || remoteData[mid].status !== 'completed')) {
            updateMissionInFirestore(m.id, 'completed', 100);
          }
        });
      }

      // Simpan ke localStorage sebagai cache
      localStorage.setItem('crypdo_missions', JSON.stringify(syncedMissions));

      if (isMounted) {
        setMissions(syncedMissions);
        setLoading(false);
      }
    } catch (error) {
      settled = true;
      clearTimeout(fallback);
      console.error('Failed to load missions:', error);
      if (isMounted) {
        const local = localStorage.getItem('crypdo_missions');
        try { setMissions(local ? JSON.parse(local) : initialMissions); }
        catch { setMissions(initialMissions); }
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        loadMissions(isMounted);
      }
    }, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  const handleClaim = async (missionId: number) => {
    if (claimingIds.has(missionId)) return;
    setClaimingIds(prev => new Set(prev).add(missionId));

    const mission = missions.find(m => m.id === missionId);
    if (mission?.status === 'completed') {
      // Security Check: Enforce sequential restrictions
      if (missionId > 1 && missionId <= 10) {
        const prevMission = missions.find(x => x.id === missionId - 1);
        if (prevMission && prevMission.status !== 'claimed' && prevMission.status !== 'completed') {
          alert(`Eits Senior, gak bisa bypass! Selesaiin Mission ${missionId - 1} dulu ya.`);
          setClaimingIds(prev => {
            const next = new Set(prev);
            next.delete(missionId);
            return next;
          });
          return;
        }
      }

      // Sync state transition securely using Backend API (Anti-Cheat Server Endpoint)
      if (effectiveId) {
        try {
          const currentUser = auth.currentUser;
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          const body: Record<string, string | number | boolean> = { missionId };

          if (currentUser && effectiveId === currentUser.uid) {
            const token = await currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          } else {
            body.isSimulatedWallet = true;
            body.userId = effectiveId;
          }

          const res = await fetch('/api/claimMission', {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const errMsg = await res.text();
            throw new Error(errMsg || `HTTP error ${res.status}`);
          }

          // Trigger rewards locally without double-adding to Firestore (since the server did it)
          // To ensure correct reactive display updates, we update local mission state
          const newMissions = missions.map(m => {
            if (m.id === missionId) {
              return { ...m, status: 'claimed' as const, action: 'Reward Claimed', progress: 100 };
            }
            if (m.id === missionId + 1 && m.status === 'locked') {
              return { ...m, status: 'in-progress' as const };
            }
            return m;
          });

          setMissions(newMissions);
          // Persist claimed state so it survives refresh
          localStorage.setItem('crypdo_missions', JSON.stringify(newMissions));
          playSfx('claim');
          addReward(mission.xpReward); // Add local reward toast
        } catch (error) {
          console.warn("Failed to claim mission securely on server, falling back to local simulation:", error);

          // Graceful local progression fallback so user is never blocked in dev/sandbox
          addReward(mission.xpReward);

          const newMissions = missions.map(m => {
            if (m.id === missionId) {
              return { ...m, status: 'claimed' as const, action: 'Reward Claimed', progress: 100 };
            }
            if (m.id === missionId + 1 && m.status === 'locked') {
              return { ...m, status: 'in-progress' as const };
            }
            return m;
          });

          setMissions(newMissions);
          // Save cache
          localStorage.setItem('crypdo_missions', JSON.stringify(newMissions));
          playSfx('claim');
        }
      } else {
        // Guest mode - purely local progression
        addReward(mission.xpReward);

        const newMissions = missions.map(m => {
          if (m.id === missionId) {
            return { ...m, status: 'claimed' as const, action: 'Reward Claimed', progress: 100 };
          }
          if (m.id === missionId + 1 && m.status === 'locked') {
            return { ...m, status: 'in-progress' as const };
          }
          return m;
        });

        setMissions(newMissions);
        // Guest mode: persist claimed state to localStorage so refresh doesn't revert it
        localStorage.setItem('crypdo_missions', JSON.stringify(newMissions));
        playSfx('claim');
      }
    }

    setClaimingIds(prev => {
      const next = new Set(prev);
      next.delete(missionId);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[60vh]">
        <div className="w-16 h-16 rounded-full border-4 border-vibrant-purple/20 border-t-vibrant-purple animate-spin" />
        <p className="text-vibrant-purple font-black uppercase tracking-widest text-xs animate-pulse">Sinkronisasi Data...</p>
      </div>
    );
  }

  // Check if badges are collected/minted
  const checkBadge = (tier: number) => {
    if (realAddress && localStorage.getItem(`crypdo_minted_${realAddress.toLowerCase()}_tier${tier}`) === 'true') return true;
    if (effectiveId && localStorage.getItem(`crypdo_minted_${effectiveId.toLowerCase()}_tier${tier}`) === 'true') return true;
    return false;
  };
  const mintedBronze = checkBadge(1);
  const mintedSilver = checkBadge(2);
  const mintedGold = checkBadge(3);
  const collectedCount = [mintedBronze, mintedSilver, mintedGold].filter(Boolean).length;

  return (
    <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto py-10 px-6 gap-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-accent/10 border border-gold-accent/20 text-gold-accent text-[10px] font-black uppercase tracking-[0.3em]">
          <Trophy size={14} />
          Main Quest Line
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic uppercase leading-none">
          GRIND <span className="text-gold-accent">MISSIONS</span>
        </h1>
        <p className="text-slate-500 font-bold text-lg md:text-2xl italic">
          Selesaikan Misi, Ambil Loot-nya!
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <DailyStreak />

        {/* Badge Progress Tracker */}
        <div className="bg-surface-dark/40 backdrop-blur-md border border-border-purple/30 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-vibrant-purple/5 to-gold-accent/5 pointer-events-none" />
          <div className="space-y-1 text-center sm:text-left z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-vibrant-purple/10 border border-vibrant-purple/20 text-vibrant-purple text-[8px] font-black uppercase tracking-[0.2em] mb-1">
              <Star size={10} className="animate-pulse" />
              Milestone NFT Badges
            </div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
              Badge Terkumpul: <span className="text-gold-accent font-black">{collectedCount}/3</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-bold italic max-w-xs leading-normal">
              Tamatkan mission untuk unlock & mint NFT Badge resmi di blockchain Base Mainnet.
            </p>
          </div>

          {/* Badges Display */}
          <div className="flex gap-4 z-10 shrink-0">
            {/* Bronze Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border flex items-center justify-center relative group transition-all duration-300 ${mintedBronze
                ? 'border-[#cd7f32] bg-[#cd7f32]/10 text-[#cd7f32] shadow-[0_0_12px_rgba(205,127,50,0.3)] scale-105'
                : 'border-slate-800 bg-slate-900/60 text-slate-600 grayscale opacity-40'
                }`}>
                <img src="/badge_mission_5_scholar.svg" alt="Scholar Badge" className={`w-10 h-10 md:w-20 md:h-20 object-contain ${mintedBronze ? 'animate-bounce' : ''}`} />
                {mintedBronze && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#cd7f32] text-black font-black text-[9px] md:text-[10px] flex items-center justify-center border-2 border-black shadow">
                    I
                  </div>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider ${mintedBronze ? 'text-[#cd7f32]' : 'text-slate-600'}`}>
                Scholar
              </span>
            </div>

            {/* Silver Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border flex items-center justify-center relative group transition-all duration-300 ${mintedSilver
                ? 'border-[#e2e8f0] bg-[#e2e8f0]/10 text-[#e2e8f0] shadow-[0_0_12px_rgba(226,232,240,0.3)] scale-105'
                : 'border-slate-800 bg-slate-900/60 text-slate-600 grayscale opacity-40'
                }`}>
                <img src="/badge_mission_9_master.svg" alt="Master Badge" className={`w-10 h-10 md:w-20 md:h-20 object-contain ${mintedSilver ? 'animate-bounce' : ''}`} />
                {mintedSilver && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#e2e8f0] text-black font-black text-[9px] md:text-[10px] flex items-center justify-center border-2 border-black shadow">
                    II
                  </div>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider ${mintedSilver ? 'text-[#e2e8f0]' : 'text-slate-600'}`}>
                Master
              </span>
            </div>

            {/* Gold Badge */}
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border flex items-center justify-center relative group transition-all duration-300 ${mintedGold
                ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.3)] scale-105'
                : 'border-slate-800 bg-slate-900/60 text-slate-600 grayscale opacity-40'
                }`}>
                <img src="/badge_mission_10_legend.svg" alt="Legend Badge" className={`w-10 h-10 md:w-20 md:h-20 object-contain ${mintedGold ? 'animate-bounce' : ''}`} />
                {mintedGold && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#ffd700] text-black font-black text-[9px] md:text-[10px] flex items-center justify-center border-2 border-black shadow">
                    III
                  </div>
                )}
              </div>
              <span className={`text-[8px] font-black uppercase tracking-wider ${mintedGold ? 'text-[#ffd700]' : 'text-slate-600'}`}>
                Legend
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
        {missions.map((mission, index) => {
          const isDone = mission.status === 'completed' || mission.status === 'claimed';
          const isActive = mission.status === 'in-progress';
          const isLocked = mission.status === 'locked';
          const isClaimed = mission.status === 'claimed';

          const Icon = iconsMap[mission.icon] ?? HelpCircle;

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onMouseEnter={() => playSfx('hover')}
              whileHover={{ y: -5, scale: 1.01 }}
              className={`group p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border-2 transition-all relative overflow-hidden flex flex-col h-full bg-surface-dark ${isDone
                ? 'border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.05)]'
                : isActive
                  ? 'border-vibrant-purple/40 shadow-[0_0_40px_rgba(126,34,206,0.05)]'
                  : 'border-border-purple opacity-60 grayscale'
                }`}
            >
              {/* Background glow */}
              <div className={`absolute -right-20 -top-20 w-48 h-48 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity rounded-full ${isActive ? 'bg-vibrant-purple' : isDone ? 'bg-emerald-500' : 'bg-slate-500'
                }`} />

              {/* Top row */}
              <div className="flex items-start justify-between relative z-10">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border-2 transition-all group-hover:scale-110 ${isLocked
                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                  : isDone
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    : 'bg-vibrant-purple/10 border-vibrant-purple/20 text-vibrant-purple'
                  }`}>
                  <Icon size={32} />
                </div>

                {isDone ? (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${isClaimed
                    ? 'bg-emerald-500 text-black border-emerald-500'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                    }`}>
                    {isClaimed ? <Gift size={16} /> : <CheckCircle size={16} />}
                    <span className="text-[10px] font-black uppercase">
                      {isClaimed ? 'CLAIMED' : 'SYNCED'}
                    </span>
                  </div>
                ) : isLocked ? (
                  <div className="text-[10px] font-black italic text-slate-600 bg-black/40 px-4 py-1 rounded-full border border-white/5 uppercase">
                    Locked
                  </div>
                ) : (
                  <div className="text-[10px] font-black italic text-gold-accent bg-gold-accent/10 px-4 py-1 rounded-full border border-gold-accent/20 uppercase tracking-widest animate-pulse">
                    Active
                  </div>
                )}
              </div>

              {/* Body */}
              <div className="mt-10 relative z-10 flex-1">
                <h3 className={`text-3xl font-black italic uppercase tracking-tighter mb-3 leading-none ${isLocked ? 'text-slate-600' : 'text-white'
                  }`}>{mission.title}</h3>
                <p className="text-slate-500 text-base font-bold leading-snug">{mission.desc}</p>

                {/* Progress bar */}
                <div className="mt-8 space-y-3">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-600">Progress</span>
                    <span className={isDone ? 'text-emerald-400' : 'text-white'}>
                      {Math.round(mission.progress)}%
                    </span>
                  </div>
                  <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className={`h-full rounded-full ${isDone
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'bg-gradient-to-r from-vibrant-purple to-purple-400 shadow-[0_0_10px_rgba(126,34,206,0.5)]'
                        }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${mission.progress}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-10 pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between relative z-10">
                {/* XP reward — no more BITS */}
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">XP REWARD</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold-accent animate-pulse shadow-[0_0_8px_#facc15]" />
                    <span className="text-gold-accent font-black text-lg uppercase tracking-tight italic">
                      +{mission.xpReward} XP
                    </span>
                  </div>
                </div>

                {isClaimed && (mission.id === 5 || mission.id === 9 || mission.id === 10) ? (
                  <div className="w-full sm:w-auto min-w-[200px]">
                    <MintBadgeButton tier={mission.id === 5 ? 1 : mission.id === 9 ? 2 : 3} />
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (mission.status === 'completed') handleClaim(mission.id);
                      else if (mission.status === 'in-progress' && onNavigate) onNavigate(mission.view as View);
                    }}
                    disabled={isLocked || isClaimed || claimingIds.has(mission.id)}
                    onMouseEnter={() => !isLocked && !isClaimed && playSfx('hover')}
                    className={`flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] italic transition-all shadow-xl w-full sm:w-auto ${isLocked
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'
                      : isClaimed
                        ? 'bg-emerald-500/5 text-emerald-500/40 border border-emerald-500/10 cursor-not-allowed'
                        : mission.status === 'completed'
                          ? 'bg-emerald-500 text-black border border-emerald-500 hover:bg-white transition-colors'
                          : 'bg-vibrant-purple text-white hover:bg-gold-accent hover:text-black shadow-vibrant-purple/20'
                      }`}
                  >
                    {mission.action} <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-auto py-12 border-t border-border-purple text-center relative overflow-hidden rounded-[4rem] bg-black/40 border-b-4 border-b-vibrant-purple/20">
        <div className="absolute inset-0 bg-gradient-to-tr from-vibrant-purple/5 to-gold-accent/5 blur-[120px] pointer-events-none" />
        <p className="text-slate-500 text-sm md:text-lg font-black uppercase tracking-widest leading-relaxed px-10 relative z-10">
          Semakin banyak mission yang lo beresin, semakin{' '}
          <span className="text-gold-accent italic">high-level</span> &{' '}
          <span className="text-white italic bg-vibrant-purple px-2 py-0.5 rounded shadow-lg shadow-vibrant-purple/40">SAFU</span>{' '}
          perjalanan crypto lo.
        </p>
      </div>
    </div>
  );
}
