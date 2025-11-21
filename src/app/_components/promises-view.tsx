"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import Link from "next/link";
import { FulfillDrawer } from "@/app/_components/fulfill-drawer";
import { SolanaCluster, UiWalletAccount, useWalletUi } from "@wallet-ui/react";

export const PromisesView = ({ account, cluster } : { account: UiWalletAccount, cluster: SolanaCluster }) => {

  const {
    data: resultSelf,
    isLoading: isLoadingSelf,
    isError: isErrorSelf,
  } = api.promise.getAllSelf.useQuery({ wallet: account.address ?? "" });

  const {
    data: resultPartner,
    isLoading: isLoadingPartner,
    isError: isErrorPartner,
  } = api.promise.getAllPartner.useQuery({ partner: account.address ?? "" });


  if (isLoadingSelf || isLoadingPartner) {
    return (
      <div className="max-w-full">
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

  if (isErrorSelf || isErrorPartner) {
    return (
      <div className="max-w-full">
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
        {(resultSelf?.length ?? 0 > 0)
          ? resultSelf?.map((promise) => {
              return (
                <FulfillDrawer
                  key={promise.id}
                  id={promise.id}
                  promiseContent={promise.promiseContent ?? ""}
                  promiseEpoch={promise.promiseEpoch?.toString() ?? ""}
                  promiseLamports={promise.promiseLamports ?? 0n}
                  variant="self"
                  creatorWallet={null}
                  account={account}
                  cluster={cluster}
                />
              );
            })
          : null}
        {(resultPartner?.length ?? 0 > 0)
          ? resultPartner?.map((promise) => {
              return (
                <FulfillDrawer
                  key={promise.id}
                  id={promise.id}
                  promiseContent={promise.promiseContent ?? ""}
                  promiseEpoch={promise.promiseEpoch?.toString() ?? ""}
                  promiseLamports={promise.promiseLamports ?? 0n}
                  variant="partner"
                  creatorWallet={promise.creatorWallet ?? null}
                  account={account}
                  cluster={cluster}
                />
              );
            })
          : null}
      </div>
    </div>
  );
};
