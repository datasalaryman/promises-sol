"use client";

import type React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SolanaCluster, UiWalletAccount, useWalletAccountTransactionSigner } from "@wallet-ui/react";
import { DateTime } from "luxon";
import { api } from "@/trpc/react";
import { trpc } from "@/trpc/vanilla";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { TRPCClientError } from "@trpc/client";
import { useRouter } from "next/navigation";

import { 
  decompileTransactionMessage, 
  getBase64EncodedWireTransaction, 
  getBase64Encoder, 
  getCompiledTransactionMessageDecoder, 
  getTransactionDecoder, 
} from "@solana/kit";

interface RequestCardProps {
  account: UiWalletAccount;
  cluster: SolanaCluster;
  requestId: number;
}

export const RequestCard = ({ 
  account, 
  cluster, 
  requestId,
}: RequestCardProps) => {

  const messageSigner = useWalletAccountTransactionSigner(account, cluster.id);
  const { toast } = useToast();
  const router = useRouter();
  
  // Fetch request data by ID
  const { data: requestData, isLoading, error } = api.promise.getOneRequest.useQuery({
    id: requestId,
  });

  const createPartnerPromise = api.promise.createPartner.useMutation();
  const deleteRequest = api.promise.releaseRequest.useMutation();

  // Extract data from request
  const promiseCreator = requestData?.creatorWallet ?? "";
  const partnerWallet = requestData?.partnerWallet ?? "";
  const promiseContent = requestData?.promiseContent ?? "";
  const epochTime = requestData?.promiseEpoch ? Number(requestData.promiseEpoch) : 0;
  const promiseLamports = requestData?.promiseLamports ? Number(requestData.promiseLamports) : 0;
  
  // Check if the signed-in wallet matches the promiseCreator
  const isAuthorized = account?.address === promiseCreator;
  const isViewer = account?.address === partnerWallet;

  const { data: makePartnerTx, refetch: makePartnerRefetch } =
    api.solana.makePartnerPromiseGenerate.useQuery(
      {
        creator: account?.address,
        partner: partnerWallet,
        text: promiseContent,
        deadline: epochTime,
        size: promiseLamports,
      },
      {
        enabled: !!account && !!isAuthorized,
      },
    );

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!makePartnerTx) {
        throw new Error("Transaction not ready");
      }

      const transactionBytes = getBase64Encoder().encode(makePartnerTx.serialTx);
      const decoded = getTransactionDecoder().decode(transactionBytes);
      const compiledTransaction = getCompiledTransactionMessageDecoder().decode(decoded.messageBytes);
      const transaction = decompileTransactionMessage(compiledTransaction);

      const transactions = await messageSigner.modifyAndSignTransactions([decoded]);
      const signatureBytes = transactions[0]!.signatures[messageSigner.address];

      toast({
        title: "Transaction signed",
        description: `Transaction signed by ${account?.address}`,
        className: "bg-card",
      });

      const serialTx = getBase64EncodedWireTransaction(transactions[0]!) as string;

      const { txSig, confirmationErr } = await trpc.rpc.sendAndConfirm.query({
        serialTx,
        blockhash: makePartnerTx?.blockhash,
        blockheight: makePartnerTx?.blockheight,
      });

      toast({
        title: "Transaction sent",
        description: "Transaction sent to the network",
        className: "bg-card",
      });

      if (confirmationErr) {
        throw new Error(`Transaction confirmation error: ${confirmationErr}`);
      }

      toast({
        title: "Confirmed Transaction",
        description: "You successfully made a promise",
        className: "bg-card",
        action: (
          <ToastAction altText="View here" asChild>
            <a href={"https://solscan.io/tx/" + txSig} target="_blank">
              View here
            </a>
          </ToastAction>
        ),
      });

      createPartnerPromise.mutate({
        content: promiseContent,
        epoch: BigInt(epochTime),
        lamports: BigInt(promiseLamports),
        creatorWallet: account?.address ?? "",
        partnerWallet: partnerWallet,
      });

      // Delete the request after successful promise creation
      deleteRequest.mutate({
        id: requestId,
      });

      await makePartnerRefetch();
    } catch (err: unknown) {
      if (err instanceof TRPCClientError) {
        toast({
          variant: "destructive",
          title: "TRPC Client Error",
          description: `${JSON.stringify(err.shape)}`,
        });
        await makePartnerRefetch();
      } else if (err instanceof Error) {
        toast({
          variant: "destructive",
          title: "Unsuccessful transaction",
          description: `Transaction failed ${err.message}`,
        });
        await makePartnerRefetch();
      }
    }
    // Redirect to dashboard
    router.push("/dash");
  };

  const epochToDateOnly = (epochSeconds: number): DateTime => {
    const currentDateMills =
      Math.floor(epochSeconds / (60 * 60 * 24)) * 24 * 60 * 60 * 1000;

    return DateTime.fromMillis(currentDateMills).setZone("utc");
  };

  const epochToHourOnly = (epochSeconds: number): number => {
    const hmsEpochSeconds =
      epochSeconds - epochToDateOnly(epochSeconds).toMillis() / 1000;

    return Math.floor(hmsEpochSeconds / (60 * 60));
  };

  const epochToMinuteOnly = (epochSeconds: number): number => {
    const msEpochSeconds =
      epochSeconds -
      epochToDateOnly(epochSeconds).toMillis() / 1000 -
      epochToHourOnly(epochSeconds) * 60 * 60;

    return Math.floor(msEpochSeconds / 60);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-fit max-w-md py-5">
        <Card>
          <CardHeader>
            <CardTitle>Promise Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            <p className="text-muted-foreground">Loading request...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !requestData) {
    return (
      <div className="min-h-fit max-w-md py-5">
        <Card>
          <CardHeader>
            <CardTitle>Promise Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            <p className="text-muted-foreground">
              Request not found or an error occurred.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthorized && !isViewer) {
    return (
      <div className="min-h-fit max-w-md py-5">
        <Card>
          <CardHeader>
            <CardTitle>Promise Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            <p className="text-muted-foreground">
              This promise request is not for your wallet address.
            </p>
            <p className="text-xs text-muted-foreground">
              Your wallet: {account?.address}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-fit max-w-md py-5">
      <Card>
        <CardHeader>
          <CardTitle>
            Promise Request
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="requester">Requested by</Label>
              <div className="rounded-md border border-border bg-muted p-3 text-sm font-mono break-all">
                {partnerWallet}
              </div>
              <p className="text-xs text-muted-foreground">
                This person will be responsible for releasing back your SOL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <Textarea
                id="promise"
                placeholder="Enter your promise here..."
                value={promiseContent}
                readOnly
                className="bg-muted"
              />
            </div>

            <div className="">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <div className="rounded-md border border-border bg-muted p-3 text-sm">
                    {epochToDateOnly(epochTime).toISODate()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="rounded-md border border-border bg-muted p-3 text-sm">
                    {epochToHourOnly(epochTime).toString().padStart(2, "0")}:
                    {epochToMinuteOnly(epochTime).toString().padStart(2, "0")} UTC
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Promise Size</Label>
              <div className="rounded-md border border-border bg-muted p-4">
                <p className="text-sm font-medium">
                  {getLamportsLabel(promiseLamports)}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!account || !isAuthorized}
            >
              {account ? "Make Promise" : "Connect Wallet to Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
