import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle, 
  Lock, 
  Play, 
  Clock, 
  Zap, 
  ArrowLeft 
} from 'lucide-react';
import { 
  learningTracks, 
  getModulesByTrack, 
  type LearningModule, 
  type LearningTrackID 
} from '../../data/learningTracks';
import { playSfx } from '../../lib/audio';

interface LearningPathDetailProps {
  trackId: LearningTrackID;
  completedIds: number[];
  onBack: () => void;
  onOpenModule: (module: LearningModule) => void;
}

export default function LearningPathDetail({ 
  trackId, 
  completedIds, 
  onBack, 
  onOpenModule 
}: LearningPathDetailProps) {
  
  const currentTrack = learningTracks.find(t => t.id === trackId);
  if (!currentTrack) return null;

  const [modules, setModules] = useState<LearningModule[]>([]);
  const [isLoadingProgress, setIsLoadingProgress] = useState(true);

  useEffect(() => {
    setIsLoadingProgress(true);
    const timer = setTimeout(() => {
      const trackModules = getModulesByTrack(trackId);
      setModules(trackModules);
      setIsLoadingProgress(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [trackId]);

  const completedCount = modules.filter(m => completedIds.includes(m.id)).length;
  const progressPercentage = modules.length > 0 
    ? Math.round((completedCount / modules.length) * 100) 
    : 0;

  // Find unique phases
  const phases = Array.from(new Set(modules.map(m => m.phase))).sort((a, b) => a - b);

  // Helper to determine unlocked states within a playlist
  const isModuleUnlockedInTrack = (module: LearningModule) => {
    // First module of a track's modules array is always unlocked
    const sortedTrackMods = [...modules].sort((a, b) => a.id - b.id);
    const index = sortedTrackMods.findIndex(m => m.id === module.id);
    if (index === 0) return true;
    
    // Otherwise, previous module in sorted order must be completed
    const prevModule = sortedTrackMods[index - 1];
    return completedIds.includes(prevModule.id);
  };

  return (
    <motion.div
      key="playlist"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 text-slate-300"
    >
      {/* Header / Navigation Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={() => { playSfx('click'); onBack(); }}
          onMouseEnter={() => playSfx('hover')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/5 bg-surface-dark hover:border-vibrant-purple hover:text-white text-xs font-black text-slate-400 uppercase tracking-widest italic transition-all shadow-md cursor-pointer mr-auto md:mr-0"
        >
          <ArrowLeft size={14} /> Kembali ke Hub Akademi
        </button>
        
        <span className="text-[10px] text-slate-500 tracking-wide font-medium font-mono italic">
          *Selesaikan pelajaran berurutan untuk membuka modul selanjutnya.
        </span>
      </div>

      {isLoadingProgress ? (
        <div className="space-y-12">
          {/* Skeleton Header Cover */}
          <div className="h-64 bg-surface-dark/30 animate-pulse border-2 border-border-purple/20 rounded-[2.5rem] flex flex-col justify-end p-8 md:p-12 gap-4">
            <div className="h-10 w-2/3 bg-slate-800 rounded-xl" />
            <div className="h-6 w-1/2 bg-slate-800/60 rounded-xl" />
            <div className="h-4 w-32 bg-slate-800/40 rounded-xl mt-4" />
          </div>

          {/* Skeleton Phase Grid */}
          <div className="space-y-6">
            <div className="h-8 w-64 bg-slate-800/60 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 rounded-[2rem] border border-slate-800 bg-surface-dark/40 animate-pulse min-h-[220px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <div className="h-4 w-12 bg-slate-800 rounded-lg" />
                      <div className="h-4 w-16 bg-slate-800 rounded-lg" />
                    </div>
                    <div className="h-6 w-4/5 bg-slate-800/80 rounded-xl" />
                    <div className="h-12 w-full bg-slate-800/40 rounded-2xl" />
                  </div>
                  <div className="h-4 w-24 bg-slate-800/60 rounded-xl pt-4 border-t border-white/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          Belum ada modul untuk track ini. Segera hadir ya Senior!
        </div>
      ) : (
        <>
          {/* Track Cover Banner dengan Progress Bar */}
          <section className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-surface-dark border-2 border-border-purple shadow-3xl">
            {/* Decorative glowing gradient backdrop */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-vibrant-purple/10 rounded-full blur-[80px]" />
            <div className="absolute -bottom-4 -left-4 w-60 h-60 bg-gold-accent/5 rounded-full blur-[80px]" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="text-7xl">{currentTrack.emoji}</div>
                  <div>
                    <span className="text-[8px] bg-gold-accent/20 text-gold-accent px-2 py-0.5 rounded font-black uppercase tracking-wider italic">Kelas Masterclass</span>
                    <h1 className="text-3xl md:text-4xl font-black text-white italic uppercase tracking-tighter mt-1">{currentTrack.title}</h1>
                    <p className="text-slate-400 mt-1.5 font-bold italic text-sm md:text-base leading-relaxed max-w-xl">{currentTrack.desc}</p>
                  </div>
                </div>
                
                <div className="text-left md:text-right shrink-0">
                </div>
              </div>

              {/* Progress Bar yang lebih elegan */}
              <div className="mb-10">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-400 font-medium">Progress Track</span>
                  <span className="font-bold text-gold-accent">{progressPercentage}%</span>
                </div>
                <div className="relative h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="absolute h-full bg-gradient-to-r from-vibrant-purple via-purple-500 to-gold-accent rounded-full"
                  />
                </div>
                <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                  <span>{completedCount} modul selesai</span>
                  <span>dari {modules.length}</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── LIST LESSON MODULES GANGED BY PHASES ── */}
          <div className="space-y-12">
            {phases.map((phaseNum) => {
              const phaseModules = modules.filter(m => m.phase === phaseNum);
              
              const phaseHeading = phaseNum === 1 
                ? "Fase Belajar I: Teori & Pengenalan" 
                : "Fase Belajar II: Praktek & Teknik Taktis";

              return (
                <div key={phaseNum} className="space-y-6">
                  <div className="flex items-center gap-4 border-b border-border-purple/20 pb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-vibrant-purple to-gold-accent flex items-center justify-center text-black font-black italic shadow-lg rotate-3">
                      0{phaseNum}
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-gold-accent tracking-widest block uppercase">Fase {phaseNum}</span>
                      <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">{phaseHeading}</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {phaseModules.map((module) => {
                      const isCompleted = completedIds.includes(module.id);
                      const isUnlocked = isModuleUnlockedInTrack(module);

                      return (
                        <motion.div
                          key={module.id}
                          whileHover={isUnlocked ? { scale: 1.02, y: -4 } : {}}
                          whileTap={isUnlocked ? { scale: 0.98 } : {}}
                          onMouseEnter={() => isUnlocked && playSfx('hover')}
                          onClick={() => {
                            if (isUnlocked) {
                              playSfx('click');
                              onOpenModule(module);
                            }
                          }}
                          className={`relative p-6 rounded-[2rem] border transition-all flex flex-col justify-between overflow-hidden min-h-[220px] ${
                            isCompleted 
                              ? 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500' 
                              : !isUnlocked 
                              ? 'border-slate-800 bg-black/10 opacity-40 cursor-not-allowed' 
                              : 'border-border-purple bg-surface-dark hover:border-vibrant-purple cursor-pointer group shadow-xl'
                          }`}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-vibrant-purple/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />

                          <div>
                            {/* Top Action / Status Icon Bar */}
                            <div className="flex justify-between items-center mb-6">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  isCompleted 
                                    ? 'bg-emerald-500/20 text-emerald-400' 
                                    : !isUnlocked 
                                    ? 'bg-slate-900 text-slate-500' 
                                    : 'bg-vibrant-purple/20 text-vibrant-purple'
                                }`}>
                                  ID: 0{module.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tighter flex items-center gap-1">
                                  <Clock size={10} /> {module.duration}
                                </span>
                              </div>
                              
                              {isCompleted ? (
                                <CheckCircle size={20} className="text-emerald-500 filter drop-shadow-[0_0_8px_#10b981]" />
                              ) : !isUnlocked ? (
                                <Lock size={16} className="text-slate-600" />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-vibrant-purple/10 flex items-center justify-center text-vibrant-purple group-hover:bg-vibrant-purple group-hover:text-black transition-all">
                                  <Play size={10} className="ml-0.5" />
                                </div>
                              )}
                            </div>

                            {/* Title & Desc */}
                            <h3 className={`font-black text-lg italic uppercase leading-snug tracking-tight mb-2 group-hover:text-gold-accent transition-colors line-clamp-2 ${
                              isCompleted ? 'text-slate-300' : 'text-white'
                            }`}>
                              {module.title}
                            </h3>
                            <p className="text-slate-500 text-xs font-bold leading-normal italic line-clamp-2 mb-6">
                              {module.desc}
                            </p>
                          </div>

                          {/* Reward XP Info */}
                          <div className="flex justify-between items-center pt-4 border-t border-white/5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rewards</span>
                            <span className={`font-black text-xs group-hover:scale-105 transition-transform flex items-center gap-1 ${
                              isCompleted ? 'text-emerald-400 font-bold' : 'text-gold-accent'
                            }`}>
                              <Zap size={10} /> +{module.xp} XP
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
