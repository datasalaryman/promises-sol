"use client";

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
  return (
    <WalletUi config={config}>
      {children}
    </WalletUi>
  );
}
