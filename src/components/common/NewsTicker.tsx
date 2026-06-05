import { useState, useEffect, useRef } from 'react';
import { Radio, ExternalLink } from 'lucide-react';

interface NewsItem {
  title: string;
  link: string;
  source: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  { title: 'Bitcoin kembali uji resistance $100K di tengah sentimen bullish institusional', link: '#', source: 'Market' },
  { title: 'Ethereum ETF spot resmi disetujui — apa artinya buat investor ritel?', link: '#', source: 'Market' },
  { title: 'Waspada: Modus baru phishing wallet menyasar pengguna Telegram Indonesia', link: '#', source: 'Safety' },
  { title: 'Solana catat rekor TVL tertinggi sepanjang masa di ekosistem DeFi', link: '#', source: 'Market' },
  { title: 'Airdrop season 2025: proyek mana yang worth dihunt?', link: '#', source: 'Guides' },
  { title: 'Gas fee Ethereum turun drastis pasca upgrade terbaru — transaksi makin murah', link: '#', source: 'Market' },
  { title: 'SEC vs Ripple update terbaru — XRP masih dalam ketidakpastian regulasi', link: '#', source: 'Market' },
  { title: 'Kenali 5 red flag project crypto sebelum lo FOMO masuk', link: '#', source: 'Safety' },
];

interface TrendingCoinItem {
  item: {
    id: string;
    name: string;
    symbol: string;
    data?: {
      price?: string;
      price_24h_percentage_change?: {
        usd?: number;
      };
    };
  };
}

async function fetchNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('failed');
    const data = await res.json();
    const coins = data?.coins ?? [];
    if (!Array.isArray(coins) || coins.length === 0) throw new Error('empty');

    const trendingItems = (coins as TrendingCoinItem[]).slice(0, 10).map(c => {
      const item = c.item;
      const price = item.data?.price ? `${item.data.price}` : '';
      const change = item.data?.price_24h_percentage_change?.usd;
      const formattedChange = change !== undefined ? ` (${change >= 0 ? '+' : ''}${change.toFixed(2)}%)` : '';
      return {
        title: `⚡ Trending Coin: ${item.name} (${item.symbol.toUpperCase()}) ${price}${formattedChange} lagi rame dibahas di CoinGecko!`,
        link: item.id ? `https://www.coingecko.com/en/coins/${item.id}` : '#',
        source: 'CoinGecko',
      };
    });

    return [...trendingItems, ...FALLBACK_NEWS];
  } catch {
    return FALLBACK_NEWS;
  }
}

export default function NewsTicker() {
  const [news, setNews]     = useState<NewsItem[]>(FALLBACK_NEWS);
  const [isLive, setIsLive] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNews().then(items => { setNews(items); setIsLive(true); });
    const iv = setInterval(() => {
      fetchNews().then(items => { setNews(items); setIsLive(true); });
    }, 5 * 60 * 1000);
    return () => clearInterval(iv);
  }, []);

  const items = [...news, ...news];

  return (
    <div className="w-full bg-slate-950/20 border-t border-white/5 backdrop-blur-sm"
      style={{ height: 32, overflow: 'hidden', flexShrink: 0 }}>
      <div className="flex items-center h-full">

        {/* Label */}
        <div className="flex items-center gap-2 px-4 h-full border-r border-white/5 flex-shrink-0"
          style={{ background: 'transparent', minWidth: 80 }}>
          <Radio size={10} className={isLive ? 'text-vibrant-purple animate-pulse' : 'text-slate-600'} />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]"
            style={{ color: isLive ? '#a855f7' : '#475569' }}>
            {isLive ? 'FEED' : 'NEWS'}
          </span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #020617, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #020617, transparent)' }} />

          <div ref={trackRef} className="ticker-track flex items-center whitespace-nowrap"
            style={{ animationDuration: `${items.length * 1.5}s` }}>
            {items.map((item, i) => (
              <span key={i}
                className="inline-flex items-center gap-3 px-6 cursor-pointer group"
                onClick={() => item.link !== '#' && window.open(item.link, '_blank', 'noopener')}>
                <span className="w-1 h-1 rounded-full bg-white/10 group-hover:bg-vibrant-purple transition-colors flex-shrink-0" />
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-200 transition-colors">
                  {item.title}
                </span>
                {item.link !== '#' && (
                  <ExternalLink size={8}
                    className="text-slate-700 group-hover:text-vibrant-purple transition-colors flex-shrink-0" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
