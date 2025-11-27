"use client";

import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";
import { RequestCard } from "@/app/_components/request-card";
import { useWalletUi } from "@wallet-ui/react";
import { useParams } from "next/navigation";

export default function RequestPage() {
  const { account, cluster } = useWalletUi();
  const params = useParams();
  const requestId = parseInt(params.id as string, 10);

  return (
    <main className="flex min-h-screen w-full flex-col items-center px-4 sm:px-28">
      <WalletContext>
        <TRPCReactProvider>
          {account ? (
            <RequestCard 
              account={account} 
              cluster={cluster} 
              requestId={requestId}
            />
          ) : (
            <div className="min-h-fit max-w-md py-5">
              <p className="text-center text-muted-foreground">
                Please connect your wallet to view this request
              </p>
            </div>
          )}
        </TRPCReactProvider>
      </WalletContext>
    </main>
  );
}
