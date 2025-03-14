"use client";

import type React from "react"
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { useWallet } from "@solana/wallet-adapter-react"
// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import { api } from "@/trpc/react";
import Link from "next/link";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletDisconnectButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
  { ssr: false }
)

export const PromisesView = () =>  {

  const { publicKey } = useWallet();

  console.log(publicKey)

  const {data: result, isLoading, isError } = api.promise.getAll.useQuery({ wallet: publicKey?.toString() ?? '' })

  const releasePromise = api.promise.release.useMutation()

  const handlePromiseRelease = async (id: number) => {
    releasePromise.mutate({id: id}); 
  }

  if (isLoading) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          {
            publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
          }
        </WalletModalProvider>
        <div className="flex flex-col sm:flex-row flex-nowrap sm:flex-wrap basis-1/2 py-9">
          <div key="loading" className="pr-2 pb-2">
            <Card className="w-80 h-40">
              <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                  Loading ...
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          {
            publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
          }
        </WalletModalProvider>
        <div className="flex flex-col items-center flex-nowrap sm:flex-wrap basis-1/2 py-9">
          <div key="error" className="pr-2 pb-2">
            <Card className="w-80 h-40">
              <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                  Failure to connect to db
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <WalletModalProvider>
        {
          publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
        }
      </WalletModalProvider>
      <div className="flex flex-col sm:flex-row flex-nowrap sm:flex-wrap basis-1/2 py-9">
        <div className="pr-2 pb-2">
            <Link href="/">
              <Card className="w-80 h-40 outline-dashed">
                <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                    Create a promise
                </CardContent>
              </Card>
            </Link>
        </div>
        {
          result?.length ?? 0 > 0 ? result?.map((promise) => {
            return (
              <Drawer.Root key={promise.id} direction="right">
                <Drawer.Trigger asChild>
                  <div className="pr-2 pb-2">
                    <Card className="w-80 h-40 hover:border-black">
                      <CardHeader>
                        <CardTitle className="truncate" >
                          {promise.promiseContent}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8">
                        <strong>Expires</strong>: {promise.promiseEpoch} <br/>
                        <strong>Size</strong>: {parseInt(promise.promiseLamports?.toString() ?? '0') / (10 ** 9)} SOL
                      </CardContent>
                    </Card>
                  </div>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                  <Drawer.Content
                    className="right-0 top-0 bottom-0 fixed z-10 outline-none w-2/3 sm:w-1/2 flex"
                    // The gap between the edge of the screen and the drawer is 8px in this case.
                    style={{ '--initial-transform': 'calc(100% + 8px)' } as React.CSSProperties}
                  >
                    <div className="bg-zinc-50 h-full w-full grow p-5 flex flex-col rounded-none place-content-between">
                      <div className="max-w-md place-content-between">
                        <div>
                          <Drawer.Title className="font-medium mb-2 text-wrap break-words">{promise.promiseContent}</Drawer.Title>
                          <div><strong>Expires: </strong> {promise.promiseEpoch}</div>
                          <div><strong>Size: </strong> {parseInt(promise.promiseLamports?.toString() ?? '0') / (10 ** 9)} SOL</div>
                        </div>
                        <Drawer.Description />
                      </div>
                      <Drawer.Close asChild>
                        <Button onClick={async() => await handlePromiseRelease(promise.id)}>Release Promise</Button>
                      </Drawer.Close>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>

          )}) : null
        }
      </div>

    </div>
  )

}

