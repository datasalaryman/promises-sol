import { WalletContext } from "@/app/_contexts/Wallet"
import { TRPCReactProvider } from "@/trpc/react"
import { PromisesView } from "@/app/_components/promises-view"

export default async function Home() {
  return (
    <main className="flex flex-col h-screen mx-28">
      <WalletContext>
        <TRPCReactProvider>
          <h1 className="font-bold text-xl py-9"> Your Promises</h1>
          <PromisesView />
        </TRPCReactProvider>
      </WalletContext>
    </main>
  )
}
