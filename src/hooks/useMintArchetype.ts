import { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useSwitchChain } from 'wagmi';
import { base } from 'viem/chains';
import { crypdoArchetypeABI, CRYPDO_ARCHETYPE_ADDRESS } from '../contracts/CrypdoIDBadge';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useWalletStore } from '../store/walletStore';

const getMintCacheKey = (address: string) =>
  `crypdo_minted_archetype_${address.toLowerCase()}`;

export function useMintArchetype(archetypeId: string, archetypeStats?: {
  fomo: number;
  greed: number;
  scamResistance: number;
  uri?: string;
}) {
  const { address, chain } = useAccount();
  const { switchChain } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  const mockAddress = useWalletStore(state => state.mockAddress);
  const isMock = !!mockAddress && !address;
  const effectiveAddress = address || mockAddress;

  const isBase = chain?.id === base.id;

  const [localMinted, setLocalMinted] = useState<boolean>(() => {
    if (!effectiveAddress) return false;
    return localStorage.getItem(getMintCacheKey(effectiveAddress)) === 'true';
  });

  const { data: hasMintedData, refetch: refetchMintStatus } = useReadContract({
    address: CRYPDO_ARCHETYPE_ADDRESS as `0x${string}`,
    abi: crypdoArchetypeABI,
    functionName: 'hasMinted',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (effectiveAddress) {
      setLocalMinted(localStorage.getItem(getMintCacheKey(effectiveAddress)) === 'true');
    } else {
      setLocalMinted(false);
    }
  }, [effectiveAddress]);

  useEffect(() => {
    if (hasMintedData && effectiveAddress) {
      localStorage.setItem(getMintCacheKey(effectiveAddress), 'true');
      setLocalMinted(true);
    }
  }, [hasMintedData, effectiveAddress]);

  const syncToFirestore = async (userAddress: string) => {
    try {
      await setDoc(doc(db, 'users', userAddress.toLowerCase()), {
        archetypeNftMinted: true,
        archetypeNftMintedAt: new Date().toISOString(),
        archetypeType: archetypeId,
        network: 'base',
        contractAddress: CRYPDO_ARCHETYPE_ADDRESS,
      }, { merge: true });
    } catch (err) {
      console.error('Failed to sync archetype NFT to Firestore', err);
    }
  };

  const { writeContract, data: txHash, isPending: isConfirming, error: writeError } = useWriteContract();
  const { isLoading: isMining, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    if (writeError) {
      const msg = writeError.message?.toLowerCase() || '';
      if (msg.includes('user rejected') || msg.includes('user denied')) {
        setError('Transaksi dibatalkan.');
      } else if (msg.includes('insufficient funds')) {
        setError('ETH tidak cukup untuk gas fee di Base.');
      } else if (msg.includes('already owns')) {
        setError('Wallet ini sudah punya Archetype NFT.');
      } else {
        setError('Minting gagal. Coba lagi.');
      }
    }
  }, [writeError]);

  useEffect(() => {
    if (isSuccess && effectiveAddress) {
      localStorage.setItem(getMintCacheKey(effectiveAddress), 'true');
      setLocalMinted(true);
      syncToFirestore(effectiveAddress);
      refetchMintStatus();
    }
  }, [isSuccess, effectiveAddress]);

  const isMinted = localMinted || !!hasMintedData;

  const mint = async () => {
    setError(null);
    if (!address) {
      setError('Konek dompet asli dulu.');
      return;
    }

    // Switch to Base if needed
    if (!isBase) {
      try {
        switchChain({ chainId: base.id });
        return;
      } catch {
        setError('Gagal switch ke Base network.');
        return;
      }
    }

    // Mint on Base mainnet
    try {
      writeContract({
        address: CRYPDO_ARCHETYPE_ADDRESS as `0x${string}`,
        abi: crypdoArchetypeABI,
        functionName: 'mintArchetype',
        args: [
          archetypeStats?.uri || '',
          archetypeId,
          archetypeStats?.fomo ?? 50,
          archetypeStats?.greed ?? 50,
          archetypeStats?.scamResistance ?? 50,
        ],
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
    isMock,
  };
}