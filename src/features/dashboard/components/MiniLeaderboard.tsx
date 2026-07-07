import { useState, useEffect } from 'react';
import { Crown, Trophy } from 'lucide-react';
import { playSfx } from '../../../lib/audio';
import { getTitleForLevel, getTitleColorClass } from '../../../contexts/RewardContext';
import { useAccount } from 'wagmi';
import { useWalletStore } from '../../../store/walletStore';
import { INVESTOR_REFRAME, getShortName } from '../../../data/archetypeReframe';
import EnsName from '../../../components/common/EnsName';
import LeaderboardBadges from '../../leaderboard/components/LeaderboardBadges';

interface LeaderboardUser {
  uid: string;
  name: string;
  xp: number;
  level: number;
  archetype: string;
  badges: ('bronze' | 'silver' | 'gold')[];
  walletAddress?: string;
  photoURL?: string;
}

export default function MiniLeaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const { address: realAddress } = useAccount();
  const mockAddress = useWalletStore(state => state.mockAddress);
  const address = mockAddress || realAddress;

  const getArchetypeDisplay = (arch: string) => {
    const reframe = INVESTOR_REFRAME[arch];
    if (reframe) {
      return `${reframe.emoji} ${getShortName(reframe.quizName)}`;
    }
    return "🌟 Explorer";
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (!data.success) throw new Error('Failed to fetch leaderboard');

        const enriched: LeaderboardUser[] = data.leaderboard.map((entry: any) => {
          let name = entry.displayName || entry.uid;
          if (!entry.displayName && entry.uid.startsWith('0x')) {
            name = entry.uid;
          }

          const badgeSet = new Set<'bronze' | 'silver' | 'gold'>(entry.badges || []);
          const isCurrentUser = entry.uid.toLowerCase() === address?.toLowerCase();

          if (isCurrentUser && address) {
            if (localStorage.getItem(`crypdo_minted_${address.toLowerCase()}_tier1`) === 'true') badgeSet.add('bronze');
            if (localStorage.getItem(`crypdo_minted_${address.toLowerCase()}_tier2`) === 'true') badgeSet.add('silver');
            if (localStorage.getItem(`crypdo_minted_${address.toLowerCase()}_tier3`) === 'true') badgeSet.add('gold');
          }

          return {
            uid: entry.uid,
            name,
            xp: entry.xp || 0,
            level: entry.level || 1,
            archetype: entry.archetype || 'unknown',
            badges: Array.from(badgeSet),
            walletAddress: entry.walletAddress || undefined,
            photoURL: entry.photoURL || undefined
          };
        });

        setLeaders(enriched);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [address]);

  const getCumulativeXp = (level: number, progressXp: number): number => {
    let cumulative = 0;
    let currentMax = 1000;
    for (let i = 1; i < level; i++) {
      cumulative += currentMax;
      currentMax = Math.floor(currentMax * 1.25);
    }
    return cumulative + progressXp;
  };

  const totalPages = Math.ceil(leaders.length / itemsPerPage);
  const currentLeaders = leaders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="bg-surface-dark border border-border-purple rounded-[2rem] p-6 flex flex-col relative overflow-hidden shadow-xl h-auto min-h-[300px] w-full">
      <div className="absolute -right-10 -top-10 opacity-5 text-gold-accent rotate-12">
        <Crown size={120} />
      </div>

      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="w-10 h-10 rounded-xl bg-gold-accent/10 border border-gold-accent/20 flex items-center justify-center text-gold-accent shadow-[0_0_15px_rgba(250,204,21,0.15)]">
          <Trophy size={20} />
        </div>
        <div>
          <h3 className="text-white font-black italic uppercase tracking-tight text-xl leading-none mb-1.5">Elite Seniors</h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Hall of Fame</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 relative z-10 min-h-[430px]">
        {isLoading ? (
          <div className="flex justify-center items-center py-6 h-full absolute inset-0">
            <div className="w-8 h-8 border-4 border-vibrant-purple border-t-gold-accent rounded-full animate-spin m-auto"></div>
          </div>
        ) : currentLeaders.length > 0 ? (
          currentLeaders.map((user, idx) => {
            const actualRank = (page - 1) * itemsPerPage + idx + 1;
            return (
              <div
                key={user.uid}
                onMouseEnter={() => playSfx('hover')}
                className={`flex items-center justify-between p-3 h-[80px] rounded-xl transition-all group border ${
                  actualRank === 1 
                    ? 'bg-yellow-400/15 border-yellow-400/60 shadow-[0_0_20px_rgba(250,204,21,0.25)] hover:bg-yellow-400/25 hover:border-yellow-400/80'
                    : actualRank === 2
                    ? 'bg-slate-200/15 border-slate-200/60 shadow-[0_0_20px_rgba(226,232,240,0.15)] hover:bg-slate-200/25 hover:border-slate-200/80'
                    : actualRank === 3
                    ? 'bg-amber-600/15 border-amber-600/60 shadow-[0_0_20px_rgba(217,119,6,0.15)] hover:bg-amber-600/25 hover:border-amber-600/80'
                    : 'bg-black/40 border-white/5 hover:border-gold-accent/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md flex shrink-0 items-center justify-center font-black text-[10px] ${actualRank === 1 ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.8)]' :
                    actualRank === 2 ? 'bg-slate-200 text-black shadow-[0_0_8px_rgba(226,232,240,0.6)]' :
                      actualRank === 3 ? 'bg-amber-600 text-white shadow-[0_0_8px_rgba(217,119,6,0.6)]' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                    #{actualRank}
                  </div>

                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white/10 object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full border-2 border-white/10 bg-slate-800 flex shrink-0 items-center justify-center text-[10px] font-black text-slate-400">
                      {user.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-white font-black text-sm group-hover:text-gold-accent transition-colors truncate max-w-[140px]">
                        {user.walletAddress ? (
                          <EnsName address={user.walletAddress} />
                        ) : user.uid.startsWith('0x') && user.uid.length === 42 ? (
                          <EnsName address={user.uid} />
                        ) : (
                          user.name
                        )}
                      </h4>
                      <span className="text-[7px] text-slate-500 font-bold uppercase italic">({getArchetypeDisplay(user.archetype)})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] uppercase tracking-widest font-bold ${getTitleColorClass(user.level)}`}>
                        Lv.{user.level} {getTitleForLevel(user.level)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <LeaderboardBadges uid={user.uid} firestoreBadges={user.badges} />
                  <div className="flex flex-col items-end">
                    <span className="text-gold-accent font-black text-sm">
                      {getCumulativeXp(user.level, user.xp).toLocaleString()}
                    </span>
                    <span className="text-[8px] text-slate-500 uppercase tracking-widest">XP</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4 text-slate-500 text-xs font-bold italic">
            Belum ada data grinder.
          </div>
        )}
      </div>

      {leaders.length > itemsPerPage && (
        <div className="flex justify-between items-center mt-4 relative z-10 pt-2 border-t border-white/5">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
          >
            &larr; Prev
          </button>
          <span className="text-[9px] font-black text-slate-600">PAGE {page} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}