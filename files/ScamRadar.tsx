import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Search, Loader2, AlertTriangle, 
  Users, Radio, Share2
} from 'lucide-react';
import { getGeminiResponse } from '../../services/geminiService';
import { checkTokenSecurity, TokenSecurityResult } from '../../services/tokenSecurity';
import ShareModal from '../../components/common/ShareModal';
import { useUserStore } from '../../store/userStore';

interface ParsedAnalysis {
  riskScore: number;
  ringkasan: string;
  verdict: 'AMAN' | 'HATI-HATI' | 'BAHAYA';
  verdictAlasan: string;
  teamStatus: string;
  marketCap: string;
  volume24h: string;
  hargaChange7d: string;
  redFlags: string[];
  greenFlags: string[];
  takeaway: string;
}

interface AnalysisResult {
  raw: string;
  riskScore: number;
  parsed: ParsedAnalysis | null;
}

const getRiskEmojiColor = (risk: string) => {
  if (risk === 'HIGH') return 'text-red-500';
  if (risk === 'MEDIUM') return 'text-amber-500';
  return 'text-emerald-500';
};

const getRiskTextColor = (risk: string) => {
  if (risk === 'HIGH') return 'text-red-500';
  if (risk === 'MEDIUM') return 'text-amber-500';
  return 'text-emerald-500';
};

const getPersonalizedTakeaway = (result: TokenSecurityResult) => {
  if (result.isHoneypot) 
    return "Honeypot adalah jebakan paling mematikan. Selalu cek apakah token bisa dijual sebelum lo transfer dana. Jangan pernah percaya janji profit gila-gilaan.";
  
  if (result.buyTax > 10 || result.sellTax > 10) 
    return "Tax terlalu tinggi biasanya tanda proyek tidak sehat atau dev mau ambil keuntungan besar. Lebih baik skip daripada rugi perlahan.";
  
  return "Kontrak terlihat standar, tapi tetap lakukan riset sendiri. Cek social media, team, dan liquidity lock sebelum masuk.";
};

const getFinalVerdict = (result: TokenSecurityResult) => {
  if (result.overallRisk === 'HIGH') 
    return "🚨 JANGAN MASUK. Sangat berbahaya. Cari proyek lain.";
  
  if (result.overallRisk === 'MEDIUM') 
    return "⚠️ Caution. Bisa dipertimbangkan tapi dengan sangat hati-hati dan modal kecil.";
  
  return "🟢 Relatif Aman. Tapi tetap DYOR dan jangan all-in!";
};

export default function ScamAnalyzer() {
  const [activeTab, setActiveTab] = useState<'contract' | 'sentiment'>('sentiment');
  const [input, setInput] = useState('');
  const [selectedChain, setSelectedChain] = useState<number>(1); // 1 = Ethereum, 56 = BSC, 8453 = Base, 137 = Polygon
  const [isChainDropdownOpen, setIsChainDropdownOpen] = useState(false);

  // On-Chain Security State
  const [contractAddress, setContractAddress] = useState('');
  const [securityResult, setSecurityResult] = useState<TokenSecurityResult | null>(null);
  const [isScanningContract, setIsScanningContract] = useState(false);
  const [contractError, setContractError] = useState('');
  const [autoSwitchNotice, setAutoSwitchNotice] = useState('');

  // Sentiment Analysis State
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

// Fetch real market data dari CoinGecko (free, no API key)
const fetchCoinGeckoData = async (query: string) => {
  try {
    const searchRes = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    const searchData = await searchRes.json();
    if (!searchData.coins || searchData.coins.length === 0) return null;

    const coinId = searchData.coins[0].id;
    const coinRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`
    );
    const coin = await coinRes.json();

    return {
      name: coin.name,
      symbol: coin.symbol?.toUpperCase(),
      marketCap: coin.market_data?.market_cap?.usd
        ? `$${(coin.market_data.market_cap.usd / 1e6).toFixed(2)}M`
        : 'Tidak tersedia',
      volume24h: coin.market_data?.total_volume?.usd
        ? `$${(coin.market_data.total_volume.usd / 1e6).toFixed(2)}M`
        : 'Tidak tersedia',
      priceChange24h: coin.market_data?.price_change_percentage_24h?.toFixed(2) ?? 'N/A',
      priceChange7d: coin.market_data?.price_change_percentage_7d?.toFixed(2) ?? 'N/A',
      priceChange30d: coin.market_data?.price_change_percentage_30d?.toFixed(2) ?? 'N/A',
      athDropPercent: coin.market_data?.ath_change_percentage?.usd?.toFixed(1) ?? 'N/A',
      categories: coin.categories?.slice(0, 3).join(', ') || 'Tidak terkategori',
      twitterFollowers: coin.community_data?.twitter_followers?.toLocaleString() ?? 'N/A',
      genesisDate: coin.genesis_date ?? 'Tidak diketahui',
      descriptionSnippet: coin.description?.en
        ? coin.description.en.replace(/<[^>]+>/g, '').slice(0, 400)
        : null,
    };
  } catch {
    return null;
  }
};

  // Trigger Gemini Analysis for general project
  const performAnalysis = async () => {
    if (!input.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    // Step 1: Fetch real data dari CoinGecko
    const cgData = await fetchCoinGeckoData(input.trim());

    // Step 2: Susun context data nyata untuk prompt
    const marketContext = cgData
      ? `
DATA PASAR REAL (CoinGecko):
- Nama: ${cgData.name} (${cgData.symbol})
- Market Cap: ${cgData.marketCap}
- Volume 24h: ${cgData.volume24h}
- Perubahan Harga: 24h ${cgData.priceChange24h}% | 7d ${cgData.priceChange7d}% | 30d ${cgData.priceChange30d}%
- Jarak dari ATH: ${cgData.athDropPercent}%
- Kategori: ${cgData.categories}
- Twitter Followers: ${cgData.twitterFollowers}
- Genesis Date: ${cgData.genesisDate}
${cgData.descriptionSnippet ? `- Deskripsi: ${cgData.descriptionSnippet}` : ''}

Gunakan data ini sebagai referensi faktual. Bila ada inkonsistensi antara data dan klaim project, tandai sebagai red flag.`
      : `[Data CoinGecko tidak tersedia — project ini kemungkinan belum listed, sangat baru, atau salah nama. Ini sendiri adalah red flag.]`;

    const prompt = `Kamu adalah Scam Radar dari CrypdoID. Jawab HANYA dalam format JSON valid berikut, tanpa teks tambahan di luar JSON, tanpa markdown, tanpa backtick.

Project: ${input}
${marketContext}

PENTING: Gunakan data CoinGecko bila tersedia. Jangan ngarang angka.

Kembalikan JSON ini (isi semua field):
{
  "riskScore": <angka 0-100>,
  "ringkasan": "<1 kalimat ringkas maks 20 kata>",
  "verdict": "<AMAN | HATI-HATI | BAHAYA>",
  "verdictAlasan": "<1 kalimat tegas kenapa>",
  "teamStatus": "<DOXXED | SEMI-DOXXED | ANONYMOUS>",
  "marketCap": "<dari CoinGecko atau Tidak tersedia>",
  "volume24h": "<dari CoinGecko atau Tidak tersedia>",
  "hargaChange7d": "<dari CoinGecko atau N/A>",
  "redFlags": ["<maks 10 kata>", "<maks 10 kata>", "<maks 10 kata>"],
  "greenFlags": ["<maks 10 kata>"],
  "takeaway": "<1 kalimat pelajaran terpenting>"
}`;

    try {
      const response = await getGeminiResponse([], prompt);
      let parsed = null;
      let score = 65;
      try {
        const clean = response.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(clean);
        score = parsed.riskScore || 65;
      } catch {
        score = extractRiskScore(response) || 65;
      }
      setAnalysis({
        raw: response,
        riskScore: score,
        parsed,
      });
      const profile = useUserStore.getState();
      profile.setProfileFlag('scanCount', profile.scanCount + 1);

      // kalau result HIGH risk → honeypot mission
      if (score >= 70) {
        profile.setProfileFlag('hasHoneypot', true);
      }
      // NOTE: AI project analysis tidak return isHoneypot field, score >= 70 sudah cukup
    } catch {
      setAnalysis({
        raw: 'Waduh Senior, sistem lagi overload. Coba lagi bentar ya!',
        riskScore: 0,
        parsed: null,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractRiskScore = (text: string) => {
    const match = text.match(/RISK SCORE:\s*(\d+)/i);
    return match ? parseInt(match[1]) : null;
  };

  // Run On-chain smart contract analysis
  const handleOnChainScan = async () => {
    if (!contractAddress.trim() || isScanningContract) return;

    setIsScanningContract(true);
    setContractError('');
    setSecurityResult(null);
    setAutoSwitchNotice('');

    try {
      const result = await checkTokenSecurity(contractAddress.trim(), selectedChain);
      setSecurityResult(result);

      const detectedId = result.detectedChainId || result.detectedChain;
      if (detectedId && detectedId !== selectedChain) {
        setSelectedChain(detectedId);
        const nameMap: Record<number, string> = {
          1: 'Ethereum',
          56: 'BNB Chain',
          8453: 'Base Network',
          137: 'Polygon'
        };
        setAutoSwitchNotice(`Anjay! Token ini ketemu di ${nameMap[detectedId] || 'jaringan lain'}. Jaringan otomatis digeser biar lo gak ribet!`);
      }

      // Trigger user experience points & mark mission 3 as completed!
      const profile = useUserStore.getState();
      profile.setProfileFlag('scanCount', profile.scanCount + 1);

      // Mission 7: hanya trigger kalau isHoneypot === true (bukan sekadar HIGH risk)
      // Ini memastikan user beneran nemuin honeypot, bukan sekadar token berisiko
      if (result?.isHoneypot === true) {
        profile.setProfileFlag('hasHoneypot', true);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setContractError(errorMsg || 'Gagal mengecek token. Pastiin address dan network lo bener.');
    } finally {
      setIsScanningContract(false);
    }
  };

  const chainList = [
    { id: 1, name: 'Ethereum', short: 'ETH', logo: '🔷', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { id: 56, name: 'BNB Chain', short: 'BSC', logo: '🟡', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    { id: 8453, name: 'Base Network', short: 'BASE', logo: '🔵', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 137, name: 'Polygon', short: 'POLY', logo: '🔮', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  ];

  const getDexScreenerUrl = (address: string, chainId: number) => {
    const chainSlugMap: Record<number, string> = {
      1: 'ethereum',
      56: 'bsc',
      8453: 'base',
      137: 'polygon'
    };
    const slug = chainSlugMap[chainId] || 'ethereum';
    return `https://dexscreener.com/${slug}/${address}`;
  };

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full py-4 md:py-8 gap-4 md:gap-8 px-4 md:px-6">
      
      {/* Header Info */}
      <div className="space-y-2.5 sm:space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] md:text-xs font-black uppercase tracking-[0.2em]">
          <ShieldAlert size={12} className="shadow-[0_0_8px_#ef4444] md:w-[14px] md:h-[14px]" />
          Scam Detector v2.1
        </div>
        <h2 className="text-3xl md:text-6xl font-black tracking-tight text-white italic uppercase leading-none">
          Anti <span className="text-vibrant-purple italic drop-shadow-[0_0_10px_#7e22ce]">Scam</span>
        </h2>
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed font-bold">
          Sebelum lo kena mental karena rugpull, mending kita bedah dulu smart contract, transfer tax, dan liquidity lock token pilihan lo secara instan via analisis onchain dan kecerdasan buatan (AI).
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex bg-black/40 p-1.5 rounded-2xl border border-border-purple">
        <button
          onClick={() => { setActiveTab('sentiment'); setContractError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider italic transition-all ${
            activeTab === 'sentiment' 
              ? 'bg-vibrant-purple text-white shadow-xl shadow-vibrant-purple/20' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Users size={16} />
          <span>Project Analyzer</span>
        </button>
        <button
          onClick={() => { setActiveTab('contract'); setContractError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 md:py-4 rounded-xl text-xs md:text-sm font-black uppercase tracking-wider italic transition-all ${
            activeTab === 'contract' 
              ? 'bg-vibrant-purple text-white shadow-xl shadow-vibrant-purple/20' 
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Radio size={16} />
          <span>On-Chain Smart Scan</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'contract' ? (
          <motion.div
            key="contract-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Custom Dropdown Chain Selector */}
            <div className="space-y-2 relative">
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">1. PILIH CHAIN JARINGAN TOKEN</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsChainDropdownOpen(!isChainDropdownOpen)}
                  className="w-full h-14 bg-surface-dark/90 border-2 border-border-purple rounded-2xl px-5 text-sm font-black italic text-white flex items-center justify-between hover:border-vibrant-purple transition-all select-none cursor-pointer focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {chainList.find(c => c.id === selectedChain)?.logo || '🔷'}
                    </span>
                    <span className="tracking-wide">
                      {chainList.find(c => c.id === selectedChain)?.name || 'Ethereum'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 font-bold italic text-slate-400 not-italic uppercase ml-2">
                      {chainList.find(c => c.id === selectedChain)?.short || 'ETH'}
                    </span>
                  </div>
                  <span className={`text-slate-400 transform transition-transform duration-250 ${isChainDropdownOpen ? 'rotate-180 text-vibrant-purple' : ''}`}>
                    ▼
                  </span>
                </button>

                <AnimatePresence>
                  {isChainDropdownOpen && (
                    <>
                      {/* Clicking outside closes dropdown */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsChainDropdownOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute w-full mt-1 bg-[#120f22] border-2 border-border-purple rounded-xl overflow-hidden z-55 shadow-2xl shadow-black/90 p-1.5"
                      >
                        {chainList.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedChain(c.id);
                              setIsChainDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-xs font-black uppercase italic transition-all cursor-pointer ${
                              selectedChain === c.id
                                ? 'bg-vibrant-purple text-white shadow-lg'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{c.logo}</span>
                              <span className="tracking-wide">{c.name}</span>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold italic uppercase ${selectedChain === c.id ? 'bg-black/30 text-white' : 'bg-surface-dark border border-border-purple text-slate-500'}`}>
                              {c.short}
                            </span>
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input Address Area */}
            <div className="space-y-2">
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase">2. PASTE CONTRACT ADDRESS (CA)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                  <Search size={20} className="text-slate-600 group-focus-within:text-gold-accent transition-all" />
                </div>
                <input 
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOnChainScan()}
                  type="text" 
                  placeholder="CONTRACT ADDRESS (0x...)" 
                  className="w-full h-16 bg-surface-dark border-2 border-border-purple rounded-2xl pl-12 pr-28 md:pr-40 text-sm font-mono text-white placeholder:text-slate-700 focus:outline-none focus:border-vibrant-purple transition-all"
                />
                <button 
                  onClick={handleOnChainScan}
                  disabled={isScanningContract || !contractAddress.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 md:px-8 bg-red-600 hover:bg-gold-accent hover:text-black disabled:bg-slate-800 disabled:text-slate-600 text-white text-[11px] font-black uppercase italic rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center gap-2"
                >
                  {isScanningContract ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  <span>{isScanningContract ? 'SCANNING...' : 'SCAN'}</span>
                </button>
              </div>
            </div>

            {/* Mission 7 Hint — tampil kalau belum dapat honeypot */}
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-400/70 text-[11px] font-bold">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <span className="text-amber-400">MISI 7 TIP:</span> Buat nemuin honeypot, scan address yang emang didesain sebagai jebakan.
                Coba address ini: <button
                  onClick={() => setContractAddress('0x000000000000000000000000000000000000dead')}
                  className="font-mono text-amber-300 underline underline-offset-2 hover:text-white transition-colors"
                >0x000...dead</button> — dijamin honeypot.
              </span>
            </div>

            {contractError && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs md:text-sm font-bold flex gap-3 items-center"
              >
                <AlertTriangle size={20} className="shrink-0" />
                <p>{contractError}</p>
              </motion.div>
            )}

            {/* Contract Scan Results */}
            <AnimatePresence mode="wait">
              {isScanningContract && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-surface-dark border-2 border-dashed border-border-purple rounded-[2rem] p-6 md:p-8 space-y-6 md:space-y-8 animate-pulse relative overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
                    <div className="space-y-3">
                      <div className="h-3 w-40 bg-slate-800 rounded"></div>
                      <div className="h-8 w-64 bg-slate-700 rounded"></div>
                      <div className="h-3 w-28 bg-slate-800 rounded"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right space-y-1">
                        <div className="h-2 w-16 bg-slate-800 rounded"></div>
                        <div className="h-6 w-20 bg-slate-700 rounded"></div>
                      </div>
                      <div className="h-10 w-24 bg-slate-800 rounded-xl"></div>
                    </div>
                  </div>

                  <div className="bg-vibrant-purple/5 border border-vibrant-purple/20 p-5 rounded-2xl flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 animate-bounce"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-48 bg-slate-700 rounded"></div>
                      <div className="h-3 w-full bg-slate-800 rounded animate-pulse"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2">
                        <div className="h-2 w-12 bg-slate-800 mx-auto rounded"></div>
                        <div className="h-6 w-16 bg-slate-700 mx-auto rounded"></div>
                        <div className="h-2 w-10 bg-slate-800 mx-auto rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <div className="h-2 w-32 bg-slate-800 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
                      <div className="h-10 w-full bg-slate-800 rounded-xl"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {securityResult && !isScanningContract && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-surface-dark border-2 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden ${
                    securityResult.isSimulated
                      ? 'border-dashed border-yellow-500/40'
                      : 'border-border-purple'
                  }`}
                >
                  {/* Big Verdict Header */}
                  <div className="text-center border-b border-white/10 pb-8">
                    <div className={`text-7xl mb-4 transition-all ${getRiskEmojiColor(securityResult.overallRisk)}`}>
                      {securityResult.overallRisk === 'HIGH' ? '☠️' : 
                       securityResult.overallRisk === 'MEDIUM' ? '⚠️' : '🟢'}
                    </div>
                    
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                      {securityResult.tokenName} ({securityResult.tokenSymbol})
                      {securityResult.isSimulated && (
                        <span className="ml-2 text-xs font-black bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-1 rounded-lg align-middle tracking-widest uppercase not-italic animate-pulse">
                          SIMULATED
                        </span>
                      )}
                    </h2>
                    
                    <div className={`text-5xl font-black mt-3 ${getRiskTextColor(securityResult.overallRisk)}`}>
                      {securityResult.riskScore}/100
                    </div>
                    <p className="uppercase text-xs tracking-widest font-black mt-1 text-slate-500">
                      {securityResult.overallRisk} RISK • {securityResult.chain}
                    </p>
                  </div>

                  {/* Auto-Switch Notice Alert */}
                  {autoSwitchNotice && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex gap-3 relative z-10 items-center text-xs font-bold text-yellow-400 shadow-inner"
                    >
                      <span className="text-base animate-bounce">⚡</span>
                      <p className="leading-snug">{autoSwitchNotice}</p>
                    </motion.div>
                  )}

                  {/* AI Simulated Mode Warning — PROMINENT BANNER */}
                  {securityResult.isSimulated && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-red-950/40 to-yellow-950/40 border-2 border-yellow-500/50 p-5 rounded-2xl relative z-10 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl animate-bounce">🚧</span>
                        <h4 className="text-yellow-400 font-black text-sm uppercase tracking-widest">
                          HASIL SIMULASI — BUKAN DATA ON-CHAIN REAL
                        </h4>
                      </div>
                      <p className="text-yellow-200/80 text-xs font-bold leading-relaxed">
                        Token ini <strong className="text-yellow-300">belum terdaftar</strong> di provider on-chain (GoPlus Labs). 
                        Semua angka risk score, tax, dan flag di bawah adalah <strong className="text-yellow-300">estimasi heuristik/AI</strong> yang 
                        deterministik berdasarkan hash address — <strong className="text-red-400">BUKAN analisis smart contract nyata</strong>. 
                        Jangan gunakan data ini untuk keputusan finansial.
                      </p>
                    </motion.div>
                  )}

                  {/* HONEYPOT WARNING - PALING KRITIS */}
                  {securityResult.isHoneypot && (
                    <motion.div 
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ repeat: Infinity, duration: 2.2 }}
                      className="bg-red-600/10 border-2 border-red-500 rounded-2xl p-6"
                    >
                      <div className="flex items-start gap-5">
                        <div className="text-5xl">☠️</div>
                        <div className="space-y-2">
                          <h4 className="text-red-400 font-black text-xl tracking-tight">HONEYPOT TERDETEKSI!</h4>
                          <p className="text-red-300 font-bold leading-tight">
                            Lo bisa BELI, tapi hampir pasti GAK BISA JUAL. 
                            Devnya lagi ketawa liat orang masuk jebakan ini.
                          </p>
                          <p className="text-xs text-red-400/80 italic">Ini jebakan klasik. Langsung tinggalin.</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Tax & Security Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-5 rounded-2xl text-center border border-white/5">
                      <p className="text-xs text-slate-400">BUY TAX</p>
                      <p className={`text-4xl font-black ${securityResult.buyTax > 8 ? 'text-red-400' : 'text-white'}`}>
                        {securityResult.buyTax}%
                      </p>
                    </div>
                    <div className="bg-black/40 p-5 rounded-2xl text-center border border-white/5">
                      <p className="text-xs text-slate-400">SELL TAX</p>
                      <p className={`text-4xl font-black ${securityResult.sellTax > 8 ? 'text-red-400' : 'text-white'}`}>
                        {securityResult.sellTax}%
                      </p>
                    </div>
                  </div>

                  {/* Warnings List */}
                  {securityResult.warnings.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-black text-red-400 uppercase tracking-widest">⚠️ RED FLAGS & SECURITY CHECKS</p>
                      {securityResult.warnings.map((warning: string, i: number) => (
                        <div key={i} className="bg-red-500/5 border border-red-500/20 p-4 rounded-xl text-sm text-red-300">
                          {warning}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional safety flags check if any */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10 text-xs text-slate-300 font-bold">
                    <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">Mintable (Cetak Token):</span>
                      <span className={securityResult.hasMint ? "text-red-400 font-black" : "text-emerald-400"}>
                        {securityResult.hasMint ? "YES (!) ☠️" : "NO"}
                      </span>
                    </div>
                    <div className="p-4 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-slate-400">Blacklist Wallet:</span>
                      <span className={securityResult.hasBlacklist ? "text-red-400 font-black" : "text-emerald-400"}>
                        {securityResult.hasBlacklist ? "YES (!) ⚠️" : "NO"}
                      </span>
                    </div>
                  </div>

                  {/* Learning Takeaway */}
                  <div className="bg-vibrant-purple/10 border border-vibrant-purple/30 rounded-2xl p-6">
                    <h4 className="font-black text-vibrant-purple mb-2 text-sm">📌 APA YANG BISA LO PELAJARI</h4>
                    <p className="text-slate-300 text-sm leading-relaxed font-semibold">
                      {getPersonalizedTakeaway(securityResult)}
                    </p>
                  </div>

                  {/* Final Verdict */}
                  <div className={`p-6 rounded-2xl text-center font-black border-2 text-lg ${
                    securityResult.overallRisk === 'HIGH' 
                      ? 'border-red-500 bg-red-500/10 text-red-400' 
                      : securityResult.overallRisk === 'MEDIUM' 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400' 
                      : 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {getFinalVerdict(securityResult)}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3 pt-4">
                    <a 
                      href={getDexScreenerUrl(contractAddress, selectedChain)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-center text-[10px] md:text-xs font-black hover:bg-white/10 transition-all text-white flex items-center justify-center gap-2"
                    >
                      📈 DEX
                    </a>
                    <button 
                      onClick={() => window.open('https://revoke.cash', '_blank')}
                      className="flex-1 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-[10px] md:text-xs font-black hover:bg-red-500 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      🛡️ REVOKE
                    </button>
                    <button 
                      onClick={() => setIsShareModalOpen(true)}
                      className="flex-[1.5] py-4 bg-vibrant-purple/20 border border-vibrant-purple/50 rounded-2xl text-vibrant-purple text-[10px] md:text-xs font-black hover:bg-vibrant-purple hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(126,34,206,0.2)]"
                    >
                      <Share2 size={16} /> SHARE (+100 XP)
                    </button>
                  </div>

                  {/* New Scan Trigger */}
                  <div className="pt-2 flex justify-center text-[10px] font-black uppercase tracking-widest relative z-10">
                    <button 
                      onClick={() => { setSecurityResult(null); setContractAddress(''); }}
                      className="text-gold-accent font-black hover:text-white transition-all bg-gold-accent/5 px-5 py-2.5 rounded-xl border border-gold-accent/20 hover:border-gold-accent hover:bg-gold-accent/10 italic cursor-pointer"
                    >
                      SCAN TOKEN BARU &rarr;
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="sentiment-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Input Section */}
            <div className="space-y-2">
              {/* Disclaimer */}
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-3 items-start">
                <span className="text-yellow-400 text-base flex-shrink-0">⚠️</span>
                <p className="text-yellow-400 text-xs font-bold leading-relaxed">
                  Analisis ini menggabungkan data pasar real dari CoinGecko dengan AI. 
                  Bukan real-time social media monitoring. Selalu verifikasi manual & DYOR 
                  sebelum keputusan finansial apapun.
                </p>
              </div>
              <label className="text-[10px] font-black tracking-widest text-slate-500 uppercase block pt-2">TULIS NAMA ATAU SIMBOL PROJECT CRYPTO</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
                  <Search size={22} className="text-slate-600 group-focus-within:text-gold-accent transition-all" />
                </div>
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && performAnalysis()}
                  type="text" 
                  placeholder="MISALNYA: SHIBA AI, PEPE KING, ATAU SAITAMA COIN..." 
                  className="w-full h-16 bg-surface-dark border-2 border-border-purple rounded-2xl pl-12 pr-28 md:pr-40 text-sm font-black text-white italic tracking-tight focus:outline-none focus:border-vibrant-purple transition-all placeholder:text-slate-700 uppercase"
                />
                <button 
                  onClick={performAnalysis}
                  disabled={isAnalyzing || !input.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 md:px-8 bg-red-600 hover:bg-gold-accent hover:text-black disabled:bg-slate-800 disabled:text-slate-600 text-[11px] text-white font-black uppercase italic rounded-xl transition-all shadow-xl shadow-red-600/20 active:scale-95 flex items-center gap-2"
                >
                  {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  <span>{isAnalyzing ? 'STALKING...' : 'STALK'}</span>
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {analysis ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-4"
                >
                  {analysis.parsed ? (() => {
                    const p = analysis.parsed!;
                    const isHigh = p.riskScore > 70;
                    const isMed = p.riskScore > 45;
                    const riskColor = isHigh ? '#ef4444' : isMed ? '#facc15' : '#10b981';
                    const riskBorder = isHigh ? 'border-red-500/40' : isMed ? 'border-amber-500/40' : 'border-emerald-500/40';
                    const riskBg = isHigh ? 'bg-red-500/8' : isMed ? 'bg-amber-500/8' : 'bg-emerald-500/8';
                    const riskText = isHigh ? 'text-red-400' : isMed ? 'text-amber-400' : 'text-emerald-400';
                    const verdictEmoji = p.verdict === 'BAHAYA' ? '☠️' : p.verdict === 'HATI-HATI' ? '⚠️' : '✅';

                    return (
                      <>
                        {/* Hero: Risk Score + Verdict */}
                        <div className={`relative overflow-hidden rounded-3xl border-2 ${riskBorder} ${riskBg} p-6 flex items-center gap-5`}>
                          <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[80px] opacity-20"
                            style={{ background: riskColor }} />
                          {/* Big score */}
                          <div className="relative z-10 flex-shrink-0 text-center w-24">
                            <div className="font-black leading-none text-5xl" style={{ color: riskColor }}>
                              {p.riskScore}
                            </div>
                            <div className="text-[9px] font-black tracking-widest uppercase text-slate-500 mt-1">RISK</div>
                          </div>
                          {/* Divider */}
                          <div className="h-14 w-px bg-white/10 flex-shrink-0" />
                          {/* Verdict text */}
                          <div className="relative z-10 flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xl">{verdictEmoji}</span>
                              <span className={`text-base font-black tracking-tight ${riskText}`}>{p.verdict}</span>
                            </div>
                            <p className="text-white/80 text-xs font-semibold leading-relaxed line-clamp-2">{p.verdictAlasan}</p>
                          </div>
                        </div>

                        {/* Ringkasan */}
                        <div className="bg-white/4 border border-white/8 rounded-2xl px-5 py-4">
                          <p className="text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase mb-1.5">📋 RINGKASAN</p>
                          <p className="text-white text-sm font-semibold leading-relaxed">{p.ringkasan}</p>
                        </div>

                        {/* Market Stats row */}
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'MARKET CAP', value: p.marketCap },
                            { label: 'VOL 24H', value: p.volume24h },
                            { label: '7D CHANGE', value: p.hargaChange7d },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-black/40 border border-white/6 rounded-xl p-3 text-center">
                              <p className="text-[8px] font-black tracking-widest text-slate-600 uppercase mb-1">{stat.label}</p>
                              <p className={`text-xs font-black truncate ${
                                stat.label === '7D CHANGE' && stat.value !== 'N/A'
                                  ? parseFloat(stat.value) >= 0 ? 'text-emerald-400' : 'text-red-400'
                                  : 'text-white'
                              }`}>{stat.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Team Status pill */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/6 border border-amber-500/20 rounded-xl">
                          <span className="text-base">👤</span>
                          <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Team Status:</span>
                          <span className={`text-xs font-black ml-auto px-3 py-1 rounded-full ${
                            p.teamStatus === 'DOXXED'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : p.teamStatus === 'SEMI-DOXXED'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-400 border border-red-500/30'
                          }`}>{p.teamStatus}</span>
                        </div>

                        {/* Red & Green Flags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Red Flags */}
                          <div className="bg-red-500/5 border border-red-500/25 rounded-2xl p-4 space-y-2.5">
                            <p className="text-[9px] font-black tracking-[0.2em] text-red-400 uppercase">🚩 RED FLAGS</p>
                            {p.redFlags.length > 0 ? p.redFlags.map((flag, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="text-red-500 text-xs mt-0.5 flex-shrink-0 font-black">✕</span>
                                <span className="text-red-200/80 text-xs font-semibold leading-snug">{flag}</span>
                              </div>
                            )) : (
                              <p className="text-red-400/40 text-xs italic">Tidak terdeteksi</p>
                            )}
                          </div>
                          {/* Green Flags */}
                          <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl p-4 space-y-2.5">
                            <p className="text-[9px] font-black tracking-[0.2em] text-emerald-400 uppercase">✅ GREEN FLAGS</p>
                            {p.greenFlags.length > 0 ? p.greenFlags.map((flag, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <span className="text-emerald-500 text-xs mt-0.5 flex-shrink-0 font-black">✓</span>
                                <span className="text-emerald-200/80 text-xs font-semibold leading-snug">{flag}</span>
                              </div>
                            )) : (
                              <p className="text-emerald-400/40 text-xs italic">Tidak ada green flag</p>
                            )}
                          </div>
                        </div>

                        {/* Takeaway */}
                        <div className="bg-vibrant-purple/8 border border-vibrant-purple/25 rounded-2xl px-5 py-4 flex gap-3 items-start">
                          <span className="text-lg flex-shrink-0 mt-0.5">📌</span>
                          <div>
                            <p className="text-[9px] font-black tracking-[0.2em] text-purple-400 uppercase mb-1">TAKEAWAY</p>
                            <p className="text-slate-300 text-xs font-semibold leading-relaxed">{p.takeaway}</p>
                          </div>
                        </div>

                        {/* Bottom actions */}
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => setIsShareModalOpen(true)}
                            className="flex-1 py-3 bg-vibrant-purple/15 border border-vibrant-purple/40 rounded-xl text-vibrant-purple text-xs font-black hover:bg-vibrant-purple hover:text-white transition-all flex items-center justify-center gap-2"
                          >
                            <Share2 size={14} /> SHARE +100 XP
                          </button>
                          <button
                            onClick={() => { setAnalysis(null); setInput(''); }}
                            className="flex-1 py-3 bg-white/4 border border-white/10 rounded-xl text-slate-400 text-xs font-black hover:text-white hover:bg-white/8 transition-all italic"
                          >
                            NEW STALK →
                          </button>
                        </div>
                      </>
                    );
                  })() : (
                    /* Fallback: raw text if JSON parse failed */
                    <div className="bg-surface-dark border-2 border-border-purple rounded-[2rem] p-6 space-y-4">
                      <div className={`text-center text-7xl font-black italic ${
                        analysis.riskScore > 70 ? 'text-red-500' : analysis.riskScore > 45 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{analysis.riskScore}%</div>
                      <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap font-mono border-l-4 border-vibrant-purple pl-4 bg-black/30 p-4 rounded-xl">
                        {analysis.raw}
                      </div>
                      <button onClick={() => { setAnalysis(null); setInput(''); }}
                        className="w-full py-3 text-xs font-black text-gold-accent border border-gold-accent/30 rounded-xl hover:bg-gold-accent/10 transition-all">
                        NEW STALK →
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16 gap-6 text-center">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-red-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldAlert size={20} className="text-red-500 animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-white font-black text-xl italic tracking-tight uppercase leading-none">Fetching Market Data...</p>
                    <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest italic animate-pulse">CoinGecko + AI analysis in progress</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-6 bg-surface-dark border border-border-purple rounded-[1.8rem] space-y-3 hover:border-vibrant-purple transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <h4 className="text-white font-black text-sm uppercase italic tracking-tight">AI Risk Analysis</h4>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">Analisis pattern red flag project crypto berbasis data training AI — tokenomics, team track record, dan narasi market.</p>
                  </div>
                  <div className="p-6 bg-surface-dark border border-border-purple rounded-[1.8rem] space-y-3 hover:border-vibrant-purple transition-all group">
                    <div className="w-10 h-10 rounded-xl bg-vibrant-purple/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Users size={20} className="text-vibrant-purple" />
                    </div>
                    <h4 className="text-white font-black text-sm uppercase italic tracking-tight">CoinGecko Market Data</h4>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">Data real: market cap, volume, price movement, dan community stats langsung dari CoinGecko sebelum dianalisis AI.</p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto py-6 opacity-40 hover:opacity-100 transition-all border-t border-border-purple/20 select-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest italic text-center md:text-left">
            ⚠️ NOT FINANCIAL ADVICE协议 &bull; CRYPDOID SECURE ENVELOPE
          </p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-slate-600 font-black tracking-widest uppercase">SISTEM AKTIF & AMAN</span>
          </div>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)} 
        title={`Baru aja nge-scan project di CrypdoID Scam Radar! Cek hasilnya biar gak gampang kena rugpull. 🔥`}
      />

    </div>
  );
}
