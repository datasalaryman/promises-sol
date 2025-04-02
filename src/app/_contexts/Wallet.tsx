"use client";

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import { env } from '@/env';

export function WalletContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const endpoint = env.NEXT_PUBLIC_RPC_URL
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [endpoint],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        {/* <WalletModalProvider> */}
          {children}
        {/* </WalletModalProvider> */}
      </WalletProvider>
    </ConnectionProvider>
  );
}