import { create } from 'zustand';

interface UIState {
  showLoginOverlay: boolean;
  showLogoutConfirm: boolean;
  showOnboarding: boolean;
  isGuest: boolean;
  showWalletModal: boolean;

  setShowLoginOverlay: (show: boolean) => void;
  setShowLogoutConfirm: (show: boolean) => void;
  setShowOnboarding: (show: boolean) => void;
  setIsGuest: (isGuest: boolean) => void;
  setShowWalletModal: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  showLoginOverlay: false,
  showLogoutConfirm: false,
  showOnboarding: !localStorage.getItem('crypdo_onboarding_complete'),
  isGuest: false,
  showWalletModal: false,

  setShowLoginOverlay: (show) => set({ showLoginOverlay: show }),
  setShowLogoutConfirm: (show) => set({ showLogoutConfirm: show }),
  setShowOnboarding: (show) => set({ showOnboarding: show }),
  setIsGuest: (isGuest) => set({ isGuest }),
  setShowWalletModal: (show) => set({ showWalletModal: show }),
}));
