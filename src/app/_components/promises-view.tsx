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
import { FulfillDrawer } from "@/app/_components/fulfill-drawer";

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

  const {
    data: result,
    isLoading,
    isError,
  } = api.promise.getAll.useQuery({ wallet: publicKey?.toString() ?? "" });

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
                <FulfillDrawer
                  key={promise.id}
                  id={promise.id}
                  promiseContent={promise.promiseContent ?? ""}
                  promiseEpoch={promise.promiseEpoch?.toString() ?? ""}
                  promiseLamports={promise.promiseLamports ?? 0n}
                />
              );
            })
          : null}
      </div>
    </div>
  );
};
