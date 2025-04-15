import { PromiseForm } from "@/app/_components/promise-form";
import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";

export default async function Home() {
  return (
    <main className="flex h-fit items-center justify-center">
      <div className="flex flex-col items-center gap-6 pt-8">
        <h1 className="text-center text-xl font-bold text-gray-800 sm:text-2xl">
          Make and keep your own promises, with SOL!
        </h1>
        <WalletContext>
          <TRPCReactProvider>
            <PromiseForm />
          </TRPCReactProvider>
        </WalletContext>
      </div>
    </main>
  );
}
