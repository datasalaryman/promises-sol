import { PromiseForm } from "@/app/_components/promise-form"
import { WalletContext } from "@/app/_contexts/Wallet"

export default async function Home() {
  return (
    <main className="flex h-screen justify-center items-center">
      <WalletContext>
        <PromiseForm />
      </WalletContext>
    </main>
  )
}
