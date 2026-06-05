import { PlayerProfile } from '../../store/userStore';

export type MissionStatus = 'locked' | 'in-progress' | 'completed' | 'claimed';

export interface Mission {
  id: number;
  title: string;
  desc: string;
  progress: number;
  xpReward: number;
  icon: string;
  view: string;
  status: MissionStatus;
  action: string;
}

export type MissionRule = (profile: PlayerProfile, prevMissions: Mission[]) => MissionStatus;

const isClearedById = (id: number, missions: Mission[]): boolean => {
  const found = missions.find(x => x.id === id);
  return found?.status === 'completed' || found?.status === 'claimed';
};

export const missionRules: Record<number, MissionRule> = {
  // Mission 1: Temukan Archetype
  1: (p) => {
    return p.hasArchetype ? 'completed' : 'in-progress';
  },
  
  // Mission 2: Ikuti Learning Path (Mulai belajar)
  2: (p, prev) => {
    if (!isClearedById(1, prev) && !p.hasArchetype) return 'locked';
    return (p.hasRoadmapStarted || p.completedModules.length > 0) ? 'completed' : 'in-progress';
  },

  // Mission 3: Scan Project Pertama
  3: (p, prev) => {
    if (!isClearedById(2, prev)) return 'locked';
    return p.scannedTokens.length >= 1 ? 'completed' : 'in-progress';
  },

  // Mission 4: Scan 3 Token Berbeda
  4: (p, prev) => {
    if (!isClearedById(3, prev)) return 'locked';
    return (p.scannedTokens?.length || 0) >= 3 ? 'completed' : 'in-progress';
  },

  // Mission 5: Selesaikan 1 Modul Belajar
  5: (p, prev) => {
    if (!isClearedById(4, prev)) return 'locked';
    return p.completedModules.length >= 1 ? 'completed' : 'in-progress';
  },

  // Mission 6: Temukan Token Honeypot
  6: (p, prev) => {
    if (!isClearedById(5, prev)) return 'locked';
    return p.hasHoneypot ? 'completed' : 'in-progress';
  },

  // Mission 7: Streak 3 Hari Berturut
  7: (p, prev) => {
    if (!isClearedById(6, prev)) return 'locked';
    return p.streak >= 3 ? 'completed' : 'in-progress';
  },

  // Mission 8: Share Archetype Lo
  8: (p, prev) => {
    if (!isClearedById(7, prev)) return 'locked';
    return p.hasSharedArchetype ? 'completed' : 'in-progress';
  },

  // Mission 9: Selesaikan 1 Learning Track Penuh
  9: (p, prev) => {
    if (!isClearedById(8, prev)) return 'locked';
    return p.hasFullTrack ? 'completed' : 'in-progress';
  },

  // Mission 10: CrypdoID Master
  10: (_, prev) => {
    const allPreviousCleared = [1,2,3,4,5,6,7,8,9].every(id => isClearedById(id, prev));
    if (!allPreviousCleared) return 'locked';
    return 'completed';
  }
};

export const initialMissions: Mission[] = [
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
    desc: 'Coba Scam Radar buat ngecek project yang lagi lo incer.',
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
    id: 7,
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
