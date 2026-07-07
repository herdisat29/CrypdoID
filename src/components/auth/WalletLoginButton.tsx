import { useState } from 'react';
import { useConnect, useDisconnect, useSignMessage, useAccount } from 'wagmi';
import { Smartphone, HelpCircle } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';
import { useAuth } from '../../features/auth/AuthContext';
import { useUserStore } from '../../store/userStore';
import { SiweMessage } from 'siwe';
import { cn } from '../../lib/utils';

interface WalletLoginButtonProps {
  minimal?: boolean;
}

export default function WalletLoginButton({ minimal = false }: WalletLoginButtonProps) {
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { address: wagmiAddress, isConnected: isWagmiConnected, chainId, connector: activeConnector } = useAccount();
  const { user, logout } = useAuth();
  const [showHelp, setShowHelp] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  
  const mockAddress = useWalletStore(state => state.mockAddress);
  const address = useWalletStore(state => state.realAddress);
  const isConnected = useWalletStore(state => state.isRealConnected);

  const handleSIWELogin = async (connectorId: string) => {
    try {
      setIsSigning(true);
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) throw new Error("Connector not found");

      let accountAddress = wagmiAddress as string;
      let currentChainId = chainId as number;

      if (!isWagmiConnected || activeConnector?.id !== connectorId || !accountAddress) {
        // 1. Connect wallet
        const result = await connectAsync({ connector });
        accountAddress = result.accounts[0] as string;
        currentChainId = result.chainId;
      }

      // 2. Fetch Nonce
      const nonceRes = await fetch('/api/siwe/nonce');
      const nonce = await nonceRes.text();

      // 3. Create SIWE Message
      const message = new SiweMessage({
        domain: window.location.host,
        address: accountAddress,
        statement: 'Sign in to CrypdoID. No gas fees required.',
        uri: window.location.origin,
        version: '1',
        chainId: currentChainId,
        nonce: nonce,
      });

      const preparedMessage = message.prepareMessage();

      // 4. Sign Message
      const signature = await signMessageAsync({
        message: preparedMessage,
      });

      // 5. Verify and get Custom Token
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      }

      const verifyRes = await fetch('/api/siwe/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: preparedMessage, signature }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || 'Verification failed');

      if (verifyData.token) {
        const { signInWithCustomToken } = await import('firebase/auth');
        const { auth } = await import('../../lib/firebase');
        await signInWithCustomToken(auth, verifyData.token);
      }
      
      if (verifyData.linked) {
        alert("Wallet lo berhasil disambungin ke akun Google!");
      }
    } catch (err: any) {
      console.error("SIWE Login failed", err);
      if (err.message !== "User rejected the request.") {
        alert("Gagal konek wallet / tanda tangan ditolak.");
      }
      disconnect();
    } finally {
      setIsSigning(false);
    }
  };

  const handleInjectedConnect = () => handleSIWELogin('injected');
  const handleWalletConnect = () => handleSIWELogin('walletConnect');



  const isDev = import.meta.env.DEV;
  
  const [sandboxCredits, setSandboxCredits] = useState(() => {
    const saved = localStorage.getItem('crypdo_sandbox_credits');
    return saved !== null ? parseInt(saved) : 5;
  });

  const handleGenerateMockWallet = () => {
    if (!isDev && sandboxCredits <= 0) {
      alert("Jatah simulasi habis, Bro! Waktunya naik kelas bikin dompet MetaMask asli biar progress lo tersimpan permanen.");
      return;
    }

    if (!isDev) {
      const newCredits = sandboxCredits - 1;
      setSandboxCredits(newCredits);
      localStorage.setItem('crypdo_sandbox_credits', String(newCredits));
    }

    // Reset local profile before starting a new simulated wallet session
    useUserStore.getState().resetStore();

    // Generate a random Ethereum-format address for simulation
    const hex = '0123456789abcdef';
    let addr = '0x';
    for (let i = 0; i < 40; i++) {
      addr += hex[Math.floor(Math.random() * 16)];
    }
    useWalletStore.getState().setMockAddress(addr);
  };

  const handleDisconnect = async () => {
    useUserStore.getState().resetStore();
    useWalletStore.getState().disconnectAll();
    disconnect();
    if (user) {
      await logout();
    }
  };

  const activeAddress = useWalletStore(state => state.activeAddress);
  const activeIsConnected = useWalletStore(state => state.isConnected);

  if (activeIsConnected && activeAddress) {
    return (
      <div className="space-y-3 text-center">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 font-black text-[7px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
            {mockAddress ? "Simulated Account" : "On-chain Account"}
          </div>
          <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">✅ Wallet Linked</p>
          <p className="font-mono text-sm text-white mt-3 font-semibold selection:bg-emerald-500/30">
            {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
          </p>
          <p className="text-[9px] text-slate-500 font-extrabold uppercase mt-2">
            Status: Synchronized & Secured
          </p>
        </div>
        <button 
          onClick={handleDisconnect}
          className={cn(
            "text-red-400 hover:text-red-500 hover:bg-red-500/5 font-black uppercase tracking-widest border border-red-500/20 transition-all active:scale-95",
            minimal ? "px-3 py-1.5 rounded-xl text-[10px]" : "w-full py-3.5 rounded-2xl text-xs"
          )}
        >
          Logout
        </button>
      </div>
    );
  }

  if (minimal) {
    return (
      <button
        onClick={handleInjectedConnect}
        disabled={isPending || isSigning}
        className="bg-surface-dark border border-border-purple hover:border-vibrant-purple text-slate-300 font-bold px-3 py-1.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md w-full"
      >
        <span className="text-vibrant-purple">🦊</span> {isSigning ? 'Signing...' : 'Connect Wallet'}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* 0. Educational Trigger for absolute beginners */}
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="w-full bg-vibrant-purple/10 hover:bg-vibrant-purple/20 text-gold-accent border border-vibrant-purple/30 rounded-2xl py-3.5 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider italic cursor-pointer text-center"
      >
        <HelpCircle size={14} className="animate-pulse text-gold-accent" />
        🤔 Baru di Crypto? Apa itu Web3 Wallet?
      </button>

      {showHelp && (
        <div className="bg-gradient-to-br from-black/80 to-purple-950/20 border border-vibrant-purple/30 rounded-2xl p-5 text-left space-y-4 text-[11px] leading-relaxed animate-fadeIn max-h-[250px] overflow-y-auto scrollbar-thin">
          <div className="flex gap-2 items-center text-gold-accent text-xs font-black uppercase tracking-wider">
            <span>💡</span>
            <span>Panduan Dompet Web3 untuk Pemula</span>
          </div>
          
          <div className="space-y-2.5 text-slate-300">
            <p>
              <strong className="text-white">Web3 Wallet</strong> adalah identitas digital sekaligus gerbang lo menuju dunia internet masa depan. Bedanya dari dompet biasa, wallet ini dipegang <strong className="text-emerald-400">100% langsung oleh lo sendiri</strong> secara aman, tanpa perantara bank atau pihak ketiga mana pun.
            </p>
            <p>
              Bentuknya berupa aplikasi HP atau extension browser (seperti MetaMask & OKX Wallet). Lo butuh ini untuk otentikasi login, menyimpan koin crypto, aset NFT, serta mengklaim reward misi-misi belajar lo.
            </p>
            
            <div className="py-3 px-4 bg-vibrant-purple/20 rounded-xl border border-vibrant-purple/35 space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-vibrant-purple flex items-center gap-1.5">
                <span>🔥</span> GAK PUNYA WALLET & MALAS SETUP? KITA SIMULASIKAN!
              </span>
              <p className="text-slate-400 font-bold leading-normal italic text-[10px]">
                Gak usah ribet setup dompet asli dulu, Senior! Klik tombol <strong className="text-white">⚡ SIMULASIKAN SANDBOX WALLET</strong> di bawah untuk membuat alamat simulasi instan. Lo bisa langsung menjelajah seluruh fitur & misi akademi seolah-olah sudah punya dompet asli!
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 text-[10px] space-y-2">
            <div className="flex gap-2 items-start text-indigo-400">
              <Smartphone size={14} className="shrink-0 mt-0.5" />
              <p className="font-extrabold uppercase tracking-wide">Tips untuk Pengguna HP / Mobile:</p>
            </div>
            <p className="text-slate-400 leading-normal font-medium">
              Extension MetaMask emang gak bisa jalan langsung di browser Chrome/Safari bawaan HP. Biar lancar pakai dompet asli, lo tinggal copy link website ini terus buka di dalam <strong className="text-white">Browser bawaan dari aplikasi MetaMask / OKX</strong> langsung di HP lo!
            </p>
          </div>
        </div>
      )}

      {/* 1. Browser Extensions */}
      <button
        onClick={handleInjectedConnect}
        disabled={isPending || isSigning}
        className="w-full bg-white hover:bg-slate-100 text-black font-black py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 text-xs uppercase tracking-wider border border-slate-200"
      >
        {isSigning ? 'Tanda Tangan di MetaMask...' : '🦊 CONNECT METAMASK / INJECTED'}
      </button>

      {/* 2. WalletConnect QR */}
      <button
        onClick={handleWalletConnect}
        disabled={isPending || isSigning}
        className="w-full bg-[#3b99fc]/10 hover:bg-[#3b99fc]/20 text-[#3b99fc] border border-[#3b99fc]/20 font-black py-3.5 rounded-2xl transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
      >
        {isSigning ? 'Menunggu Tanda Tangan...' : '🌐 WALLETCONNECT (QR CODE)'}
      </button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800/60"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0f0718] px-3 text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Atau Sandbox Simulator</span>
        </div>
      </div>

      {/* 3. Dev Simulator mode */}
      <button
        onClick={handleGenerateMockWallet}
        disabled={!!mockAddress || (!isDev && sandboxCredits <= 0)}
        className="w-full bg-vibrant-purple/10 hover:bg-vibrant-purple/20 text-gold-accent border border-vibrant-purple/30 font-black py-3.5 rounded-2xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 text-xs uppercase tracking-wider cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <span>
            {mockAddress 
              ? 'Wallet Simulasi Aktif' 
              : (!isDev && sandboxCredits <= 0)
              ? 'Jatah Simulasi Habis'
              : 'Simulasikan Sandbox Wallet'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] text-slate-500 font-bold normal-case tracking-wide not-italic mt-0.5">
          {!mockAddress && (
            <span className="bg-gold-accent/20 text-gold-accent px-1.5 py-0.5 rounded font-black tracking-widest uppercase border border-gold-accent/30">
              CREDIT: {isDev ? '∞ (DEV)' : `${sandboxCredits}/5`}
            </span>
          )}
          <span>⚠️ Progress di Sandbox bisa hilang kapan aja</span>
        </div>
      </button>
    </div>
  );
}
