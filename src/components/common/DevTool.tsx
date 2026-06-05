import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, RefreshCcw, Zap, Target, Trash2, X, Flame } from 'lucide-react';
import { useReward } from '../../contexts/RewardContext';
import { useUserStore } from '../../store/userStore';
import { cn } from '../../lib/utils';
import { initialMissions, Mission } from '../../features/missions/missionRules';

export default function DevTool() {
  const [isOpen, setIsOpen] = useState(false);
  const { resetProgress, addReward, streak, updateStreak } = useReward();
  const setProfileFlag = useUserStore(state => state.setProfileFlag);

  const resetMissionProgress = () => {
    localStorage.removeItem('crypdo_archetype');
    localStorage.removeItem('crypdo_roadmap_complete');
    localStorage.removeItem('crypdo_scan_complete');
    localStorage.removeItem('crypdo_missions');
    localStorage.removeItem('crypdo_level');
    localStorage.removeItem('crypdo_xp');
    localStorage.removeItem('crypdo_max_xp');
    resetProgress(); // This handles Firestore reset too
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  const resetAllData = () => {
    localStorage.clear();
    resetProgress();
    window.location.reload();
  };

  const simulateArchetype = () => {
    localStorage.setItem('crypdo_archetype', 'conviction_holder');
    window.dispatchEvent(new Event('storage'));
  };

  const simulateRoadmap = () => {
    localStorage.setItem('crypdo_roadmap_complete', 'true');
    window.dispatchEvent(new Event('storage'));
  };

  const simulateScan = () => {
    localStorage.setItem('crypdo_scan_complete', 'true');
    window.dispatchEvent(new Event('storage'));
  };

  const simulateHoneypotDone = () => {
    // Force set flags in user store
    const store = useUserStore.getState();
    store.setArchetype('conviction_holder');
    store.setProfileFlag('hasRoadmapStarted', true);
    store.setProfileFlag('scanCount', 3);
    store.addCompletedModule(1);
    store.setProfileFlag('hasHoneypot', true);

    // Direct bulletproof write to localStorage crypdo_missions
    let currentMissions: Mission[] = [...initialMissions];
    const local = localStorage.getItem('crypdo_missions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentMissions = parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    const updatedMissions = currentMissions.map(m => {
      if (m.id < 6) {
        return {
          ...m,
          status: 'claimed' as const,
          progress: 100,
          action: 'Reward Claimed'
        };
      } else if (m.id === 6) {
        return {
          ...m,
          status: 'completed' as const,
          progress: 100,
          action: 'Claim Reward'
        };
      }
      return m;
    });

    localStorage.setItem('crypdo_missions', JSON.stringify(updatedMissions));
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  const simulateMissions1to5Done = () => {
    const store = useUserStore.getState();
    store.setArchetype('conviction_holder');
    store.setProfileFlag('hasRoadmapStarted', true);
    store.setProfileFlag('scanCount', 3);
    store.addCompletedModule(1);

    let currentMissions: Mission[] = [...initialMissions];
    const local = localStorage.getItem('crypdo_missions');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          currentMissions = parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    const updatedMissions = currentMissions.map(m => {
      if (m.id < 6) {
        return {
          ...m,
          status: 'claimed' as const,
          progress: 100,
          action: 'Reward Claimed'
        };
      }
      if (m.id === 6 && m.status === 'locked') {
        return {
          ...m,
          status: 'in-progress' as const,
          progress: 0,
          action: 'Scan Honeypot'
        };
      }
      return m;
    });

    localStorage.setItem('crypdo_missions', JSON.stringify(updatedMissions));
    window.dispatchEvent(new Event('storage'));
    window.location.reload();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all",
          isOpen ? "bg-red-500 rotate-90" : "bg-slate-800 text-gold-accent hover:scale-110"
        )}
      >
        {isOpen ? <X size={20} /> : <Terminal size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-16 right-0 w-80 bg-surface-dark border-2 border-border-purple rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-border-purple pb-4">
              <Terminal size={16} className="text-vibrant-purple" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest italic">Senior Developer</h3>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rewards Control</p>
              <button 
                onClick={() => addReward(1000)}
                className="w-full py-3 bg-vibrant-purple/10 border border-vibrant-purple/20 rounded-xl text-vibrant-purple text-[10px] font-black uppercase hover:bg-vibrant-purple hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Zap size={14} /> +1000 XP (Level Up)
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Streak Control</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    const newStreak = Math.max(0, streak - 1);
                    updateStreak(newStreak);
                    setProfileFlag('streak', newStreak);
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase hover:border-vibrant-purple/50 transition-all flex items-center justify-center gap-1"
                >
                  -1 Streak
                </button>
                <button 
                  onClick={() => {
                    const newStreak = streak + 1;
                    updateStreak(newStreak);
                    setProfileFlag('streak', newStreak);
                  }}
                  className="flex-1 py-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-[10px] font-black uppercase hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-1"
                >
                  <Flame size={12} className="text-orange-500" /> +1 Streak ({streak})
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulation</p>
              <div className="grid grid-cols-1 gap-2">
                <button 
                  onClick={simulateArchetype}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase hover:border-vibrant-purple/50 transition-all flex items-center justify-between px-4"
                >
                  Archetype Done <Target size={14} />
                </button>
                <button 
                  onClick={simulateRoadmap}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase hover:border-vibrant-purple/50 transition-all flex items-center justify-between px-4"
                >
                  Roadmap Done <Target size={14} />
                </button>
                <button 
                  onClick={simulateScan}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase hover:border-vibrant-purple/50 transition-all flex items-center justify-between px-4"
                >
                  Scan Radar Done <Target size={14} />
                </button>
                <button 
                  onClick={simulateHoneypotDone}
                  className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 text-[10px] font-black uppercase hover:border-vibrant-purple/50 transition-all flex items-center justify-between px-4"
                >
                  Simulate Honeypot Found <Target size={14} />
                </button>
                <button 
                  onClick={simulateMissions1to5Done}
                  className="w-full py-3 bg-vibrant-purple/20 border border-vibrant-purple/40 rounded-xl text-vibrant-purple text-[10px] font-black uppercase hover:bg-vibrant-purple hover:text-white transition-all flex items-center justify-between px-4"
                >
                  ⚡ Clear Missions 1-5 <Zap size={14} />
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border-purple space-y-2">
              <button 
                onClick={resetMissionProgress}
                className="w-full py-3 bg-gold-accent/10 border border-gold-accent/20 rounded-xl text-gold-accent text-[10px] font-black uppercase hover:bg-gold-accent hover:text-black transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw size={14} /> RESET MISSIONS
              </button>
              <button 
                onClick={resetAllData}
                className="w-full py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> WIPE ALL DATA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
