import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, SkipForward, Target, Zap, Shield, Flame, Wallet, GraduationCap } from 'lucide-react';
import { getGeminiResponse } from '../../services/geminiService';

interface OnboardingFlowProps {
  onComplete: () => void;
}

type OnboardingStep = 1 | 2 | 3 | 'loading' | 'result';

const QUESTIONS = {
  1: {
    title: "Lo pernah kena masalah di crypto?",
    options: [
      { id: 'kapok', text: "Pernah, dan kapok.", icon: <Flame className="w-5 h-5 text-red-500" /> },
      { id: 'beberapa_kali', text: "Pernah beberapa kali.", icon: <Shield className="w-5 h-5 text-orange-400" /> },
      { id: 'belum', text: "Belum pernah sejauh ini.", icon: <Zap className="w-5 h-5 text-emerald-400" /> },
    ]
  },
  2: {
    title: "Tujuan lo masuk crypto apa?",
    options: [
      { id: 'investasi', text: "Investasi jangka panjang", icon: <Wallet className="w-5 h-5 text-blue-400" /> },
      { id: 'airdrop', text: "Cari peluang airdrop", icon: <Target className="w-5 h-5 text-purple-400" /> },
      { id: 'trading', text: "Trading & cari cuan cepat", icon: <Zap className="w-5 h-5 text-yellow-400" /> },
      { id: 'belajar', text: "Cuma mau belajar dulu", icon: <GraduationCap className="w-5 h-5 text-emerald-400" /> },
    ]
  },
  3: {
    title: "Seberapa ngerti lo soal crypto sekarang?",
    options: [
      { id: 'baru', text: "Baru banget mulai" },
      { id: 'dikit', text: "Udah pernah nyoba dikit" },
      { id: 'lumayan', text: "Udah lumayan ngerti" },
    ]
  }
};

const LOADING_TEXTS = [
  "Senior lagi nyiapin jalur belajar buat lo...",
  "Bentar, gue baca dulu kondisi lo.",
  "Nyocokin materi yang paling cocok buat lo..."
];

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [aiMessage, setAiMessage] = useState("");

  const handleSelect = (questionId: number, answerId: string) => {
    const newAnswers = { ...answers, [questionId]: answerId };
    setAnswers(newAnswers);

    if (questionId === 1) setStep(2);
    else if (questionId === 2) setStep(3);
    else if (questionId === 3) {
      setStep('loading');
      processAi(newAnswers);
    }
  };

  const processAi = async (finalAnswers: Record<number, string>) => {
    try {
      const prompt = `User ini adalah pemula crypto. 
Masalah sebelumnya: ${finalAnswers[1]}. 
Tujuannya: ${finalAnswers[2]}. 
Pemahamannya: ${finalAnswers[3]}. 
Berikan sambutan pendek maksimal 3-5 kalimat layaknya senior di tongkrongan yang ngasih arahan konkrit. 
Jangan pakai bahasa marketing lebay atau kata-kata epik (jangan pakai kata "warrior", "chosen", dsb).`;
      
      const response = await getGeminiResponse([], prompt);
      if (response && response.length > 20) {
        setAiMessage(response);
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      // Dynamic fallback
      let dynamicMsg = "Siap, masuk aja langsung Senior. Gue pandu di dalam!";
      if (finalAnswers[1] === 'kapok' && finalAnswers[2] === 'trading') {
        dynamicMsg = "Udah pernah kapok tapi tetep mau trading cepet? Berani juga lo! Santai, kali ini kita main pakai data, bukan asal tebak. Yuk masuk, gue ajarin caranya biar gak boncos lagi.";
      } else if (finalAnswers[3] === 'baru') {
        dynamicMsg = "Baru banget mulai ya? Gapapa, mending telat daripada nyangkut di koin abal-abal. Gua bakal bantu buatin pondasi lo kuat. Masuk sini!";
      } else if (finalAnswers[2] === 'investasi') {
        dynamicMsg = "Fokus ke jangka panjang itu mindset yang bener. Kita gak bakal main judi di sini. Gua pandu lo buat nemuin koin fundamental kuat. Gas masuk!";
      }
      setAiMessage(dynamicMsg);
    } finally {
      setStep('result');
    }
  };

  useEffect(() => {
    if (step === 'loading') {
      const interval = setInterval(() => {
        setLoadingTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const complete = () => {
    localStorage.setItem('crypdo_onboarding_complete', 'true');
    onComplete();
  };

  const renderQuestion = (qNum: 1 | 2 | 3) => {
    const q = QUESTIONS[qNum];
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col items-center justify-center h-full max-w-lg mx-auto w-full px-6"
      >
        <h2 className="text-2xl md:text-3xl font-black text-white italic mb-10 text-center tracking-tight leading-tight uppercase">{q.title}</h2>
        <div className="w-full space-y-4">
          {q.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(qNum, opt.id)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-vibrant-purple/50 p-5 rounded-2xl flex items-center gap-4 transition-all active:scale-95 group text-left cursor-pointer"
            >
              {'icon' in opt && <div className="p-2 bg-black/30 rounded-xl group-hover:scale-110 transition-transform">{opt.icon}</div>}
              <span className="font-bold text-slate-200 group-hover:text-white">{opt.text}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-[250] bg-[#05010a] flex items-center justify-center">
      <div className="absolute inset-0 bg-vibrant-purple/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-vibrant-purple/10 via-black to-black opacity-50" />
      
      {/* Skip Button */}
      {step !== 'loading' && step !== 'result' && (
        <button 
          onClick={complete}
          className="absolute top-6 right-6 text-slate-500 hover:text-white flex items-center gap-2 text-xs font-black uppercase tracking-widest z-[60] transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 cursor-pointer pointer-events-auto"
        >
          Skip Personalization <SkipForward size={14} />
        </button>
      )}

      <div className="relative z-10 w-full h-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && <div key="q1" className="h-full flex items-center">{renderQuestion(1)}</div>}
          {step === 2 && <div key="q2" className="h-full flex items-center">{renderQuestion(2)}</div>}
          {step === 3 && <div key="q3" className="h-full flex items-center">{renderQuestion(3)}</div>}
          
          {step === 'loading' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-vibrant-purple/20 border-2 border-vibrant-purple/50 animate-spin flex items-center justify-center">
                <div className="w-8 h-8 bg-vibrant-purple/40 rounded-lg animate-pulse" />
              </div>
              <p className="text-xl font-black text-vibrant-purple italic uppercase tracking-wider animate-pulse">
                {LOADING_TEXTS[loadingTextIndex]}
              </p>
            </motion.div>
          )}

          {step === 'result' && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-full max-w-xl mx-auto px-6 text-center space-y-8"
            >
              <div className="bg-black/40 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-vibrant-purple/20 blur-3xl rounded-full" />
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Pesan dari Senior</h3>
                <p className="text-lg md:text-xl font-bold text-white leading-relaxed italic relative z-10">
                  "{aiMessage}"
                </p>
              </div>
              <button
                onClick={complete}
                className="bg-vibrant-purple text-white font-black px-10 py-4 rounded-2xl uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_30px_rgba(126,34,206,0.3)] active:scale-95 cursor-pointer"
              >
                Mulai Misi <ArrowRight size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}