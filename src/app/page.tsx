"use client";

import { PromiseForm } from "@/app/_components/promise-form";
import { useWalletUi } from "@wallet-ui/react";
import { RequestForm } from "@/app/_components/request-form";

export default function Home() {
  const { account, cluster } = useWalletUi();
  return (
    <main className="flex h-fit items-center justify-center">
      {account ? 
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 px-4">
          <PromiseForm account={account} cluster={cluster} />
          <RequestForm account={account} disabled={true}/>
        </div> : 
        <p>Please connect your wallet</p>
      }
    </main>
  );
}
