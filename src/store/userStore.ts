import { create } from 'zustand';

export interface TraitScores {
  fomo: number;
  discipline: number;
  conviction: number;
  defense: number;
  greed: number;
}

export interface PlayerProfile {
  hasArchetype: boolean;
  completedModules: number[];
  scanCount: number;
  scannedTokens: string[];
  hasHoneypot: boolean;
  hasRoadmapStarted: boolean;
  hasFullTrack: boolean;
  hasSharedArchetype: boolean;
  streak: number;
}

interface UserState extends PlayerProfile {
  archetype: string;
  traits: TraitScores;
  setArchetype: (archetype: string) => void;
  setTraits: (traits: TraitScores) => void;
  setCompletedModules: (modules: number[]) => void;
  addCompletedModule: (moduleId: number) => void;
  addScannedToken: (token: string) => void;
  setProfileFlag: (key: keyof Omit<PlayerProfile, 'completedModules' | 'hasArchetype' | 'scannedTokens'>, value: boolean | number | string) => void;
  resetStore: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  archetype: localStorage.getItem('crypdo_archetype') || '',
  hasArchetype: !!localStorage.getItem('crypdo_archetype'),
  scanCount: parseInt(localStorage.getItem('crypdo_scan_count') || '0'),
  streak: parseInt(localStorage.getItem('crypdo_streak') || '0'),
  hasHoneypot: !!localStorage.getItem('crypdo_honeypot_found'),
  hasRoadmapStarted: !!localStorage.getItem('crypdo_roadmap_started'),
  hasFullTrack: !!localStorage.getItem('crypdo_full_track_complete'),
  hasSharedArchetype: !!localStorage.getItem('crypdo_shared_archetype'),
  traits: (() => {
    try {
      const saved = localStorage.getItem('crypdo_traits');
      return saved ? JSON.parse(saved) : { fomo: 50, discipline: 50, conviction: 50, defense: 50, greed: 50 };
    } catch {
      return { fomo: 50, discipline: 50, conviction: 50, defense: 50, greed: 50 };
    }
  })(),
  completedModules: (() => {
    try {
      const saved = localStorage.getItem('crypdo_completed_modules_list');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  scannedTokens: (() => {
    try {
      const saved = localStorage.getItem('crypdo_scanned_tokens');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })(),
  setArchetype: (archetype) => {
    localStorage.setItem('crypdo_archetype', archetype);
    set({ archetype, hasArchetype: !!archetype });
  },
  setTraits: (traits) => {
    localStorage.setItem('crypdo_traits', JSON.stringify(traits));
    set({ traits });
  },
  setCompletedModules: (completedModules) => {
    localStorage.setItem('crypdo_completed_modules_list', JSON.stringify(completedModules));
    set({ completedModules });
  },
  addCompletedModule: (moduleId) => {
    set((state) => {
      if (state.completedModules.includes(moduleId)) return state;
      const newModules = [...state.completedModules, moduleId];
      localStorage.setItem('crypdo_completed_modules_list', JSON.stringify(newModules));
      return { completedModules: newModules };
    });
  },
  setProfileFlag: (key, value) => {
    set(() => {
      // mapping to localStorage keys
      const lsKeyMap: Record<string, string> = {
        scanCount: 'crypdo_scan_count',
        hasHoneypot: 'crypdo_honeypot_found',
        hasRoadmapStarted: 'crypdo_roadmap_started',
        hasFullTrack: 'crypdo_full_track_complete',
        hasSharedArchetype: 'crypdo_shared_archetype',
        streak: 'crypdo_streak'
      };
      
      const lsKey = lsKeyMap[key];
      if (lsKey) {
        if (typeof value === 'boolean') {
          if (value) localStorage.setItem(lsKey, 'true');
          else localStorage.removeItem(lsKey);
        } else if (typeof value === 'number') {
          localStorage.setItem(lsKey, String(value));
        }
      }
      return { [key]: value };
    });
  },
  addScannedToken: (token) => {
    set((state) => {
      const normalized = token.trim().toLowerCase();
      const existing = state.scannedTokens.map(t => t.toLowerCase());
      if (existing.includes(normalized)) return state;
      const newTokens = [...state.scannedTokens, token.trim()];
      localStorage.setItem('crypdo_scanned_tokens', JSON.stringify(newTokens));
      return { scannedTokens: newTokens };
    });
  },
  resetStore: () => {
    localStorage.removeItem('crypdo_archetype');
    localStorage.removeItem('crypdo_completed_modules_list');
    localStorage.removeItem('crypdo_scan_count');
    localStorage.removeItem('crypdo_honeypot_found');
    localStorage.removeItem('crypdo_roadmap_started');
    localStorage.removeItem('crypdo_roadmap_complete');
    localStorage.removeItem('crypdo_full_track_complete');
    localStorage.removeItem('crypdo_shared_archetype');
    localStorage.removeItem('crypdo_streak');
    localStorage.removeItem('crypdo_scanned_tokens');
    localStorage.removeItem('crypdo_traits');
    set({ 
      archetype: '', 
      hasArchetype: false,
      completedModules: [],
      scanCount: 0,
      hasHoneypot: false,
      hasRoadmapStarted: false,
      hasFullTrack: false,
      hasSharedArchetype: false,
      streak: 0,
      scannedTokens: [],
      traits: { fomo: 50, discipline: 50, conviction: 50, defense: 50, greed: 50 }
    });
  }
}));
