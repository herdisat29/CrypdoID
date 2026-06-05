// tests/unit/store/stores.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUserStore } from '../../../src/store/userStore';
import { useWalletStore } from '../../../src/store/walletStore';

// ── userStore ────────────────────────────────────────────────────────────────
describe('useUserStore', () => {
  beforeEach(() => {
    useUserStore.getState().resetStore();
    localStorage.clear();
  });

  it('initialises with default archetype', () => {
    expect(useUserStore.getState().archetype).toBe('accumulator');
  });

  it('initialises with empty completedModules', () => {
    expect(useUserStore.getState().completedModules).toEqual([]);
  });

  it('setArchetype updates store and localStorage', () => {
    useUserStore.getState().setArchetype('deep_diver');
    expect(useUserStore.getState().archetype).toBe('deep_diver');
    expect(localStorage.getItem('crypdo_archetype')).toBe('deep_diver');
  });

  it('addCompletedModule adds a module id', () => {
    useUserStore.getState().addCompletedModule(42);
    expect(useUserStore.getState().completedModules).toContain(42);
  });

  it('addCompletedModule is idempotent — no duplicates', () => {
    useUserStore.getState().addCompletedModule(42);
    useUserStore.getState().addCompletedModule(42);
    const modules = useUserStore.getState().completedModules;
    expect(modules.filter(m => m === 42)).toHaveLength(1);
  });

  it('setCompletedModules replaces the list', () => {
    useUserStore.getState().addCompletedModule(1);
    useUserStore.getState().setCompletedModules([10, 20, 30]);
    expect(useUserStore.getState().completedModules).toEqual([10, 20, 30]);
  });

  it('resetStore clears archetype and completedModules', () => {
    useUserStore.getState().setArchetype('deep_diver');
    useUserStore.getState().addCompletedModule(99);
    useUserStore.getState().resetStore();

    expect(useUserStore.getState().archetype).toBe('accumulator');
    expect(useUserStore.getState().completedModules).toEqual([]);
  });

  it('persists completedModules to localStorage', () => {
    useUserStore.getState().addCompletedModule(5);
    const stored = JSON.parse(localStorage.getItem('crypdo_completed_modules_list') ?? '[]');
    expect(stored).toContain(5);
  });
});

// ── walletStore ──────────────────────────────────────────────────────────────
describe('useWalletStore', () => {
  beforeEach(() => {
    useWalletStore.getState().disconnectAll();
    localStorage.clear();
  });

  it('initialises with null mockAddress', () => {
    expect(useWalletStore.getState().mockAddress).toBeNull();
  });

  it('setMockAddress stores address in state and localStorage', () => {
    const addr = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    useWalletStore.getState().setMockAddress(addr);
    expect(useWalletStore.getState().mockAddress).toBe(addr);
    expect(localStorage.getItem('crypdo_mock_wallet')).toBe(addr);
  });

  it('setMockAddress(null) removes from localStorage', () => {
    useWalletStore.getState().setMockAddress('0x1234');
    useWalletStore.getState().setMockAddress(null);
    expect(localStorage.getItem('crypdo_mock_wallet')).toBeNull();
  });

  it('activeAddress() returns mockAddress when set', () => {
    const addr = '0xmock';
    useWalletStore.getState().setMockAddress(addr);
    expect(useWalletStore.getState().activeAddress()).toBe(addr);
  });

  it('activeAddress() returns realAddress when no mock', () => {
    useWalletStore.getState().syncRealWallet('0xreal', true);
    expect(useWalletStore.getState().activeAddress()).toBe('0xreal');
  });

  it('isConnected() returns true when mockAddress is set', () => {
    useWalletStore.getState().setMockAddress('0xmock');
    expect(useWalletStore.getState().isConnected()).toBe(true);
  });

  it('isConnected() returns true when real wallet connected', () => {
    useWalletStore.getState().syncRealWallet('0xreal', true);
    expect(useWalletStore.getState().isConnected()).toBe(true);
  });

  it('isConnected() returns false when both are null/false', () => {
    expect(useWalletStore.getState().isConnected()).toBe(false);
  });

  it('disconnectAll() clears everything', () => {
    useWalletStore.getState().setMockAddress('0xmock');
    useWalletStore.getState().syncRealWallet('0xreal', true);
    useWalletStore.getState().disconnectAll();

    const state = useWalletStore.getState();
    expect(state.mockAddress).toBeNull();
    expect(state.realAddress).toBeNull();
    expect(state.isRealConnected).toBe(false);
    expect(localStorage.getItem('crypdo_mock_wallet')).toBeNull();
  });
});
