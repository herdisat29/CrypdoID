import { motion } from "motion/react";
import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

const days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

export default function StreakCalendar() {
  const [streakHistory, setStreakHistory] = useState<boolean[]>([
    true, true, true, true, false, true, true
  ]);
  const [currentStreak, setCurrentStreak] = useState(7);

  // Simulasi data (bisa dihubungkan ke localStorage nanti)
  useEffect(() => {
    // Avoid synchronous state updates in the effect body
    const timer = setTimeout(() => {
      // Ambil data streak asli jika ada untuk sinkronisasi tampilan
      const savedStreak = localStorage.getItem('crypdo_streak');
      if (savedStreak) {
        setCurrentStreak(parseInt(savedStreak));
      }

      const today = new Date().getDay();
      // getDay() returns 0 for Sunday, 1 for Monday, etc.
      // Our map starts with "Sen" (index 0), so we need to map Sunday (0) to index 6.
      const dayIndex = today === 0 ? 6 : today - 1;
      
      const newHistory = [...streakHistory];
      newHistory[dayIndex] = true;
      setStreakHistory(newHistory);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-surface-dark border-2 border-border-purple rounded-[3rem] p-8 shadow-2xl relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-orange-500/10 blur-[100px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Flame className="w-7 h-7 text-orange-500" />
          </div>
          <div>
            <h4 className="font-black text-xl text-white italic uppercase tracking-tighter">Protocol Activity</h4>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">7-Day Sync History</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-orange-500 italic leading-none">{currentStreak}</p>
          <p className="text-[9px] font-black text-orange-400 uppercase tracking-widest mt-1">Day Streak</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3 relative z-10">
        {days.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <p className="text-[10px] font-black text-slate-600 mb-3 uppercase tracking-widest">{day}</p>
            
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center border-2 transition-all cursor-default ${
                streakHistory[index]
                  ? "bg-gradient-to-br from-orange-400 to-amber-600 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                  : "bg-black/40 border-white/5 text-slate-800"
              }`}
            >
              {streakHistory[index] ? (
                <Flame className="w-6 h-6 md:w-8 md:h-8 text-white shadow-lg" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
              )}
            </motion.div>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="mt-8 text-center relative z-10">
        {currentStreak >= 3 ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-emerald-400 text-[11px] font-black uppercase italic tracking-wider">
              System Overheating! Keep the streak alive.
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-[11px] font-black uppercase italic tracking-wider">
            Initialize more nodes to increase your power level.
          </p>
        )}
      </div>
    </div>
  );
}
