"use client";

import type React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { SolanaCluster, UiWalletAccount } from "@wallet-ui/react";
import { DateTime } from "luxon";

interface RequestsViewProps {
  account: UiWalletAccount;
  cluster: SolanaCluster;
}

export const RequestsView = ({ account, cluster }: RequestsViewProps) => {
  // Fetch requests where the user is the partner (requests sent TO the user)
  const {
    data: requestsReceived,
    isLoading: isLoadingReceived,
    isError: isErrorReceived,
  } = api.promise.getAllRequests.useQuery({ partner: account.address ?? "" });

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

  if (isLoadingReceived) {
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

  if (isErrorReceived) {
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
      <h2 className="text-2xl font-bold mb-4">Your requests</h2>
      <div className="flex basis-1/2 flex-col flex-nowrap py-9 sm:flex-row sm:flex-wrap">
        {/* Create new request card */}
        <div className="pb-2 pr-2">
          <Link href="/">
            <Card className="h-40 w-80 outline-dashed">
              <CardContent className="h-full w-full content-center items-center space-y-8 text-center">
                Create a request
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Requests received (where user is partner) */}
        {(requestsReceived?.length ?? 0) > 0
          ? requestsReceived?.map((request) => {
              const epochTime = request.promiseEpoch
                ? Number(request.promiseEpoch)
                : 0;
              const promiseLamports = request.promiseLamports
                ? Number(request.promiseLamports)
                : 0;

              return (
                <div key={request.id} className="pb-2 pr-2">
                  <Link href={`/request/${request.id}`}>
                    <Card className="h-40 w-80 cursor-pointer transition-shadow hover:shadow-lg">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Request from
                        </CardTitle>
                        <p className="truncate text-xs font-mono">
                          {request.creatorWallet}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        <p className="line-clamp-2 text-sm">
                          {request.promiseContent}
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
  );
};
