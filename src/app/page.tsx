import { PromiseForm } from "@/app/_components/promise-form";
import { WalletContext } from "@/app/_contexts/Wallet";
import { TRPCReactProvider } from "@/trpc/react";

export default async function Home() {
  return (
    <main className="flex h-screen items-center justify-center">
      <WalletContext>
        <TRPCReactProvider>
          <PromiseForm />
        </TRPCReactProvider>
      </WalletContext>
    </main>
  );
}
