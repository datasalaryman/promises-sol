"use client";

import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";
import { PromisesView } from "@/app/_components/promises-view";
import { useWalletUi } from "@wallet-ui/react";
import { RequestsView } from "../_components/requests-view";

export default function Home() {
  const { account, cluster } = useWalletUi();
  return (
    <main className="flex h-screen w-full flex-col px-4 sm:px-28">
      <WalletContext>
        <TRPCReactProvider>
          {account ? <PromisesView account={account} cluster={cluster} /> : <p>Please connect your wallet</p>}
          <hr className="my-8 border-t border-border" />
          {account ? <RequestsView account={account} cluster={cluster} /> : <p>Please connect your wallet</p>}
        </TRPCReactProvider>
      </WalletContext>
    </main>
  );
}
