"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { api } from "@/trpc/react";
import Link from "next/link";
import { Drawer } from "vaul";
import { Button } from "@/components/ui/button";

const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const WalletDisconnectButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletDisconnectButton,
  { ssr: false },
);

export const PromisesView = () => {
  const { publicKey } = useWallet();

  console.log(publicKey);

  const {
    data: result,
    isLoading,
    isError,
  } = api.promise.getAll.useQuery({ wallet: publicKey?.toString() ?? "" });

  const releasePromise = api.promise.release.useMutation();

  const handlePromiseRelease = async (id: number) => {
    releasePromise.mutate({ id: id });
  };

  if (isLoading) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          {publicKey ? (
            <WalletDisconnectButtonDynamic />
          ) : (
            <WalletMultiButtonDynamic />
          )}
        </WalletModalProvider>
        <div className="flex basis-1/2 flex-col flex-nowrap py-9 sm:flex-row sm:flex-wrap">
          <div key="loading" className="pb-2 pr-2">
            <Card className="h-40 w-80">
              <CardContent className="h-full w-full content-center items-center space-y-8 text-center">
                Loading ...
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          {publicKey ? (
            <WalletDisconnectButtonDynamic />
          ) : (
            <WalletMultiButtonDynamic />
          )}
        </WalletModalProvider>
        <div className="flex basis-1/2 flex-col flex-nowrap items-center py-9 sm:flex-wrap">
          <div key="error" className="pb-2 pr-2">
            <Card className="h-40 w-80">
              <CardContent className="h-full w-full content-center items-center space-y-8 text-center">
                Failure to connect to db
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <WalletModalProvider>
        {publicKey ? (
          <WalletDisconnectButtonDynamic />
        ) : (
          <WalletMultiButtonDynamic />
        )}
      </WalletModalProvider>
      <div className="flex basis-1/2 flex-col flex-nowrap py-9 sm:flex-row sm:flex-wrap">
        <div className="pb-2 pr-2">
          <Link href="/">
            <Card className="h-40 w-80 outline-dashed">
              <CardContent className="h-full w-full content-center items-center space-y-8 text-center">
                Create a promise
              </CardContent>
            </Card>
          </Link>
        </div>
        {(result?.length ?? 0 > 0)
          ? result?.map((promise) => {
              return (
                <Drawer.Root key={promise.id} direction="right">
                  <Drawer.Trigger asChild>
                    <div className="pb-2 pr-2">
                      <Card className="h-40 w-80 hover:border-black">
                        <CardHeader>
                          <CardTitle className="truncate">
                            {promise.promiseContent}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8">
                          <strong>Expires</strong>: {promise.promiseEpoch}{" "}
                          <br />
                          <strong>Size</strong>:{" "}
                          {parseInt(
                            promise.promiseLamports?.toString() ?? "0",
                          ) /
                            10 ** 9}{" "}
                          SOL
                        </CardContent>
                      </Card>
                    </div>
                  </Drawer.Trigger>
                  <Drawer.Portal>
                    <Drawer.Overlay className="fixed inset-0 bg-black/40" />
                    <Drawer.Content
                      className="fixed bottom-0 right-0 top-0 z-10 flex w-2/3 outline-none sm:w-1/2"
                      // The gap between the edge of the screen and the drawer is 8px in this case.
                      style={
                        {
                          "--initial-transform": "calc(100% + 8px)",
                        } as React.CSSProperties
                      }
                    >
                      <div className="flex h-full w-full grow flex-col place-content-between rounded-none bg-zinc-50 p-5">
                        <div className="max-w-md place-content-between">
                          <div>
                            <Drawer.Title className="mb-2 text-wrap break-words font-medium">
                              {promise.promiseContent}
                            </Drawer.Title>
                            <div>
                              <strong>Expires: </strong> {promise.promiseEpoch}
                            </div>
                            <div>
                              <strong>Size: </strong>{" "}
                              {parseInt(
                                promise.promiseLamports?.toString() ?? "0",
                              ) /
                                10 ** 9}{" "}
                              SOL
                            </div>
                          </div>
                          <Drawer.Description />
                        </div>
                        <Drawer.Close asChild>
                          <Button
                            onClick={async () =>
                              await handlePromiseRelease(promise.id)
                            }
                          >
                            Release Promise
                          </Button>
                        </Drawer.Close>
                      </div>
                    </Drawer.Content>
                  </Drawer.Portal>
                </Drawer.Root>
              );
            })
          : null}
      </div>
    </div>
  );
};
