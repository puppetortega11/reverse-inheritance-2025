'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useEffect } from 'react';

interface WalletButtonProps {
  onWalletChange: (walletAddress: string | null) => void;
}

export function WalletButton({ onWalletChange }: WalletButtonProps) {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    if (connected && publicKey) {
      onWalletChange(publicKey.toString());
    } else {
      onWalletChange(null);
    }
  }, [connected, publicKey, onWalletChange]);

  return (
    <div className="text-center">
      <WalletMultiButton />
      {connected && publicKey && (
        <div className="mt-4 p-4 border rounded">
          <div className="text-sm">Connected Wallet:</div>
          <div className="font-mono text-sm">{publicKey.toString()}</div>
        </div>
      )}
    </div>
  );
}
