import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, Smartphone, ChevronDown, ChevronUp } from 'lucide-react';
import { useConnect } from 'wagmi';
import { useState } from 'react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { connectors, connect, status } = useConnect();
  const isPending = status === 'pending';
  const [showWalletInfo, setShowWalletInfo] = useState(false);

  const filteredConnectors = connectors.filter(c => 
    !c.name.toLowerCase().includes('rabby') && 
    !c.name.toLowerCase().includes('brave')
  );

  const formatConnectorName = (name: string) => {
    if (name.toLowerCase() === 'injected') return 'Browser Wallet';
    return name;
  };

  const modalContent = (
    <motion.div
      initial={{ scale: 0.95, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 10 }}
      className="relative w-full max-w-md bg-[#121214] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col min-h-[400px] my-auto h-fit max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-10"
      >
        <X size={20} />
      </button>

      {/* Main Content */}
      <div className="p-6 md:p-8 flex flex-col h-full gap-5">
        
        <div className="mb-2">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-1">Hubungkan Dompet</h3>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Pilih Wallet Lo, Senior</p>
        </div>

        {/* Accordion Info Web3 Wallet (Moved below title) */}
        <div className="bg-[#150a21] border border-vibrant-purple/20 rounded-xl overflow-hidden shrink-0">
          <button 
            onClick={() => setShowWalletInfo(!showWalletInfo)}
            className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gold-accent/20 border border-gold-accent flex items-center justify-center animate-pulse shrink-0 shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                <span className="text-gold-accent font-black text-xs">?</span>
              </div>
              <span className="text-[9px] font-black text-gold-accent italic uppercase tracking-widest leading-tight">Baru di Crypto? Apa itu Web3 Wallet?</span>
            </div>
            {showWalletInfo ? <ChevronUp size={14} className="text-gold-accent shrink-0" /> : <ChevronDown size={14} className="text-gold-accent shrink-0" />}
          </button>
          <AnimatePresence>
            {showWalletInfo && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-3 pb-3 overflow-hidden"
              >
                <div className="p-3 bg-black/40 rounded-lg border border-white/5 space-y-3">
                  <p className="text-[9px] text-slate-300 font-bold leading-relaxed">
                    Web3 Wallet adalah identitas digital sekaligus gerbang lo menuju internet masa depan. Bedanya dari dompet biasa, wallet ini dipegang 100% langsung oleh lo sendiri secara aman, tanpa perantara bank.
                  </p>
                  <p className="text-[9px] text-slate-300 font-bold leading-relaxed">
                    Bentuknya berupa aplikasi HP atau extension browser (seperti MetaMask & OKX Wallet). Lo butuh ini untuk login, menyimpan crypto, NFT, dan mengklaim reward misi.
                  </p>
                  
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2.5">
                    <h4 className="text-orange-400 font-black text-[9px] uppercase italic tracking-wide mb-1 flex items-center gap-1.5">
                      🔥 Tips Keamanan
                    </h4>
                    <p className="text-orange-200/70 text-[8px] font-bold leading-relaxed">
                      Jangan pernah kasih Secret Recovery Phrase (12 kata rahasia) ke siapapun, termasuk tim dev. Simpan baik-baik di tempat yang aman.
                    </p>
                  </div>

                  <div className="flex gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
                    <Smartphone className="text-blue-400 shrink-0 mt-0.5" size={12} />
                    <div>
                      <h4 className="text-blue-400 font-black text-[8px] uppercase tracking-wider mb-0.5">Tips HP / Mobile:</h4>
                      <p className="text-slate-400 text-[8px] font-bold leading-relaxed">
                        Copy link website ini terus buka di <strong>Browser bawaan aplikasi MetaMask / OKX</strong> langsung di HP lo!
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="space-y-2 mb-4">
            {filteredConnectors.map((connector) => (
              <button
                key={connector.id}
                disabled={isPending}
                onClick={() => {
                  connect({ connector });
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-vibrant-purple hover:bg-vibrant-purple/10 group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110">
                    {connector.name.toLowerCase().includes('metamask') ? (
                      <div className="w-7 h-7 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <span className="text-sm">🦊</span>
                      </div>
                    ) : connector.name.toLowerCase().includes('injected') ? (
                      <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Wallet size={14} className="text-blue-400" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-sm">🌐</span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-white italic uppercase tracking-tight">{formatConnectorName(connector.name)}</p>
                  </div>
                </div>
                <div className="px-2 py-1 rounded-md bg-white/5 text-[7px] font-black uppercase tracking-widest text-slate-500 group-hover:text-vibrant-purple transition-colors">
                  Connect
                </div>
              </button>
            ))}
            
            {filteredConnectors.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-orange-400 text-[9px] font-black uppercase italic tracking-widest">
                  Protocol Error: <br/>
                  Gak nemu Wallet Browser!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Removed Accordion from here since it's at the top now */}

        <div className="mt-6 text-center text-[8px] text-slate-600 font-black uppercase tracking-[0.2em] leading-relaxed italic opacity-50">
          Secured by CrypdoID Protocol
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />
          {modalContent}
        </div>
      )}
    </AnimatePresence>
  );
}
