import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";
import { PromisesView } from "@/app/_components/promises-view";

export default async function Home() {
  return (
    <main className="flex h-screen w-full flex-col px-4 sm:px-28">
      <WalletContext>
        <TRPCReactProvider>
          <h1 className="py-9 text-xl font-bold"> Your Promises</h1>
          <PromisesView />
        </TRPCReactProvider>
      </WalletContext>
    </main>
  );
}
