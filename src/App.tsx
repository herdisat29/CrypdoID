import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAssistantChat } from './hooks/useAssistantChat';

import { RewardProvider } from './contexts/RewardContext';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import LoginPage from './features/auth/LoginPage';
import { useAccount } from 'wagmi';
import DevTool from './components/common/DevTool';

import MainLayout from './components/layout/MainLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import GlobalOverlays from './components/layout/GlobalOverlays';
import { useWalletStore } from './store/walletStore';
import { useUIStore } from './store/uiStore';

import { View } from './types';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RewardProvider>
          <AppMain />
        </RewardProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppMain() {
  const { user, loading } = useAuth();
  const { address: realAddress, isConnected: isRealConnected } = useAccount();
  const { syncRealWallet } = useWalletStore();

  useEffect(() => {
    syncRealWallet(realAddress || null, isRealConnected);
  }, [realAddress, isRealConnected, syncRealWallet]);

  const isMockWallet = useWalletStore(state => !!state.mockAddress);

  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const pathToView = (path: string): View => {
    const segment = path.slice(1);
    const validViews: View[] = ['dashboard', 'quiz', 'security', 'learning', 'missions'];
    if (validViews.includes(segment as View)) return segment as View;
    return 'dashboard';
  };
  const view = pathToView(location.pathname);

  const setShowLoginOverlay = useUIStore(state => state.setShowLoginOverlay);
  const isGuest = useUIStore(state => state.isGuest);
  const setIsGuest = useUIStore(state => state.setIsGuest);

  const setView = (newView: View) => {
    const isAuthorized = !!user || isMockWallet;
    const restrictedViews: View[] = ['learning', 'quiz', 'missions'];
    if (restrictedViews.includes(newView) && !isAuthorized) {
      setShowLoginOverlay(true);
      return;
    }
    const viewPathMap: Record<View, string> = {
      dashboard: '/',
      missions: '/missions',
      learning: '/learning',
      quiz: '/quiz',
      security: '/security',
      assistant: '/assistant',
      leaderboard: '/leaderboard'
    };
    navigate(viewPathMap[newView]);
  };

  // Custom hook for chat operations
  const {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    handleSend
  } = useAssistantChat();

  const [gasFee, setGasFee] = useState(24);
  const [missionSyncKey, setMissionSyncKey] = useState(0);

  // Sync state for missions if any localStorage changes happen (e.g. from DevTool or other features)
  useEffect(() => {
    const handleStorage = () => setMissionSyncKey(prev => prev + 1);
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Simulate gas fee change
  useEffect(() => {
    const interval = setInterval(() => {
      setGasFee(prev => Math.max(10, Math.min(100, prev + (Math.random() > 0.5 ? 2 : -2))));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 text-vibrant-purple animate-spin" />
          <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-[10px] italic animate-pulse">Menyiapkan Aplikasi...</p>
        </div>
      </div>
    );
  }

  if (!user && !isMockWallet && !isGuest) {
    return <LoginPage onClose={() => setIsGuest(true)} />;
  }

  return (
    <>
      <MainLayout 
        view={view}
        setView={setView}
        messages={messages}
        setMessages={setMessages}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={handleSend}
        gasFee={gasFee}
        isSidebarExpanded={isSidebarExpanded}
        setIsSidebarExpanded={setIsSidebarExpanded}
        missionSyncKey={missionSyncKey}
      />

      {import.meta.env.DEV && <DevTool />}
      
      <GlobalOverlays />
    </>
  );
}
