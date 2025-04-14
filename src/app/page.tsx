import { PromiseForm } from "@/app/_components/promise-form";
import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";

export default async function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-6 pt-8">
        <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800">
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
