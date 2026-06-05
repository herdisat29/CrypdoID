// tests/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── localStorage mock ────────────────────────────────────────────────────────
const localStorageStore: Record<string, string> = {};
const localStorageMock: Storage = {
  getItem: (key) => localStorageStore[key] ?? null,
  setItem: (key, value) => { localStorageStore[key] = value; },
  removeItem: (key) => { delete localStorageStore[key]; },
  clear: () => { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); },
  key: (i) => Object.keys(localStorageStore)[i] ?? null,
  get length() { return Object.keys(localStorageStore).length; },
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── AudioContext mock ────────────────────────────────────────────────────────
vi.stubGlobal('AudioContext', vi.fn(function() {
  return {
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    })),
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    })),
    destination: {},
    currentTime: 0,
  };
}));

// ── Firebase mock ────────────────────────────────────────────────────────────
vi.mock('../src/lib/firebase', () => ({
  db: {},
  auth: { currentUser: null },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  updateDoc: vi.fn(),
  setDoc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  serverTimestamp: vi.fn(() => new Date().toISOString()),
}));

// ── wagmi mock ───────────────────────────────────────────────────────────────
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: null, isConnected: false })),
}));
