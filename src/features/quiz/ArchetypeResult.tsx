// src/features/quiz/ArchetypeResult.tsx
// UPDATED: Rarity system + investor-friendly reframe + enhanced visuals + real-time Base mainnet minting

import { INVESTOR_REFRAME, getShortName } from '../../data/archetypeReframe';
import { motion } from 'motion/react';
import { Target, Zap, Shield, Share2, ArrowRight, Award, CheckCircle, ExternalLink, Loader2, Sparkles, Star, RotateCcw } from 'lucide-react';
import ShareModal from '../../components/common/ShareModal';
import { useState, useEffect } from 'react';
import { useUserStore } from '../../store/userStore';
import { useUIStore } from '../../store/uiStore';
import { useMintArchetype } from '../../hooks/useMintArchetype';
import { playSfx } from '../../lib/audio';
import { CRYPDO_ARCHETYPE_ADDRESS } from '../../contracts/CrypdoIDArchetype';
import confetti from 'canvas-confetti';

// ─── RARITY CONFIG ──────────────────────────────────────────────────────────

type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

interface RarityConfig {
  label: Rarity;
  rank: number; // 1 = highest
  color: string;
  color2: string;
  glow: string;
  border: string;
  bg: string;
  svgBg: string;
  badgeBg: string;
  badgeText: string;
  stars: number;
  particle: boolean;
  shimmer: boolean;
  description: string; // flavor text buat awam
}

const RARITY_MAP: Record<string, RarityConfig> = {
  deep_diver: {
    label: 'Legendary',
    rank: 1,
    color: '#FBBF24',
    color2: '#F59E0B',
    glow: 'rgba(251,191,36,0.6)',
    border: '#FBBF24',
    bg: 'from-yellow-500/20 via-amber-500/12 to-transparent',
    svgBg: '#1A1000',
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    stars: 5,
    particle: true,
    shimmer: true,
    description: 'Kurang dari 5% investor punya pola pikir analisis mendalam kayak lo.',
  },
  conviction_holder: {
    label: 'Epic',
    rank: 2,
    color: '#C084FC',
    color2: '#8B5CF6',
    glow: 'rgba(192,132,252,0.6)',
    border: '#C084FC',
    bg: 'from-purple-500/20 via-violet-500/10 to-transparent',
    svgBg: '#0D0520',
    badgeBg: 'bg-purple-500/20 border-purple-400/40',
    badgeText: 'text-purple-300',
    stars: 4,
    particle: true,
    shimmer: true,
    description: 'Mental baja yang cuma dimiliki sedikit investor terpilih.',
  },
  narrative_reader: {
    label: 'Rare',
    rank: 3,
    color: '#60A5FA',
    color2: '#3B82F6',
    glow: 'rgba(96,165,250,0.45)',
    border: '#60A5FA',
    bg: 'from-blue-500/12 via-indigo-500/8 to-transparent',
    svgBg: '#0B1228',
    badgeBg: 'bg-blue-500/20 border-blue-400/40',
    badgeText: 'text-blue-300',
    stars: 3,
    particle: false,
    shimmer: true,
    description: 'Pembaca tren yang satu langkah lebih maju dari kebanyakan.',
  },
  accumulator: {
    label: 'Rare',
    rank: 3,
    color: '#60A5FA', // Blue border & glow for Rare
    color2: '#3B82F6',
    glow: 'rgba(96,165,250,0.45)',
    border: '#60A5FA',
    bg: 'from-blue-500/12 via-indigo-500/8 to-transparent',
    svgBg: '#0B1228',
    badgeBg: 'bg-blue-500/20 border-blue-400/40',
    badgeText: 'text-blue-300',
    stars: 3,
    particle: false,
    shimmer: true,
    description: 'Disiplin DCA konsisten yang jarang dimiliki pemula.',
  },
  reward_hunter: {
    label: 'Uncommon',
    rank: 4,
    color: '#34D399', // Green border & subtle glow for Uncommon
    color2: '#059669',
    glow: 'rgba(52,211,153,0.3)',
    border: '#34D399',
    bg: 'from-emerald-500/10 via-green-500/6 to-transparent',
    svgBg: '#031A10',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/30',
    badgeText: 'text-emerald-300',
    stars: 2,
    particle: false,
    shimmer: false,
    description: 'Grinder pencari imbal hasil yang lebih teliti dari rata-rata.',
  },
  momentum_chaser: {
    label: 'Uncommon',
    rank: 4,
    color: '#34D399', // Green border & subtle glow for Uncommon
    color2: '#059669',
    glow: 'rgba(52,211,153,0.3)',
    border: '#34D399',
    bg: 'from-emerald-500/10 via-green-500/6 to-transparent',
    svgBg: '#031A10',
    badgeBg: 'bg-emerald-500/15 border-emerald-400/30',
    badgeText: 'text-emerald-300',
    stars: 2,
    particle: false,
    shimmer: false,
    description: 'Bereaksi sangat cepat — butuh mitigasi risiko yang ketat.',
  },
  community_native: {
    label: 'Common',
    rank: 5,
    color: '#94A3B8', // Putih/Abu, no glow
    color2: '#64748B',
    glow: 'rgba(148,163,184,0.0)',
    border: '#94A3B8',
    bg: 'from-slate-500/5 to-transparent',
    svgBg: '#0F1623',
    badgeBg: 'bg-slate-500/15 border-slate-400/25',
    badgeText: 'text-slate-300',
    stars: 1,
    particle: false,
    shimmer: false,
    description: 'Pemain tim sosial — potensi kolaborasi sangat besar.',
  },
  dopamine_trader: {
    label: 'Common',
    rank: 5,
    color: '#94A3B8', // Putih/Abu, no glow
    color2: '#64748B',
    glow: 'rgba(148,163,184,0.0)',
    border: '#94A3B8',
    bg: 'from-slate-500/5 to-transparent',
    svgBg: '#0F1623',
    badgeBg: 'bg-slate-500/15 border-slate-400/25',
    badgeText: 'text-slate-300',
    stars: 1,
    particle: false,
    shimmer: false,
    description: 'Pencari adrenalin grafik — butuh disiplin manajemen emosi.',
  },
};

// ─── INVESTOR-FRIENDLY REFRAME ───────────────────────────────────────────────
// (Moved to src/data/archetypeReframe.ts for global consistency)

// ─── SVG CARD ────────────────────────────────────────────────────────────────

function ArchetypeNFTSVG({ archetype, rarityConfig }: { archetype: Archetype; rarityConfig: RarityConfig }) {
  const defaultReframe = { quizName: archetype.name, tagline: archetype.title, emoji: archetype.emoji };
  const reframe = INVESTOR_REFRAME[archetype.id] || defaultReframe;
  const rawTraits = useUserStore.getState().traits;

  // If all traits are exactly 50 (default/unset), use the archetype's built-in psychProfile instead
  const allDefault = Object.values(rawTraits).every(v => v === 50);
  const traits = allDefault && archetype.psychProfile
    ? archetype.psychProfile
    : rawTraits;

  const c = {
    c1: rarityConfig.color,
    c2: rarityConfig.color2,
    bg: rarityConfig.svgBg
  };

  const rarityStars = '★'.repeat(rarityConfig.stars) + '☆'.repeat(5 - rarityConfig.stars);

  const getStarsString = (score: number) => {
    if (score >= 85) return '★★★★★';
    if (score >= 70) return '★★★★☆';
    if (score >= 50) return '★★★☆☆';
    if (score >= 30) return '★★☆☆☆';
    return '★☆☆☆☆';
  };

  const starsDef = getStarsString(traits.defense);
  const starsDisc = getStarsString(traits.discipline);
  const starsConv = getStarsString(traits.conviction);

  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" className="w-full h-full">
      <defs>
        <radialGradient id={`bg-${archetype.id}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={c.c1} stopOpacity="0.3" />
          <stop offset="100%" stopColor={c.bg} stopOpacity="1" />
        </radialGradient>
        <linearGradient id={`grad-${archetype.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={c.c1} />
          <stop offset="100%" stopColor={c.c2} />
        </linearGradient>
        <linearGradient id="rarity-bar" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={rarityConfig.color} stopOpacity="0.2" />
          <stop offset="50%" stopColor={rarityConfig.color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={rarityConfig.color} stopOpacity="0.2" />
        </linearGradient>
        <filter id="glow-filter">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Base */}
      <rect width="300" height="420" fill={c.bg} rx="20" />
      <rect width="300" height="420" fill={`url(#bg-${archetype.id})`} rx="20" />

      {/* Rarity border - glowing */}
      <rect x="2" y="2" width="296" height="416" fill="none"
        stroke={rarityConfig.color} strokeWidth="2"
        strokeOpacity={rarityConfig.label === 'Legendary' ? 0.9 : rarityConfig.label === 'Epic' ? 0.7 : 0.4}
        rx="18" />

      {/* Top rarity bar */}
      <rect x="0" y="0" width="300" height="4" fill="url(#rarity-bar)" rx="2" />

      {/* Decorative grid lines */}
      <path d="M 20 60 L 280 60" stroke={c.c1} strokeWidth="0.4" strokeOpacity="0.2" />
      <circle cx="150" cy="160" r="90" fill="none" stroke={c.c1} strokeWidth="0.4" strokeOpacity="0.12" />
      <circle cx="150" cy="160" r="72" fill="none" stroke={c.c1} strokeWidth="1" strokeDasharray="4,4" strokeOpacity="0.25" />

      {/* Rarity badge — Centered top */}
      <rect x="102" y="14" width="96" height="22" fill={rarityConfig.color} fillOpacity="0.15" rx="11"
        stroke={rarityConfig.color} strokeWidth="0.8" strokeOpacity="0.6" />
      <text x="150" y="29" textAnchor="middle" fontFamily="monospace" fontWeight="900"
        fontSize="9" fill={rarityConfig.color} letterSpacing="1.5">
        {rarityConfig.label.toUpperCase()}
      </text>

      {/* Stars row */}
      <text x="150" y="52" textAnchor="middle" fontFamily="monospace" fontSize="11"
        fill="#FBBF24" letterSpacing="3" opacity="0.95">
        {rarityStars}
      </text>

      {/* Avatar */}
      <circle cx="150" cy="160" r="58" fill="#000000" fillOpacity="0.65"
        stroke={`url(#grad-${archetype.id})`} strokeWidth="2.5" />
      <text x="150" y="171" textAnchor="middle" fontSize="62" dominantBaseline="middle"
        filter="url(#glow-filter)">{reframe.emoji}</text>

      {/* Investor-friendly name — below avatar */}
      <text x="150" y="242" textAnchor="middle" fill="#FFFFFF" fontSize="18" fontWeight="900"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} letterSpacing="0.5">
        {getShortName(reframe.quizName)}
      </text>

      {/* Tagline */}
      <text x="150" y="260" textAnchor="middle" fill={c.c1} fontSize="8.5" fontWeight="800"
        letterSpacing="2">
        {reframe.tagline.toUpperCase()}
      </text>

      {/* Divider */}
      <line x1="60" y1="270" x2="240" y2="270" stroke={c.c1} strokeWidth="0.5" strokeOpacity="0.3" />

      {/* 3 Personality Metrics */}
      <g transform="translate(25, 280)">
        {/* Risk Awareness */}
        <text x="0" y="5" fontSize="8" fontWeight="bold" fill="#E2E8F0" fontFamily="sans-serif">🧠 Risk Awareness</text>
        <text x="250" y="5" fontSize="10.5" fontWeight="bold" fill="#FBBF24" fontFamily="monospace" textAnchor="end">{starsDef}</text>
        
        {/* Decision Discipline */}
        <text x="0" y="23" fontSize="8" fontWeight="bold" fill="#E2E8F0" fontFamily="sans-serif">⚡ Action Clarity</text>
        <text x="250" y="23" fontSize="10.5" fontWeight="bold" fill="#FBBF24" fontFamily="monospace" textAnchor="end">{starsDisc}</text>
        
        {/* Long-term Thinking */}
        <text x="0" y="41" fontSize="8" fontWeight="bold" fill="#E2E8F0" fontFamily="sans-serif">🔥 Long-Term Thinking</text>
        <text x="250" y="41" fontSize="10.5" fontWeight="bold" fill="#FBBF24" fontFamily="monospace" textAnchor="end">{starsConv}</text>
      </g>

      {/* Corner decorations */}
      <path d="M 14 26 L 26 26 M 14 26 L 14 38" fill="none" stroke={rarityConfig.color} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M 286 26 L 274 26 M 286 26 L 286 38" fill="none" stroke={rarityConfig.color} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M 14 394 L 26 394 M 14 394 L 14 382" fill="none" stroke={rarityConfig.color} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M 286 394 L 274 394 M 286 394 L 286 382" fill="none" stroke={rarityConfig.color} strokeWidth="1.5" strokeOpacity="0.7" />

      {/* Brand stamp */}
      <text x="150" y="408" textAnchor="middle" dominantBaseline="middle"
        fontFamily="monospace" fontWeight="900" fontSize="6.5"
        fill={c.c1} opacity="0.7" letterSpacing="4">
        CRYPDOID ECOSYSTEM
      </text>
    </svg>
  );
}

// ─── RARITY STARS COMPONENT ─────────────────────────────────────────────────

function RarityStars({ config }: { config: RarityConfig }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={i < config.stars ? 'fill-current' : 'opacity-20'}
          style={{ color: i < config.stars ? '#FBBF24' : '#64748B' }}
        />
      ))}
    </div>
  );
}

// ─── RARITY BADGE ───────────────────────────────────────────────────────────

function RarityBadge({ config }: { config: RarityConfig }) {
  const icon = config.label === 'Legendary' ? '👑' :
    config.label === 'Epic' ? '💜' :
      config.label === 'Rare' ? '💎' :
        config.label === 'Uncommon' ? '✨' : '⬜';

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-black text-xs uppercase tracking-widest ${config.badgeBg} ${config.badgeText}`}
    >
      <span>{icon}</span>
      <span>{config.label}</span>
      <span className="opacity-60">•</span>
      <RarityStars config={config} />
    </motion.div>
  );
}

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Archetype {
  id: string;
  name: string;
  emoji: string;
  title: string;
  desc: string;
  insight: string;
  strengths: string[];
  weaknesses: string[];
  bestStrategy: string;
  whatToAvoid: string;
  shadowSide: string;
  psychProfile: {
    fomo: number;
    greed: number;
    conviction: number;
    defense: number;
    discipline: number;
  };
}

interface Props {
  archetype: Archetype;
  onRestart: () => void;
  onContinue: () => void;
}

// ─── METADATA URI GENERATOR ─────────────────────────────────────────────────

export function generateArchetypeURI(archetype: Archetype): string {
  const reframe = INVESTOR_REFRAME[archetype.id] || { quizName: archetype.name, tagline: archetype.title };
  const rarityConfig = RARITY_MAP[archetype.id] || RARITY_MAP.community_native;
  const traits = useUserStore.getState().traits;

  const c = {
    c1: rarityConfig.color,
    c2: rarityConfig.color2,
    bg: rarityConfig.svgBg
  };

  const rarityStars = '★'.repeat(rarityConfig.stars) + '☆'.repeat(5 - rarityConfig.stars);

  const getStarsString = (score: number) => {
    if (score >= 85) return '★★★★★';
    if (score >= 70) return '★★★★☆';
    if (score >= 50) return '★★★☆☆';
    if (score >= 30) return '★★☆☆☆';
    return '★☆☆☆☆';
  };

  const starsDef = getStarsString(traits.defense);
  const starsDisc = getStarsString(traits.discipline);
  const starsConv = getStarsString(traits.conviction);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
  <defs>
    <radialGradient id="bg-${archetype.id}" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${c.c1}" stop-opacity="0.3" />
      <stop offset="100%" stop-color="${c.bg}" stop-opacity="1" />
    </radialGradient>
    <linearGradient id="grad-${archetype.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.c1}" />
      <stop offset="100%" stop-color="${c.c2}" />
    </linearGradient>
    <linearGradient id="rarity-bar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${rarityConfig.color}" stop-opacity="0.2" />
      <stop offset="50%" stop-color="${rarityConfig.color}" stop-opacity="0.9" />
      <stop offset="100%" stop-color="${rarityConfig.color}" stop-opacity="0.2" />
    </linearGradient>
    <filter id="glow-filter">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="300" height="420" fill="${c.bg}" rx="20" />
  <rect width="300" height="420" fill="url(#bg-${archetype.id})" rx="20" />
  <rect x="2" y="2" width="296" height="416" fill="none" stroke="${rarityConfig.color}" stroke-width="2" stroke-opacity="0.5" rx="18" />
  <rect x="0" y="0" width="300" height="4" fill="url(#rarity-bar)" rx="2" />
  <path d="M 20 60 L 280 60" stroke="${c.c1}" stroke-width="0.4" stroke-opacity="0.2" />
  <circle cx="150" cy="160" r="90" fill="none" stroke="${c.c1}" stroke-width="0.4" stroke-opacity="0.12" />
  <circle cx="150" cy="160" r="72" fill="none" stroke="${c.c1}" stroke-width="1" stroke-dasharray="4,4" stroke-opacity="0.25" />
  <rect x="102" y="14" width="96" height="22" fill="${rarityConfig.color}" fill-opacity="0.15" rx="11" stroke="${rarityConfig.color}" stroke-width="0.8" stroke-opacity="0.6" />
  <text x="150" y="29" text-anchor="middle" font-family="monospace" font-weight="900" font-size="9" fill="${rarityConfig.color}" letter-spacing="1.5">${rarityConfig.label.toUpperCase()}</text>
  <text x="150" y="52" text-anchor="middle" font-family="monospace" font-size="11" fill="#FBBF24" letter-spacing="3" opacity="0.95">${rarityStars}</text>
  <circle cx="150" cy="160" r="58" fill="#000000" fill-opacity="0.65" stroke="url(#grad-${archetype.id})" stroke-width="2.5" />
  <text x="150" y="171" text-anchor="middle" font-size="62" dominant-baseline="middle" filter="url(#glow-filter)">${reframe.emoji}</text>
  <text x="150" y="262" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="900" font-size="17" fill="#ffffff" letter-spacing="0.5">${reframe.quizName}</text>
  <text x="150" y="284" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-weight="700" font-size="8.5" fill="${c.c1}" letter-spacing="2.5" opacity="0.9">${reframe.tagline.toUpperCase()}</text>
  <text x="150" y="302" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-size="7.5" fill="#64748B" letter-spacing="1">${archetype.name} • ${archetype.title}</text>
  <g transform="translate(25, 320)">
    <text x="0" y="5" font-size="8" font-weight="bold" fill="#E2E8F0" font-family="sans-serif">🛡 Scam Resistance</text>
    <text x="250" y="5" font-size="10.5" font-weight="bold" fill="#FBBF24" font-family="monospace" text-anchor="end">${starsDef}</text>
    <text x="0" y="23" font-size="8" font-weight="bold" fill="#E2E8F0" font-family="sans-serif">🎯 Execution Discipline</text>
    <text x="250" y="23" font-size="10.5" font-weight="bold" fill="#FBBF24" font-family="monospace" text-anchor="end">${starsDisc}</text>
    <text x="0" y="41" font-size="8" font-weight="bold" fill="#E2E8F0" font-family="sans-serif">🏔 Conviction</text>
    <text x="250" y="41" font-size="10.5" font-weight="bold" fill="#FBBF24" font-family="monospace" text-anchor="end">${starsConv}</text>
  </g>
  <path d="M 14 26 L 26 26 M 14 26 L 14 38" fill="none" stroke="${rarityConfig.color}" stroke-width="1.5" stroke-opacity="0.7" />
  <path d="M 286 26 L 274 26 M 286 26 L 286 38" fill="none" stroke="${rarityConfig.color}" stroke-width="1.5" stroke-opacity="0.7" />
  <path d="M 14 394 L 26 394 M 14 394 L 14 382" fill="none" stroke="${rarityConfig.color}" stroke-width="1.5" stroke-opacity="0.7" />
  <path d="M 286 394 L 274 394 M 286 394 L 286 382" fill="none" stroke="${rarityConfig.color}" stroke-width="1.5" stroke-opacity="0.7" />
  <text x="150" y="408" text-anchor="middle" dominant-baseline="middle" font-family="monospace" font-weight="900" font-size="6.5" fill="${c.c1}" opacity="0.7" letter-spacing="4">CRYPDOID ECOSYSTEM</text>
</svg>`;

  const encodedSvg = typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(svg))) : '';
  const metadata = {
    name: `CrypdoID Archetype: ${reframe.quizName}`,
    description: `Gue adalah ${reframe.quizName} (${reframe.tagline})! Cek profil psikologi Web3 gue di CrypdoID.`,
    image: `data:image/svg+xml;base64,${encodedSvg}`,
    attributes: [
      { trait_type: 'Rarity', value: rarityConfig.label },
      { trait_type: 'Title', value: reframe.tagline },
      { trait_type: 'Crowd Sensitivity', value: traits.fomo, display_type: 'number' },
      { trait_type: 'Profit Discipline', value: 100 - traits.greed, display_type: 'number' },
      { trait_type: 'Scam Resistance', value: traits.defense, display_type: 'number' },
      { trait_type: 'Conviction', value: traits.conviction, display_type: 'number' },
      { trait_type: 'Execution Discipline', value: traits.discipline, display_type: 'number' },
    ]
  };
  return `data:application/json;base64,${typeof window !== 'undefined' ? btoa(unescape(encodeURIComponent(JSON.stringify(metadata)))) : ''}`;
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function ArchetypeResult({ archetype, onRestart, onContinue }: Props) {
  const traits = useUserStore(state => state.traits);

  const {
    mint,
    isMinted,
    isConfirming,
    isMining,
    isSuccess,
    txHash,
    error,
    isBase,
    isConnected,
    isMock
  } = useMintArchetype(archetype.id, {
    fomo: traits.fomo,
    greed: traits.greed,
    scamResistance: traits.defense,
    uri: generateArchetypeURI(archetype),
  });

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const rarityConfig = RARITY_MAP[archetype.id] || RARITY_MAP.community_native;
  const reframe = INVESTOR_REFRAME[archetype.id] || { quizName: archetype.name, tagline: archetype.title };

  const handleShare = () => {
    useUserStore.getState().setProfileFlag('hasSharedArchetype', true);
    setIsShareModalOpen(true);
  };

  useEffect(() => {
    if (isMinted || isSuccess) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 25 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);
    }
  }, [isMinted, isSuccess]);

  const getButtonContent = () => {
    if (isMinted || isSuccess) return (<><CheckCircle size={16} />Archetype NFT Minted ✅</>);
    if (isMining) return (<><Loader2 size={16} className="animate-spin" />Minting on Base...</>);
    if (isConfirming) return (<><Loader2 size={16} className="animate-spin" />Confirming Wallet...</>);
    if (isMock) return <>Connect Real Wallet to Mint</>;
    if (!isConnected) return <>Connect Wallet to Mint</>;
    if (!isBase) return <>Switch to Base to Mint</>;
    return (<><Award size={16} />MINT ARCHETYPE NFT</>);
  };

  const displayTraits = [
    { key: 'fomo', label: 'Crowd Sensitivity', value: traits.fomo, desc: 'Seberapa gampang lo tergoda beli saat semua orang heboh (FOMO).', color: 'from-red-600 to-orange-500' },
    { key: 'greed', label: 'Profit Discipline', value: 100 - traits.greed, desc: 'Kemampuan mengontrol keserakahan dan disiplin merealisasikan keuntungan (Take Profit).', color: 'from-yellow-600 to-amber-400' },
    { key: 'conviction', label: 'Conviction Index', value: traits.conviction, desc: 'Kekuatan keyakinan lo pada aset jangka panjang saat dihantam badai berita buruk (FUD).', color: 'from-purple-600 to-pink-400' },
    { key: 'defense', label: 'Scam Resistance', value: traits.defense, desc: 'Ketajaman radar lo dalam mendeteksi skema penipuan, Ponzi, dan proyek abal-abal.', color: 'from-indigo-600 to-blue-500' },
    { key: 'discipline', label: 'Execution Discipline', value: traits.discipline, desc: 'Konsistensi dan kedisiplinan lo dalam mengeksekusi rencana tanpa dipengaruhi emosi sesaat.', color: 'from-emerald-600 to-teal-400' }
  ];

  return (
    <div id="archetype-result-container" className="py-4 px-1 max-w-2xl mx-auto w-full select-none">
      <div
        id="archetype-result-card"
        className="relative bg-surface-dark border rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl p-6 md:p-10"
        style={{ borderColor: rarityConfig.border + '40' }}
      >
        {/* Dynamic glow background based on rarity */}
        <div
          className="absolute top-0 right-0 w-72 h-72 -translate-y-1/2 translate-x-1/2 rounded-full blur-[120px] pointer-events-none"
          style={{ background: rarityConfig.glow }}
        />
        <div className="absolute bottom-0 left-0 w-64 h-64 translate-y-1/2 -translate-x-1/2 rounded-full blur-[100px] pointer-events-none"
          style={{ background: rarityConfig.glow, opacity: 0.4 }} />

        {/* Shimmer line for Rare+ */}
        {rarityConfig.shimmer && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-0.5 pointer-events-none"
            style={{ background: `linear-gradient(90deg, transparent, ${rarityConfig.color}, transparent)` }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="relative space-y-10">

          {/* ── HERO ── */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-center flex flex-col items-center gap-3"
          >
            {/* Rarity badge — first thing user sees */}
            <RarityBadge config={rarityConfig} />

            {/* Emoji */}
            <div className="relative group my-2">
              <div
                className="absolute inset-0 blur-xl rounded-full animate-pulse"
                style={{ background: rarityConfig.glow }}
              />
              <div
                className="w-28 h-28 rounded-[2.5rem] bg-black/60 flex items-center justify-center text-6xl shadow-2xl backdrop-blur-md relative z-10 overflow-hidden border"
                style={{ borderColor: rarityConfig.border + '60' }}
              >
                {reframe.emoji}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: rarityConfig.color }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              </div>
            </div>

            {/* Names */}
            <div className="space-y-1 text-center">
              <span
                className="text-[10px] uppercase font-black tracking-[0.4em] block px-3 py-0.5 rounded-full border w-max mx-auto mb-1"
                style={{
                  color: rarityConfig.color,
                  borderColor: rarityConfig.color + '30',
                  background: rarityConfig.color + '15'
                }}
              >
                Kode Investasi Lo
              </span>

              <h1
                className="text-4xl md:text-5xl font-black tracking-tighter leading-none"
                style={{ color: rarityConfig.color }}
              >
                {reframe.quizName}
              </h1>
              <div className="h-px bg-white/20 w-16 mx-auto my-3" />
              <p className="text-white/70 text-base font-black italic uppercase tracking-wider">
                {reframe.tagline}
              </p>

              {/* Original crypto name — secondary, small */}
              <p className="text-slate-600 text-xs font-mono mt-1">
                {archetype.name} • {archetype.title}
              </p>
            </div>

            {/* Rarity description */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`text-xs font-bold italic px-4 py-2 rounded-xl border ${rarityConfig.badgeBg} ${rarityConfig.badgeText}`}
            >
              {rarityConfig.description}
            </motion.p>
          </motion.div>

          {/* ── INSIGHT QUOTE ── */}
          <div
            className="bg-black/40 rounded-2xl md:rounded-3xl p-6 md:p-8 pt-8 md:pt-10 text-center relative overflow-hidden border"
            style={{ borderColor: rarityConfig.border + '20' }}
          >
            <div
              className="absolute top-0 right-0 px-4 py-1 rounded-bl-3xl text-[8px] font-mono font-black uppercase tracking-widest border-l border-b"
              style={{
                background: rarityConfig.color + '15',
                color: rarityConfig.color,
                borderColor: rarityConfig.border + '25'
              }}
            >
              💬 Laporan Psikologi
            </div>
            <p className="text-slate-200 font-bold leading-relaxed italic text-sm md:text-base">
              "{archetype.insight}"
            </p>
          </div>

          {/* ── PSYCHE STATS ── */}
          <div>
            <h3 className="uppercase text-[10px] tracking-[0.2em] text-slate-500 font-black mb-6 text-center flex items-center justify-center gap-2">
              <Target size={12} style={{ color: rarityConfig.color }} /> LAPORAN PSIKOLOGI (PRIVATE REPORT)
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {displayTraits.map((t) => (
                <div key={t.key} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="capitalize font-black text-xs text-slate-300 tracking-wide font-mono">{t.label}</span>
                    <span className="font-black text-base text-white">{t.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80 mb-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${t.value}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className={`h-full bg-gradient-to-r ${t.color}`}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic font-semibold leading-normal">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── STRENGTHS & WEAKNESSES ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl md:rounded-3xl p-6 space-y-4">
              <h4 className="font-black text-xs text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Zap size={16} /> Kelebihan Lo
              </h4>
              <ul className="space-y-2">
                {archetype.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 font-bold flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-2xl md:rounded-3xl p-6 space-y-4">
              <h4 className="font-black text-xs text-red-400 uppercase tracking-widest flex items-center gap-2">
                <Shield size={16} /> Kelemahan Lo
              </h4>
              <ul className="space-y-2">
                {archetype.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-slate-400 font-bold flex items-start gap-2">
                    <span className="text-red-500 font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── SHADOW SIDE ── */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl md:rounded-3xl p-6 space-y-3">
            <h4 className="font-black text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
              <Shield size={16} className="text-amber-500" /> 🌑 Sisi Bayangan (Shadow Side)
            </h4>
            <p className="text-xs text-slate-300 font-medium leading-relaxed italic">
              {archetype.shadowSide}
            </p>
          </div>

          {/* ── STRATEGY ── */}
          <div className="space-y-4 pt-4 border-t text-left" style={{ borderColor: rarityConfig.border + '20' }}>
            <h4 className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest italic mb-2">
              Strategi Buat Lo
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl p-5 md:p-6 space-y-2">
                <h5 className="font-black text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  🚀 Yang Harus Lo Lakuin
                </h5>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">{archetype.bestStrategy}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500/5 to-transparent border border-amber-500/10 rounded-2xl p-5 md:p-6 space-y-2">
                <h5 className="font-black text-xs text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  🚫 Yang Harus Lo Hindarin
                </h5>
                <p className="text-slate-300 text-xs leading-relaxed font-semibold">{archetype.whatToAvoid}</p>
              </div>
            </div>
          </div>

          {/* ── NFT MINTING ── */}
          <div className="pt-8 border-t text-center space-y-6" style={{ borderColor: rarityConfig.border + '20' }}>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.3em] mx-auto animate-pulse"
              style={{
                background: rarityConfig.color + '15',
                borderColor: rarityConfig.color + '30',
                color: rarityConfig.color
              }}
            >
              <Sparkles size={11} />
              {rarityConfig.label} NFT • Web3 Identity
            </div>

            <div className="space-y-1">
              <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                Mint Badge Persona Investasi Lo!
              </h4>
              <p className="text-slate-500 text-xs font-bold italic max-w-sm mx-auto leading-normal">
                Cetak Badge <span style={{ color: rarityConfig.color }}>{getShortName(reframe.quizName)}</span> sebagai NFT on-chain - bukti permanen jati diri investasi lo di blockchain Base Mainnet!
              </p>
            </div>

            {/* NFT Card Preview */}
            <div className="flex justify-center py-2">
              <motion.div
                whileHover={{ y: -8, scale: 1.03 }}
                className="w-full max-w-[240px] aspect-[5/7] rounded-3xl overflow-hidden shadow-2xl relative group bg-black/60"
                style={{ border: `1.5px solid ${rarityConfig.border}40` }}
              >
                <div
                  className="absolute inset-0 opacity-20 blur-2xl group-hover:opacity-50 transition-opacity rounded-3xl"
                  style={{ background: `radial-gradient(circle, ${rarityConfig.glow}, transparent)` }}
                />
                <div className="relative z-10 w-full h-full p-0.5">
                  <ArchetypeNFTSVG archetype={archetype} rarityConfig={rarityConfig} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </motion.div>
            </div>

            {/* Mint Button */}
            <div className="max-w-md mx-auto">
              <motion.button
                onClick={() => {
                  if (!isConnected || isMock) {
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
                className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest italic transition-all shadow-xl relative overflow-hidden ${isMinted || isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                    : isMining || isConfirming
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 cursor-wait'
                      : (!isConnected || isMock)
                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-yellow-500/20 cursor-pointer'
                        : !isBase
                          ? 'bg-[#0052FF] hover:bg-[#0040CC] text-white shadow-[#0052FF]/20 cursor-pointer'
                          : 'text-black cursor-pointer'
                  }`}
                style={(!isMinted && !isSuccess && !isMining && !isConfirming && isBase && !isMock) ? {
                  background: `linear-gradient(135deg, ${rarityConfig.color}, ${rarityConfig.border})`,
                  boxShadow: `0 8px 32px ${rarityConfig.glow}`
                } : {}}
              >
                {(!isMinted && !isSuccess && !isMining && !isConfirming && isBase && !isMock) && (
                  <div className="absolute inset-0 bg-white/10 animate-pulse pointer-events-none" />
                )}
                {getButtonContent()}
              </motion.button>

              {(!isMinted && !isSuccess) && (
                <div className="text-[11px] text-center text-slate-400 font-semibold italic mt-4 px-2 leading-relaxed max-w-sm mx-auto">
                  {(isMock || !isConnected) ? (
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
                  ) : (
                    <p>
                      Pastiin wallet lo punya sedikit{' '}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0052FF]/15 border border-[#0052FF]/30 text-[#85A7FF] font-bold text-[10px] uppercase tracking-wider not-italic align-middle">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 inline-block" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" fill="#0052FF"/>
                          <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
                        </svg>
                        Base ETH
                      </span>{' '}
                      buat bayar gas fee (network fee jaringan Base) untuk mencetak Badge ini!
                    </p>
                  )}
                </div>
              )}

              {error && (
                <p className="text-[10px] text-red-400 font-bold mt-2">❌ {error}</p>
              )}

              {isMinted && (
                <div className="space-y-1.5 mt-3">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    {isMock ? '✅ Karakter Tersimpan (Connect Wallet Asli buat MINT Beneran!)' : '🎉 NFT Berhasil Di-Mint! Cek Wallet Lo.'}
                  </p>
                  {txHash && (
                    <a
                      href={`https://basescan.org/tx/${txHash}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] text-slate-400 hover:text-emerald-400 transition-colors uppercase font-bold tracking-widest"
                    >
                      View Tx on Etherscan <ExternalLink size={9} />
                    </a>
                  )}
                  {CRYPDO_ARCHETYPE_ADDRESS && (CRYPDO_ARCHETYPE_ADDRESS as string) !== '0x0000000000000000000000000000000000000000' && (
                    <div className="pt-0.5">
                      <a
                        href={`https://basescan.org/address/${CRYPDO_ARCHETYPE_ADDRESS}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[9px] text-slate-500 hover:text-indigo-400 transition-colors uppercase font-bold tracking-widest"
                      >
                        View Contract on Etherscan <ExternalLink size={9} />
                      </a>
                    </div>
                  )}
                  <p className="text-[8px] text-amber-500/80 font-bold text-center mt-2 max-w-[200px] mx-auto">
                    💡 Kalo gak muncul di dompet, buka MetaMask &gt; tab NFTs &gt; Import NFT. Masukin address contract di atas dan cari Token ID lo di Etherscan Tx.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── ACTION BUTTONS ── */}
          <div className="flex flex-col gap-3 pt-4">
            <button
              id="archetype-result-continue-btn"
              onClick={onContinue}
              className="w-full py-5 text-white font-black uppercase text-sm rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.985] shadow-xl cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${rarityConfig.color}30, ${rarityConfig.color}15)`,
                border: `1px solid ${rarityConfig.border}40`,
                boxShadow: `0 4px 24px ${rarityConfig.glow}50`
              }}
            >
              KLAIM XP DAN LANJUT KE MISSIONS
              <ArrowRight size={18} />
            </button>
            <div className={import.meta.env.DEV ? "grid grid-cols-2 gap-4" : "grid grid-cols-1"}>
              {import.meta.env.DEV && (
                <button
                  id="archetype-result-restart-btn"
                  onClick={onRestart}
                  className="py-4 bg-transparent hover:bg-surface-dark text-slate-500 font-bold text-xs rounded-2xl border border-border-purple flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Ulangi Kuis (DEV)
                </button>
              )}

              <button
                id="archetype-result-share-btn"
                onClick={handleShare}
                className="py-4 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs rounded-2xl border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Share2 size={16} style={{ color: rarityConfig.color }} />
                Bagikan Hasil
              </button>
            </div>
          </div>

        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`Kode Investasi Gue: ${reframe.quizName}!`}
        shareUrl={typeof window !== 'undefined' ? `${window.location.origin}/quiz` : ''}
      />
    </div>
  );
}
