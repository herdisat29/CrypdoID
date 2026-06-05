import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';
import { crypdoBadgeABI, CRYPDO_BADGE_ADDRESS } from '../contracts/CrypdoIDBadge';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';

const getMintCacheKey = (address: string, tier: number) =>
  `crypdo_minted_${address.toLowerCase()}_tier${tier}`;

export function useMintBadge(tier: 1 | 2 | 3) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const isBase = chain?.id === base.id;

  const [localMinted, setLocalMinted] = useState<boolean>(() => {
    if (!address) return false;
    return localStorage.getItem(getMintCacheKey(address, tier)) === 'true';
  });

  useEffect(() => {
    if (address) {
      setLocalMinted(localStorage.getItem(getMintCacheKey(address, tier)) === 'true');
    } else {
      setLocalMinted(false);
    }
  }, [address, tier]);

  const { data: hasMintedData, refetch: refetchMintStatus } = useReadContract({
    address: CRYPDO_BADGE_ADDRESS as `0x${string}`,
    abi: crypdoBadgeABI,
    functionName: 'hasMintedTier',
    args: address ? [address, tier] : undefined,
    query: { enabled: !!address },
  });

  const syncToFirestore = async (userAddress: string) => {
    try {
      const badgeName = tier === 1 ? 'bronze' : tier === 2 ? 'silver' : 'gold';
      await setDoc(doc(db, 'users', userAddress.toLowerCase()), {
        badges: arrayUnion(badgeName),
        network: 'base',
      }, { merge: true });
    } catch (err) {
      console.error('Failed to sync badge to Firestore', err);
    }
  };

  useEffect(() => {
    if (hasMintedData && address) {
      localStorage.setItem(getMintCacheKey(address, tier), 'true');
      setLocalMinted(true);
    }
  }, [hasMintedData, address, tier]);

  const isMinted = localMinted || !!hasMintedData;

  const { writeContract, data: txHash, isPending: isConfirming, error: writeError } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message?.toLowerCase() || '';
      if (msg.includes('user rejected') || msg.includes('user denied')) {
        setError('Transaksi dibatalkan.');
      } else if (msg.includes('insufficient funds')) {
        setError('ETH tidak cukup untuk gas fee di Base.');
      } else if (msg.includes('already minted')) {
        setError('Badge ini sudah pernah di-mint.');
      } else {
        setError('Minting gagal. Coba lagi.');
      }
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && address) {
      localStorage.setItem(getMintCacheKey(address, tier), 'true');
      setLocalMinted(true);
      syncToFirestore(address);
      refetchMintStatus();
    }
  }, [isSuccess, address, tier]);

  const mint = async () => {
    setError(null);
    if (!address) {
      setError('Connect wallet dulu.');
      return;
    }
    if (!isBase) {
      try {
        switchChain({ chainId: base.id });
        return;
      } catch {
        setError('Gagal switch ke Base network.');
        return;
      }
    }
    try {
      writeContract({
        address: CRYPDO_BADGE_ADDRESS as `0x${string}`,
        abi: crypdoBadgeABI,
        functionName: 'mintBadge',
        args: [tier],
      });
    } catch (err: any) {
      setError(err?.message || 'Minting gagal.');
    }
  };

  return {
    mint,
    isMinted,
    isConfirming,
    isMining,
    isSuccess,
    txHash,
    error,
    isBase,
    isConnected: !!address,
    switchToBase: () => switchChain({ chainId: base.id }),
  };
}