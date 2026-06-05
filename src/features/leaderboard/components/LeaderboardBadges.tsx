import { useReadContract } from 'wagmi';
import { CRYPDO_BADGE_ADDRESS, crypdoBadgeABI } from '../../../contracts/CrypdoIDBadge';

interface LeaderboardBadgesProps {
  uid: string;
  firestoreBadges: ('bronze' | 'silver' | 'gold')[];
}

export default function LeaderboardBadges({ uid, firestoreBadges }: LeaderboardBadgesProps) {
  const isValidAddress = Boolean(uid && uid.startsWith('0x') && uid.length === 42);

  const { data: balance } = useReadContract({
    address: CRYPDO_BADGE_ADDRESS,
    abi: crypdoBadgeABI,
    functionName: 'balanceOf',
    args: [uid as `0x${string}`, 1n],
    query: { enabled: isValidAddress },
  });

  const onChainBalance = balance as bigint | undefined;

  const showBronze = (onChainBalance && onChainBalance > 0n) || firestoreBadges.includes('bronze');
  const showSilver = (onChainBalance && onChainBalance > 0n) || firestoreBadges.includes('silver'); // adjust jika tier berbeda
  const showGold = (onChainBalance && onChainBalance > 0n) || firestoreBadges.includes('gold');

  let highestBadge = null;
  if (showGold) {
    highestBadge = { src: "/badge_mission_10_legend.svg", alt: "Legend", title: "CrypdoID Legend" };
  } else if (showSilver) {
    highestBadge = { src: "/badge_mission_9_master.svg", alt: "Master", title: "CrypdoID Master" };
  } else if (showBronze) {
    highestBadge = { src: "/badge_mission_5_scholar.svg", alt: "Scholar", title: "CrypdoID Scholar" };
  }

  if (!highestBadge) return null;

  return (
    <div className="flex items-center">
      <div className="relative">
        <img
          src={highestBadge.src}
          alt={highestBadge.alt}
          className="w-14 h-14 md:w-16 md:h-16 drop-shadow-2xl object-contain transition-transform hover:scale-110"
          title={highestBadge.title}
        />
      </div>
    </div>
  );
}