"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import Link from "next/link";
import { FulfillDrawer } from "@/app/_components/fulfill-drawer";
import { SolanaCluster, UiWalletAccount, useWalletUi } from "@wallet-ui/react";
import { DateTime } from "luxon";

export const PromisesView = ({ account, cluster } : { account: UiWalletAccount, cluster: SolanaCluster }) => {

  // Promises made by the user (self promises)
  const {
    data: resultSelf,
    isLoading: isLoadingSelf,
    isError: isErrorSelf,
  } = api.promise.getAllSelf.useQuery({ wallet: account.address ?? "" });

  // Partner promises created by the user (user is creator)
  const {
    data: resultPartnerCreated,
    isLoading: isLoadingPartnerCreated,
    isError: isErrorPartnerCreated,
  } = api.promise.getPartnerPromisesByCreator.useQuery({ creator: account.address ?? "" });

  // Promises the user has to fulfill (user is partner)
  const {
    data: resultPartner,
    isLoading: isLoadingPartner,
    isError: isErrorPartner,
  } = api.promise.getPartnerPromisesByPartner.useQuery({ partner: account.address ?? "" });

  const epochToDateOnly = (epochSeconds: number): DateTime => {
    const currentDateMills =
      Math.floor(epochSeconds / (60 * 60 * 24)) * 24 * 60 * 60 * 1000;
    return DateTime.fromMillis(currentDateMills).setZone("utc");
  };

  const getLamportsLabel = (lamports: number): string => {
    switch (lamports) {
      case 10000000:
        return "Small (0.01 SOL)";
      case 50000000:
        return "Medium (0.05 SOL)";
      case 100000000:
        return "Large (0.1 SOL)";
      default:
        return `${lamports / 1000000000} SOL`;
    }
  };


  if (isLoadingSelf || isLoadingPartner || isLoadingPartnerCreated) {
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

  if (isErrorSelf || isErrorPartner || isErrorPartnerCreated) {
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
      <h2 className="text-2xl font-bold mb-4">Your promises</h2>
      <div className="flex flex-col gap-8">
        {/* Section 1: Promises the user made (self promises) */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Promises You've Made</h3>
          <div className="flex basis-1/2 flex-col flex-nowrap sm:flex-row sm:flex-wrap">
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
            {(resultPartnerCreated?.length ?? 0 > 0)
              ? resultPartnerCreated?.map((promise) => {
                  const epochTime = promise.promiseEpoch
                    ? Number(promise.promiseEpoch)
                    : 0;
                  const promiseLamports = promise.promiseLamports
                    ? Number(promise.promiseLamports)
                    : 0;

                  return (
                    <div key={promise.id} className="pb-2 pr-2">
                      <Link href={`/dash`}>
                        <Card className="h-40 w-80 cursor-pointer transition-shadow hover:shadow-lg">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                              Promise with
                            </CardTitle>
                            <p className="truncate text-xs font-mono">
                              {promise.partnerWallet}
                            </p>
                          </CardHeader>
                          <CardContent className="space-y-1">
                            <p className="line-clamp-2 text-sm">
                              {promise.promiseContent}
                            </p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                Due: {epochToDateOnly(epochTime).toISODate()}
                              </span>
                              <span>{getLamportsLabel(promiseLamports)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </div>
                  );
                })
              : null}
          </div>
        </div>

        {/* Section 2: Promises the user has to fulfill (user is partner) */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Promises to Release</h3>
          <div className="flex basis-1/2 flex-col flex-nowrap sm:flex-row sm:flex-wrap">
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
      </div>
    </div>
  );
};
