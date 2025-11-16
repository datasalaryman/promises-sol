"use client";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { env } from "@/env";
import { 
  createSolanaDevnet, 
  createSolanaLocalnet, 
  createSolanaMainnet,
  createWalletUiConfig, 
  WalletUi 
} from '@wallet-ui/react';

const config = createWalletUiConfig({
    clusters: [
        createSolanaMainnet(env.NEXT_PUBLIC_RPC_URL),
        createSolanaDevnet(),
        createSolanaLocalnet(),
    ],
});

export function WalletContext({ children }: { children: React.ReactNode }) {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => env.NEXT_PUBLIC_RPC_URL, [network]);
  const wallets = useMemo(() => [], [endpoint]);

  return (
    <WalletUi config={config}>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </WalletUi>
  );
}
