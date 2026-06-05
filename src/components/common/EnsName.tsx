import { useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';

interface EnsNameProps {
  address: string;
}

export default function EnsName({ address }: EnsNameProps) {
  const { data: ensName, isLoading } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
    query: {
      staleTime: 10 * 60 * 1000, // 10 minutes cache
    }
  });

  // Shorten the address if no ENS is found
  const fallback = address.startsWith('0x') && address.length > 10 
    ? `${address.slice(0, 5)}...${address.slice(-4)}`
    : address;

  if (isLoading) {
    return <span className="animate-pulse">{fallback}</span>;
  }

  return <span>{ensName || fallback}</span>;
}
