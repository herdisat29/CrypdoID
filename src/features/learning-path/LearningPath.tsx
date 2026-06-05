import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, 
  HelpCircle, 
  ChevronRight, 
  Zap, 
  ArrowLeft, 
  Star 
} from 'lucide-react';
import { useReward } from '../../contexts/RewardContext';
import { 
  learningTracks, 
  allModules, 
  type LearningModule, 
  type LearningTrackID 
} from '../../data/learningTracks';
import LearningPathDetail from './LearningPathDetail';
import { useAuth } from '../auth/AuthContext';
import { useAccount } from 'wagmi';
import { db } from '../../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useUserStore } from '../../store/userStore';
import { playSfx } from '../../lib/audio';

interface LearningPathProps {
  setView?: (view: 'dashboard' | 'quiz' | 'security' | 'learning' | 'missions' | 'assistant' | 'leaderboard') => void;
}

export default function LearningPath({ setView }: LearningPathProps) {
  const { addReward } = useReward();
  const { user: firebaseUser } = useAuth();
  const { address: realAddress } = useAccount();
  const [mockAddress, setMockAddress] = useState(() => localStorage.getItem('crypdo_mock_wallet'));

  useEffect(() => {
    const handleStorage = () => {
      setMockAddress(localStorage.getItem('crypdo_mock_wallet'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const address = mockAddress || realAddress;
  const effectiveId = address?.toLowerCase() || firebaseUser?.uid;
  
  // Track selected branch/playlist
  const [selectedTrackId, setSelectedTrackId] = useState<LearningTrackID | null>(null);

  useEffect(() => {
    useUserStore.getState().setProfileFlag('hasRoadmapStarted', true);
  }, []);

  const completedIds = useUserStore((state) => state.completedModules);
  const addCompletedModule = useUserStore((state) => state.addCompletedModule);
  const setCompletedModules = useUserStore((state) => state.setCompletedModules);
  const userArchetype = useUserStore((state) => state.archetype);
  const setArchetype = useUserStore((state) => state.setArchetype);

  // Fetch from Firestore on mount / ID change
  useEffect(() => {
    if (!effectiveId) return;

    const userRef = doc(db, 'users', effectiveId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Sync Archetype from Firestore real-time
        if (data.archetype) {
          setArchetype(data.archetype);
        }

        if (Array.isArray(data.completedModules)) {
          const ids = data.completedModules.map((item: unknown) => {
            if (typeof item === 'number') return item;
            if (item && typeof item === 'object') {
              const obj = item as { moduleId?: unknown };
              if (typeof obj.moduleId === 'number') {
                return obj.moduleId;
              }
            }
            return null;
          }).filter((id): id is number => id !== null);

          const combined = Array.from(new Set([...useUserStore.getState().completedModules, ...ids]));
          setCompletedModules(combined);
        }
      }
    }, (err) => {
      console.warn("Gagal listen completedModules secara real-time dari Firestore:", err);
    });

    return () => {
      unsubscribe();
    };
  }, [effectiveId, setArchetype, setCompletedModules]);

  // Update localStorage whenever modules get completed
  useEffect(() => {
    localStorage.setItem('crypdo_completed_modules_list', JSON.stringify(completedIds));
    
    // Check if at least one track is fully complete
    const isAnyTrackFullyComplete = learningTracks.some(track => {
      const trackModules = allModules.filter(m => m.trackId === track.id);
      return trackModules.length > 0 && trackModules.every(m => completedIds.includes(m.id));
    });

    const profile = useUserStore.getState();
    if (isAnyTrackFullyComplete) {
      profile.setProfileFlag('hasFullTrack', true);
    } else {
      profile.setProfileFlag('hasFullTrack', false);
    }

    // Check if everything is complete
    if (completedIds.length >= allModules.length) {
      localStorage.setItem('crypdo_roadmap_complete', 'true');
    }
  }, [completedIds]);

  // Active module states for quiz modal
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [modalPhase, setModalPhase] = useState<'content' | 'quiz' | 'congrats'>('content');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle opening a module
  const handleOpenModule = (module: LearningModule) => {
    setSelectedModule(module);
    setModalPhase('content');
    setSelectedOption(null);
    setIsAnswered(false);
    setErrorMessage('');
  };

  const handleNextToQuiz = () => {
    setModalPhase('quiz');
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !selectedModule) return;
    
    const isCorrect = selectedModule.options[selectedOption].isCorrect;
    setIsAnswered(true);

    if (isCorrect) {
      setErrorMessage('');
      setTimeout(async () => {
        setModalPhase('congrats');
        if (!completedIds.includes(selectedModule.id)) {
          addCompletedModule(selectedModule.id);
          addReward(selectedModule.xp);
          playSfx('claim');

          // Update Firestore
          if (effectiveId) {
            try {
              const userRef = doc(db, 'users', effectiveId);
              await updateDoc(userRef, {
                completedModules: arrayUnion({
                  moduleId: selectedModule.id,
                  trackId: selectedModule.trackId,
                  completedAt: new Date()
                }),
                updatedAt: serverTimestamp()
              });
            } catch (err) {
              console.error("Gagal menyimpan progress modul ke Firestore:", err);
            }
          }
        }
      }, 800);
    } else {
      setErrorMessage('Aduhh sori Senior, jawaban lo kurang tepat! Coba pelajarin lagi ulasannya di atas ya. 🙏');
      setIsAnswered(false);
    }
  };

  // Find recommended track based on archetype
  const recommendedTrack = learningTracks.find(track => 
    track.recommendedFor.includes(userArchetype)
  ) || learningTracks[0];

  // Human archetype name translator
  const getArchetypeDisplay = (arch: string) => {
    const mapping: Record<string, string> = {
      conviction_holder: "💎 The Conviction Holder",
      reward_hunter: "🪂 The Reward Hunter",
      momentum_chaser: "⚡ The Momentum Chaser",
      deep_diver: "🔬 The Deep Diver",
      community_native: "📣 The Community Native",
      narrative_reader: "📚 The Narrative Reader",
      dopamine_trader: "🎰 The Dopamine Trader",
      accumulator: "🐢 The Accumulator"
    };
    return mapping[arch] || "🌟 Explorer";
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full py-8 gap-8 px-4 text-slate-300 select-none">
      
      {/* ── ROADMAP HUB: SELECTION LIST (Halaman Utama) ── */}
      <AnimatePresence mode="wait">
        {!selectedTrackId ? (
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Header Jumbotron */}
            <section className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-surface-dark border border-border-purple shadow-3xl">
              <div className="absolute top-0 right-0 w-96 h-96 bg-vibrant-purple/10 rounded-full blur-[100px] -mr-48 -mt-48" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-accent/5 rounded-full blur-[100px] -ml-48 -mb-48" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-gold-accent/15 text-gold-accent border border-gold-accent/30 rounded-lg text-[10px] font-black uppercase tracking-widest italic">
                      🎓 CRYPDOID ACADEMY
                    </span>
                    <span className="px-3 py-1 bg-vibrant-purple/15 text-vibrant-purple border border-vibrant-purple/30 rounded-lg text-[10px] font-black uppercase tracking-widest italic animate-pulse">
                      HYBRID LEARNING SYSTEM
                    </span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-tight">
                    Pilih Jalur <br/> Belajar <span className="text-gold-accent">Crypto Lo!</span>
                  </h1>
                  
                  <p className="text-slate-400 font-bold text-sm md:text-base italic max-w-xl leading-relaxed">
                    Sistem otomatis kami menyesuaikan kurikulum berdasarkan tipe kepribadian Web3 lo. Belajar lancar, paham kilat, dapetin ribuan XP bonus!
                  </p>
                </div>

                {/* Profile Archetype Info box */}
                <div className="bg-black/50 backdrop-blur-xl border border-white/5 p-6 rounded-3xl min-w-[280px]">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Archetype Quiz Hasil</span>
                  {userArchetype ? (
                    <>
                      <div className="text-base font-black text-white italic leading-tight uppercase flex items-center gap-2">
                         {getArchetypeDisplay(userArchetype)}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic mt-2">
                        Rekomendasi disesuaikan otomatis untuk memaksimalkan gaya cuan aseli lo!
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-base font-black text-slate-500 italic leading-tight uppercase flex items-center gap-2">
                         ❓ BELUM DIKETAHUI
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium italic mt-2">
                        Isi kuis profil dulu biar kita tau gaya belajar Web3 lo.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ── SECTION RECOMMENDED FOR YOU ── */}
            <div>
              <p className="text-gold-accent text-xs font-black tracking-widest mb-4 italic uppercase">
                ★ REKOMENDASI TINGKAT TINGGI UNTUK LO:
              </p>
              
              {!userArchetype ? (
                <div className="bg-surface-dark border-2 border-dashed border-border-purple/50 rounded-3xl p-8 text-center space-y-4">
                  <div className="text-5xl mb-2">🕵️‍♂️</div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight">Belum Ada Rekomendasi</h3>
                  <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-lg mx-auto">
                    Kita nggak tau lo tipe Degen, Investor Santai, atau Hunter Airdrop. Isi Kuis Profil dulu biar sistem kita bisa milihin jalur belajar yang paling cocok buat lo!
                  </p>
                  {setView && (
                    <button 
                      onClick={() => { playSfx('click'); setView('quiz'); }}
                      className="mt-4 px-6 py-3 bg-vibrant-purple hover:bg-gold-accent hover:text-black text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all inline-flex items-center gap-2 italic cursor-pointer shadow-xl shadow-vibrant-purple/20"
                    >
                      Mulai Kuis Profil Sekarang <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              ) : recommendedTrack ? (() => {
                const recMods = allModules.filter(m => m.trackId === recommendedTrack.id);
                const recCompleted = recMods.filter(m => completedIds.includes(m.id)).length;
                const recPercent = Math.floor((recCompleted / recMods.length) * 100) || 0;

                return (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onMouseEnter={() => playSfx('hover')}
                    onClick={() => { playSfx('click'); setSelectedTrackId(recommendedTrack.id); }}
                    className="relative overflow-hidden bg-gradient-to-br from-vibrant-purple to-indigo-700 rounded-3xl p-8 cursor-pointer border border-gold-accent/30 group text-left"
                  >
                    <div className="absolute top-6 right-6 text-6xl opacity-20 group-hover:opacity-30 transition-opacity">
                      {recommendedTrack.emoji}
                    </div>

                    <div className="relative z-10">
                      <div className="text-xs font-black tracking-widest text-gold-accent mb-2">RECOMMENDED FOR YOU</div>
                      <h3 className="text-3xl font-black text-white mb-3">{recommendedTrack.title}</h3>
                      <p className="text-white/80 text-[15px] leading-relaxed mb-6">{recommendedTrack.desc}</p>
                      
                      <div className="space-y-2 max-w-md">
                        {/* Custom micro progress bar */}
                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-pink-500 to-gold-accent" 
                            style={{ width: `${recPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold text-white/90">
                          <span>{recCompleted} / {recommendedTrack.totalModules} MODUL ({recPercent}%)</span>
                          <span className="text-gold-accent font-black tracking-widest uppercase italic group-hover:translate-x-1.5 transition-transform flex items-center gap-0.5">
                            {recPercent === 100 ? "Review" : recPercent > 0 ? "Lanjut" : "Mulai"} <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })() : null}
            </div>

            {/* ── ALL REMAINING IN-CLASS PLAYLIST TRACKS ── */}
            <div className="space-y-4">
              <p className="text-slate-500 text-xs font-black tracking-widest italic uppercase">
                ⚙️ JALUR AKADEMI SELENGKAPNYA:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {learningTracks.map((track) => {
                  const trackMods = allModules.filter(m => m.trackId === track.id);
                  const trackCompleted = trackMods.filter(m => completedIds.includes(m.id)).length;
                  const percent = Math.floor((trackCompleted / trackMods.length) * 100) || 0;

                  return (
                    <motion.div
                      key={track.id}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => playSfx('hover')}
                      onClick={() => { playSfx('click'); setSelectedTrackId(track.id); }}
                      className="bg-surface-dark border border-border-purple hover:border-vibrant-purple p-6 md:p-8 rounded-[2rem] cursor-pointer transition-all flex flex-col justify-between group min-h-[220px] shadow-xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-vibrant-purple/5 rounded-full blur-xl -mr-16 -mt-16 pointer-events-none group-hover:bg-vibrant-purple/10 transition-colors" />

                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-4xl group-hover:scale-110 transition-transform block">{track.emoji}</span>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
                            {trackCompleted === trackMods.length ? "🎉 Selesai" : `${trackCompleted} / ${track.totalModules} MODUL`}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight group-hover:text-gold-accent transition-colors">
                            {track.title}
                          </h3>
                          <p className="text-slate-400 font-bold text-xs italic leading-snug mt-1.5">
                            {track.desc}
                          </p>
                        </div>
                      </div>

                      <div className="mt-8 space-y-2">
                        {/* Custom micro progress bar */}
                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/5">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-vibrant-purple to-gold-accent" 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-500">Progress</span>
                          <span className="text-gold-accent font-black">{percent}%</span>
                        </div>
                        <div className="flex justify-end items-center text-[10px] pt-1">
                          <span className="text-gold-accent font-black tracking-widest uppercase italic group-hover:translate-x-1.5 transition-transform flex items-center gap-0.5">
                            {percent === 100 ? "Review" : percent > 0 ? "Lanjut" : "Mulai"} <ChevronRight size={10} />
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

          </motion.div>
        ) : (
          <LearningPathDetail
            trackId={selectedTrackId}
            completedIds={completedIds}
            onBack={() => setSelectedTrackId(null)}
            onOpenModule={handleOpenModule}
          />
        )}
      </AnimatePresence>

      {/* ── MODIFIED PREMIUM INTERACTIVE POPUP DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedModule && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-55 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-surface-dark border-2 border-border-purple rounded-[2.5rem] max-w-xl w-full relative overflow-hidden shadow-2xl p-6 md:p-8"
            >
              {/* Decorative background light bubbles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-vibrant-purple/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-accent/5 rounded-full blur-[80px] -ml-32 -mb-32 pointer-events-none" />

              {/* Tag header strip */}
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="inline-flex items-center gap-2 bg-vibrant-purple/10 px-3 py-1 rounded-full border border-vibrant-purple/20 text-[9px] font-black uppercase tracking-widest text-vibrant-purple italic">
                  🎓 Class Academy // Module 0{selectedModule.id}
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:bg-white/10 hover:text-white transition-all cursor-pointer font-black text-sm"
                >
                  ✕
                </button>
              </div>

              {/* PHASE 1: STUDY LESSON SCREEN */}
              {modalPhase === 'content' && (
                <div className="space-y-6 relative z-10 text-left">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-gold-accent tracking-widest uppercase italic block">Materi Ulasan</span>
                    <h2 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter leading-snug">
                      {selectedModule.title}
                    </h2>
                  </div>

                  <div className="p-6 rounded-3xl bg-black/40 border border-white/5 font-semibold text-slate-300 text-sm md:text-base leading-relaxed tracking-wide italic">
                    {selectedModule.content}
                  </div>

                  {/* Fun Fact Callout */}
                  <div className="p-5 rounded-2xl bg-gold-accent/5 border border-gold-accent/10 flex gap-4 items-start">
                    <div className="bg-gold-accent text-black p-2 rounded-xl text-xs flex-shrink-0 animate-bounce">
                      <Star size={14} fill="currentColor" />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-gold-accent uppercase tracking-widest italic mb-1">Slang Fun Fact Senior</h4>
                      <p className="text-xs text-slate-400 font-bold leading-normal italic">
                        {selectedModule.funFact}
                      </p>
                    </div>
                  </div>

                  {/* Move to verification quiz */}
                  <button
                    onClick={() => { playSfx('click'); handleNextToQuiz(); }}
                    onMouseEnter={() => playSfx('hover')}
                    className="w-full py-5 bg-white text-black hover:bg-gold-accent font-black rounded-2xl transition-all flex items-center justify-center gap-3 italic uppercase text-sm tracking-wider shadow-xl cursor-pointer"
                  >
                    Uji Nyali & Selesaikan Modul <ChevronRight size={18} />
                  </button>
                </div>
              )}

              {/* PHASE 2: INTERACTIVE QUIZ QUESTION */}
              {modalPhase === 'quiz' && (
                <div className="space-y-6 relative z-10 text-left">
                  <div className="flex items-center gap-2 text-gold-accent">
                    <HelpCircle size={18} />
                    <span className="text-[10px] font-black tracking-widest uppercase italic block">Verifikasi Pemahaman</span>
                  </div>

                  <h3 className="text-xl font-black text-white italic uppercase tracking-tight leading-snug mb-6">
                    {selectedModule.question}
                  </h3>

                  {/* Show dynamic message helper */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold leading-relaxed"
                      >
                        {errorMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    {selectedModule.options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => { playSfx('click'); setSelectedOption(idx); }}
                        onMouseEnter={() => playSfx('hover')}
                        className={`w-full p-5 rounded-2xl border text-left text-xs md:text-sm transition-all flex justify-between items-center font-bold cursor-pointer hover:border-vibrant-purple ${
                          selectedOption === idx 
                            ? 'border-vibrant-purple bg-vibrant-purple/10 text-white shadow-xl shadow-vibrant-purple/10' 
                            : 'border-white/5 bg-black/40 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{option.text}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedOption === idx ? 'border-vibrant-purple bg-vibrant-purple' : 'border-slate-800'
                        }`}>
                          {selectedOption === idx && <div className="w-2 h-2 bg-black rounded-full" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setModalPhase('content')}
                      className="px-6 py-4 rounded-xl border border-white/5 text-slate-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest italic flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft size={14} /> Baca Lagi
                    </button>
                    
                    <button
                      onClick={() => { playSfx('click'); handleSubmitAnswer(); }}
                      disabled={selectedOption === null || isAnswered}
                      onMouseEnter={() => playSfx('hover')}
                      className="flex-1 py-4 bg-vibrant-purple hover:bg-gold-accent hover:text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 italic disabled:opacity-40 cursor-pointer"
                    >
                      Submit Jawaban <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* PHASE 3: CONGRATS CELEBRATION */}
              {modalPhase === 'congrats' && (
                <div className="text-center py-8 space-y-6 relative z-10">
                  <div className="w-20 h-20 bg-gold-accent rounded-3xl flex items-center justify-center text-black shadow-2xl mx-auto rotate-12 scale-110 mb-4">
                    <Award size={40} className="animate-spin-slow text-black" />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-emerald-400 tracking-[0.4em] uppercase block">gokil! class completed</span>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                      Modul Selesai Di-Sync!
                    </h3>
                  </div>

                  <p className="text-slate-400 font-bold max-w-sm mx-auto text-xs md:text-sm leading-relaxed italic">
                    Helm lo kokoh Senior! Lo udah paham {selectedModule.title} dengan tuntas tas tas. Terus asah pengetahuan lo ke tingkat pro!
                  </p>

                  <div className="p-4 bg-black/40 border border-white/5 rounded-2xl inline-flex items-center gap-3 px-6 shadow-xl">
                    <Zap className="text-gold-accent animate-bounce" size={18} />
                    <span className="text-white font-black italic text-lg leading-none">+{selectedModule.xp} XP DIKLAIM</span>
                  </div>

                  <div className="pt-6">
                    <button
                      onClick={() => { playSfx('click'); setSelectedModule(null); }}
                      onMouseEnter={() => playSfx('hover')}
                      className="w-full py-5 bg-white text-black hover:bg-gold-accent font-black rounded-2xl transition-all text-sm tracking-wider uppercase italic shadow-2xl cursor-pointer"
                    >
                      Bungkus, Lanjut Kelas!
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
