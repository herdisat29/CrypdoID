import { create } from 'zustand';

interface WalletState {
  mockAddress: string | null;
  realAddress: string | null;
  isRealConnected: boolean;
  activeAddress: string | null;
  isConnected: boolean;
  setMockAddress: (address: string | null) => void;
  syncRealWallet: (address: string | null, isConnected: boolean) => void;
  disconnectAll: () => void;
}

const initialMock = localStorage.getItem('crypdo_mock_wallet');

export const useWalletStore = create<WalletState>((set, get) => ({
  mockAddress: initialMock,
  realAddress: null,
  isRealConnected: false,
  activeAddress: initialMock,
  isConnected: !!initialMock,

  setMockAddress: (address) => {
    if (address) {
      localStorage.setItem('crypdo_mock_wallet', address);
    } else {
      localStorage.removeItem('crypdo_mock_wallet');
    }
    const realConnected = get().isRealConnected;
    const realAddr = get().realAddress;
    const active = (realConnected && realAddr) ? realAddr : (address || realAddr);
    const connected = realConnected || !!address;
    set({ 
      mockAddress: address,
      activeAddress: active,
      isConnected: connected
    });
    // Trigger storage event for reactive synchronization across tabs/views
    window.dispatchEvent(new Event('storage'));
  },

  syncRealWallet: (address, isConnected) => {
    const mock = get().mockAddress;
    const active = (isConnected && address) ? address : (address || mock);
    const connected = isConnected || !!mock;
    set({ 
      realAddress: address, 
      isRealConnected: isConnected,
      activeAddress: active,
      isConnected: connected
    });
  },

  disconnectAll: () => {
    localStorage.removeItem('crypdo_mock_wallet');
    set({ 
      mockAddress: null, 
      realAddress: null, 
      isRealConnected: false,
      activeAddress: null,
      isConnected: false
    });
    window.dispatchEvent(new Event('storage'));
  }
}));
