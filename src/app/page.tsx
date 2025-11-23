"use client";

import { PromiseForm } from "@/app/_components/promise-form";
import { useWalletUi } from "@wallet-ui/react";

export default function Home() {
  const { account, cluster } = useWalletUi();
  return (
    <main className="flex h-fit items-center justify-center">
      <div className="flex flex-col items-center gap-6 pt-8">
        <h1 className="text-center text-xl font-bold text-foreground sm:text-2xl">
          Make and keep your own promises, with SOL!
        </h1>
        {account ? <PromiseForm account={account} cluster={cluster} /> : <p>Please connect your wallet</p>}
      </div>
    </main>
  );
}
