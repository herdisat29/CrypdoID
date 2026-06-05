import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle, Loader2, AlertCircle, RefreshCcw, LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../../features/auth/AuthContext';

export default function EmailVerificationNotice() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendVerification = async () => {
    if (!user || countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await sendEmailVerification(user);
      setSuccess(true);
      setCountdown(60); // 1 minute cooldown
    } catch (err: unknown) {
      console.error("Verification error:", err);
      const firebaseError = err as { code?: string };
      if (firebaseError.code === 'auth/too-many-requests') {
        setError("Slow down Senior! Cek inbox lo dulu, kalo gak ada baru request lagi bentar.");
      } else {
        setError("Gagal ngirim email. Coba lagi ya.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      // Force reload user from Firebase
      await auth.currentUser?.reload();
      // Auth state will automatically update if we set user again, 
      // but Firebase JS SDK onAuthStateChanged might take a second.
      // Usually reloading is enough for user.emailVerified to update.
      window.location.reload(); // Hard reload is the safest way to ensure all contexts pick up the change
    } catch (err) {
      console.error("Reload error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-surface-dark border-2 border-vibrant-purple/40 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(126,34,206,0.2)] relative overflow-hidden"
      >
        {/* Background Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-vibrant-purple/20 blur-[80px] rounded-full" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gold-accent/10 blur-[80px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-vibrant-purple/10 rounded-[1.5rem] flex items-center justify-center border border-vibrant-purple/20 mb-6 shadow-xl">
            <Mail className="w-10 h-10 text-vibrant-purple animate-bounce" />
          </div>

          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4 leading-none">
            SYNC <span className="text-gold-accent">REQUIRED</span>
          </h2>
          
          <p className="text-slate-400 text-sm font-bold italic leading-relaxed mb-8">
            Waduh Senior, satu langkah lagi! <br/>
            Cek inbox email <span className="text-white font-black">{user.email}</span> lo buat verifikasi identitas di Sistem CrypdoID.
          </p>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 mb-8"
              >
                <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest text-left">
                  Email verifikasi udah dikirim! Cek folder spam juga ya kalau gak ada.
                </p>
              </motion.div>
            ) : error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 mb-8"
              >
                <AlertCircle className="text-red-500 shrink-0" size={20} />
                <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-left">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-col gap-4 w-full">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSendVerification}
              disabled={loading || countdown > 0}
              className="w-full py-4 bg-vibrant-purple text-white font-black uppercase text-xs rounded-2xl shadow-lg shadow-vibrant-purple/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Mail size={18} />}
              {countdown > 0 ? `Tunggu ${countdown}s` : 'Kirim Ulang Email'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefreshStatus}
              disabled={loading}
              className="w-full py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-xs rounded-2xl transition-all hover:bg-white/10 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
              Udah Verifikasi? Cek Status
            </motion.button>

            <button 
              onClick={() => setDismissed(true)}
              className="mt-4 text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-2 transition-colors"
            >
              Lanjutkan Tanpa Verifikasi &rarr;
            </button>

            <button 
              onClick={() => logout()}
              className="mt-2 text-slate-500 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={14} />
              Batal & Keluar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
