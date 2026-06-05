import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';
import { useMintBadge } from '../../hooks/useMintBadge';
import { useWalletStore } from '../../store/walletStore';
import { useUIStore } from '../../store/uiStore';
import { playSfx } from '../../lib/audio';
import confetti from 'canvas-confetti';
import { CRYPDO_BADGE_ADDRESS } from '../../contracts/CrypdoIDBadge';

interface MintBadgeButtonProps {
  tier: 1 | 2 | 3;
}

// Premium SVG badge designs — distinct look for each tier
function BadgeSVG({ tier }: { tier: 1 | 2 | 3 }) {
  const configs = {
    1: {
      name: 'Scholar',
      subtitle: 'Bronze Tier',
      bg: '#1a0f00',
      ring1: '#cd7f32',
      ring2: '#8a5a22',
      glow: 'rgba(205,127,50,0.6)',
      star: '#f59e0b',
      emblem: '#cd7f32',
      shieldFill: 'url(#bronze-grad)',
      gradId: 'bronze-grad',
      c1: '#cd7f32',
      c2: '#8a5a22',
      label: 'I',
    },
    2: {
      name: 'Master',
      subtitle: 'Silver Tier',
      bg: '#0d1117',
      ring1: '#e2e8f0',
      ring2: '#94a3b8',
      glow: 'rgba(226,232,240,0.5)',
      star: '#e2e8f0',
      emblem: '#cbd5e1',
      shieldFill: 'url(#silver-grad)',
      gradId: 'silver-grad',
      c1: '#e2e8f0',
      c2: '#64748b',
      label: 'II',
    },
    3: {
      name: 'Legend',
      subtitle: 'Gold Tier',
      bg: '#0f0a00',
      ring1: '#ffd700',
      ring2: '#b8860b',
      glow: 'rgba(255,215,0,0.7)',
      star: '#ffd700',
      emblem: '#ffd700',
      shieldFill: 'url(#gold-grad)',
      gradId: 'gold-grad',
      c1: '#ffd700',
      c2: '#b8860b',
      label: 'III',
    },
  };
  const c = configs[tier];

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" className="w-full h-full">
      <defs>
        <radialGradient id={`bg-${tier}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={c.c1} stopOpacity="0.15" />
          <stop offset="100%" stopColor={c.bg} stopOpacity="1" />
        </radialGradient>
        <linearGradient id={c.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.c1} />
          <stop offset="50%" stopColor={c.c1} stopOpacity="0.85" />
          <stop offset="100%" stopColor={c.c2} />
        </linearGradient>
        <linearGradient id={`shine-${tier}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${tier}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id={`soft-${tier}`}>
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Background */}
      <rect width="400" height="400" fill={c.bg} rx="24" />
      <rect width="400" height="400" fill={`url(#bg-${tier})`} rx="24" />

      {/* Outer decorative ring */}
      <circle cx="200" cy="200" r="170" fill="none" stroke={c.ring1} strokeWidth="1" strokeOpacity="0.2" />
      <circle cx="200" cy="200" r="158" fill="none" stroke={c.ring1} strokeWidth="0.5" strokeOpacity="0.12" />

      {/* Glow behind shield */}
      <ellipse cx="200" cy="205" rx="90" ry="90" fill={c.c1} opacity="0.08" filter={`url(#soft-${tier})`} />

      {/* Shield shape */}
      <path
        d="M200 80 L290 120 L290 210 Q290 280 200 320 Q110 280 110 210 L110 120 Z"
        fill={c.shieldFill}
        filter={`url(#glow-${tier})`}
      />
      {/* Shield shine overlay */}
      <path
        d="M200 80 L290 120 L290 210 Q290 280 200 320 Q110 280 110 210 L110 120 Z"
        fill={`url(#shine-${tier})`}
      />
      {/* Shield inner border */}
      <path
        d="M200 95 L278 130 L278 208 Q278 268 200 304 Q122 268 122 208 L122 130 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.2"
      />

      {/* Roman numeral tier label in shield center */}
      <text
        x="200" y="225"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Georgia, serif"
        fontWeight="bold"
        fontSize="64"
        fill="#ffffff"
        opacity="0.9"
        letterSpacing="-2"
      >{c.label}</text>

      {/* Stars top decorations */}
      {[-60, -30, 0, 30, 60].map((offset, i) => (
        <polygon
          key={i}
          points="0,-6 1.8,-2 6,-2 2.7,1 4,5.5 0,3 -4,5.5 -2.7,1 -6,-2 -1.8,-2"
          fill={c.star}
          opacity={i === 2 ? 1 : 0.5}
          transform={`translate(${200 + offset}, 52) scale(${i === 2 ? 1.4 : 1})`}
        />
      ))}

      {/* Badge name text */}
      <text
        x="200" y="352"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="22"
        fill={c.ring1}
        letterSpacing="3"
      >CRYPDOID</text>
      <text
        x="200" y="376"
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="sans-serif"
        fontWeight="700"
        fontSize="13"
        fill={c.ring2}
        letterSpacing="4"
        opacity="0.8"
      >{c.name.toUpperCase()}</text>

      {/* Corner accent lines */}
      <line x1="30" y1="30" x2="60" y2="30" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="30" y1="30" x2="30" y2="60" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="370" y1="30" x2="340" y2="30" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="370" y1="30" x2="370" y2="60" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="30" y1="370" x2="60" y2="370" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="30" y1="370" x2="30" y2="340" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="370" y1="370" x2="340" y2="370" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
      <line x1="370" y1="370" x2="370" y2="340" stroke={c.ring1} strokeWidth="2" strokeOpacity="0.4" />
    </svg>
  );
}

export default function MintBadgeButton({ tier }: MintBadgeButtonProps) {
  const {
    mint,
    isMinted,
    isConfirming,
    isMining,
    isSuccess,
    txHash,
    error,
    isBase,
    isConnected
  } = useMintBadge(tier);

  const isMock = useWalletStore(state => !!state.mockAddress && !state.isRealConnected);

  const tierLabels = {
    1: 'Scholar Badge',
    2: 'Master Badge',
    3: 'Legend Badge'
  };
  const tierColors = {
    1: { from: '#cd7f32', to: '#8a5a22', text: 'text-amber-600', border: 'border-amber-700/40' },
    2: { from: '#e2e8f0', to: '#94a3b8', text: 'text-slate-300', border: 'border-slate-400/40' },
    3: { from: '#ffd700', to: '#b8860b', text: 'text-yellow-400', border: 'border-yellow-500/40' },
  };

  React.useEffect(() => {
    if (isMinted || isSuccess) {
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 60, zIndex: 100 };
      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        const particleCount = 20 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [isMinted, isSuccess]);

  const getButtonContent = () => {
    if (isMinted || isSuccess) return (
      <>
        <CheckCircle size={16} />
        {tierLabels[tier]} Minted ✅
      </>
    );
    if (isMining) return (
      <>
        <Loader2 size={16} className="animate-spin" />
        Minting on Base...
      </>
    );
    if (isConfirming) return (
      <>
        <Loader2 size={16} className="animate-spin" />
        Check Wallet...
      </>
    );
    if (!isConnected && !isMock) return <>Connect Wallet to Mint</>;
    if (!isBase && !isMock) return <>Switch to Base to Mint</>;
    return (
      <>
        <Award size={16} />
        Mint {tierLabels[tier]}
      </>
    );
  };

  if (isMock) {
    return (
      <div className="flex flex-col gap-2 mt-3 w-full">
        <button
          onClick={() => {
            playSfx('click');
            useUIStore.getState().setShowWalletModal(true);
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest italic bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
        >
          <Award size={14} />
          CONNECT REAL WALLET TO MINT
        </button>
        <div className="text-[10px] text-center text-slate-400 font-semibold italic px-2 leading-relaxed">
          <p>
            Lo pakai Profil Simulasi. Yuk <strong className="text-amber-400">belajar bikin wallet asli</strong> &amp; isi sedikit{' '}
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0052FF]/15 border border-[#0052FF]/30 text-[#85A7FF] font-bold text-[10px] uppercase tracking-wider not-italic align-middle">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#0052FF"/>
                <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
              </svg>
              Base ETH
            </span>{' '}
            buat mencetak Badge on-chain ini secara permanen!
          </p>
        </div>
        
        {/* Comparison Box */}
        <div className="mt-2 bg-black/40 border border-white/5 rounded-xl p-3 text-[10px] text-left space-y-3 shadow-inner">
          <p className="text-center font-black uppercase tracking-widest text-slate-500 mb-1">Kenapa Harus Pake Wallet Asli?</p>
          <div className="flex flex-col gap-2">
            <div className="bg-white/5 rounded-lg p-2 border border-white/5">
              <span className="text-slate-300 font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><span className="text-amber-500">✓</span> Simulasi</span>
              <ul className="text-slate-400 space-y-0.5 ml-4 list-disc marker:text-slate-600">
                <li>Gratis tanpa modal</li>
                <li>Hanya tersimpan sementara di *browser* lo</li>
              </ul>
            </div>
            <div className="bg-[#0052FF]/10 rounded-lg p-2 border border-[#0052FF]/20">
              <span className="text-[#85A7FF] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"><span className="text-[#0052FF]">✓</span> Blockchain (Real Web3)</span>
              <ul className="text-[#a5c0ff] space-y-0.5 ml-4 list-disc marker:text-[#0052FF]">
                <li>Tersimpan permanen selamanya</li>
                <li>Bisa dipamerin ke platform/orang lain</li>
                <li>Menjadi identitas Web3 asli milik lo</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-3 w-full">
      <motion.button
        onClick={() => {
          if (!isConnected && !isMock) {
            playSfx('click');
            useUIStore.getState().setShowWalletModal(true);
            return;
          }
          if (!isMinted && !isSuccess && !isMining && !isConfirming) {
            playSfx('click');
            mint();
          }
        }}
        disabled={isMinted || isSuccess || isMining || isConfirming}
        whileHover={(isMinted || isSuccess || isMining || isConfirming) ? {} : { scale: 1.02 }}
        whileTap={(isMinted || isSuccess || isMining || isConfirming) ? {} : { scale: 0.98 }}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.1em] italic transition-all shadow-xl relative overflow-hidden ${isMinted || isSuccess
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
            : isMining || isConfirming
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-wait'
              : !isConnected
                ? 'bg-[#0052FF] hover:bg-[#0040CC] text-white shadow-[#0052FF]/20 cursor-pointer'
                : !isBase
                  ? 'bg-[#0052FF] hover:bg-[#0040CC] text-white shadow-[#0052FF]/20 cursor-pointer'
                  : tier === 1
                    ? 'bg-gradient-to-r from-[#cd7f32] to-[#8a5a22] text-white hover:brightness-110 shadow-orange-900/30 cursor-pointer'
                    : tier === 2
                      ? 'bg-gradient-to-r from-[#c0c0c0] to-[#808080] text-black hover:brightness-110 shadow-slate-500/30 cursor-pointer'
                      : 'bg-gradient-to-r from-[#ffd700] to-[#b8860b] text-black hover:brightness-110 shadow-yellow-500/30 cursor-pointer'
          }`}
      >
        {(!isMinted && !isSuccess && !isMining && !isConfirming && isBase) && (
          <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
        )}
        {getButtonContent()}
      </motion.button>

      {error && (
        <p className="text-[10px] text-center text-red-400 font-bold mt-1">
          {error}
        </p>
      )}

      <AnimatePresence>
        {(isMinted || isSuccess) && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 w-full overflow-hidden"
          >
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide mt-1">
              NFT Badge udah mendarat di wallet lo! 🎉
            </p>

            {/* Premium NFT Preview */}
            <div className="w-full max-w-[180px] aspect-square rounded-2xl overflow-hidden shadow-2xl border relative group"
              style={{ borderColor: tierColors[tier].from + '40' }}
            >
              {/* Animated glow behind */}
              <div className="absolute inset-0 opacity-30 blur-xl rounded-2xl"
                style={{ background: `radial-gradient(circle, ${tierColors[tier].from}, transparent)` }}
              />
              <div className="relative z-10 w-full h-full">
                <BadgeSVG tier={tier} />
              </div>
              {/* Shine sweep on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>

            <div className="flex flex-col items-center gap-1.5 mt-1">
              {txHash && (
                <a
                  href={`https://basescan.org/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-emerald-400 transition-colors uppercase font-bold tracking-widest"
                >
                  View Tx on Etherscan <ExternalLink size={9} />
                </a>
              )}
              {CRYPDO_BADGE_ADDRESS && (CRYPDO_BADGE_ADDRESS as string) !== '0x0000000000000000000000000000000000000000' && (
                <a
                  href={`https://basescan.org/address/${CRYPDO_BADGE_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] text-slate-500 hover:text-indigo-400 transition-colors uppercase font-bold tracking-widest"
                >
                  View Contract on Etherscan <ExternalLink size={9} />
                </a>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(!isMock && !isMinted && !isSuccess) && (
        <div className="text-[10px] text-center text-slate-400 font-semibold italic px-2 mt-1.5 leading-relaxed">
          <p>
            Pastiin wallet lo punya sedikit{' '}
            <a href="https://bridge.base.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0052FF]/15 border border-[#0052FF]/30 text-[#85A7FF] hover:bg-[#0052FF]/30 transition-all font-bold text-[10px] uppercase tracking-wider not-italic align-middle cursor-pointer">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#0052FF"/>
                <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
              </svg>
              Base ETH
            </a>{' '}
            buat bayar gas fee (network fee jaringan Base) untuk mencetak Badge ini!
          </p>
        </div>
      )}
    </div>
  );
}
