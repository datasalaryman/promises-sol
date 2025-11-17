"use client";

import type React from "react";
import { Drawer } from "vaul";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { PublicKey, VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "@/hooks/use-toast";
import { trpc } from "@/trpc/vanilla";
import { ToastAction } from "@/components/ui/toast";
import { useState } from "react";
import { DateTime } from "luxon";

type FulfillDrawerProps = {
  id: number;
  promiseContent: string;
  promiseEpoch: string;
  promiseLamports: bigint | null;
  variant: "self" | "partner";
  creatorWallet: string | null;
};

export const FulfillDrawer = ({
  id,
  promiseContent,
  promiseEpoch,
  promiseLamports,
  variant,
  creatorWallet,
}: FulfillDrawerProps) => {
  const { publicKey, signTransaction } = useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const releasePromise = variant === "self" ?
    api.promise.releaseSelf.useMutation() :
    api.promise.releasePartner.useMutation();

  const { data: fulfillTxSelf, refetch: fulfillRefetchSelf } =
    api.solana.fulfillSelfPromiseGenerate.useQuery(
      {
        text: promiseContent,
        // @ts-expect-error - will only fire query if publicKey is defined
        signer: publicKey?.toString(),
        deadline: parseInt(promiseEpoch),
        size: parseInt(promiseLamports?.toString() ?? "0"),
      },
      {
        enabled: !!publicKey && isOpen && variant === "self",
        // TODO: refetch every 30 seconds
      },
    );

  const { data: fulfillTxPartner, refetch: fulfillRefetchPartner } =
    api.solana.fulfillPartnerPromiseGenerate.useQuery(
      {
        text: promiseContent,
        // @ts-expect-error - will only fire query if publicKey is defined
        creator: creatorWallet?.toString(),
        deadline: parseInt(promiseEpoch),
        size: parseInt(promiseLamports?.toString() ?? "0"),
        partner: publicKey?.toString() ?? "",
      },
      {
        enabled: !!publicKey && isOpen && variant === "partner",
        // TODO: refetch every 30 seconds
      },
    );

  const handlePromiseRelease = async (id: number) => {
    const txDeserialized = variant === "self" ?
      VersionedTransaction.deserialize(
        new Uint8Array(fulfillTxSelf?.serialTx ?? []),
      ) :
      VersionedTransaction.deserialize(
        new Uint8Array(fulfillTxPartner?.serialTx ?? []),
      );

    const signedTransaction = await signTransaction!(txDeserialized);

    toast({
      title: "Transaction signed",
      description: `Transaction signed by ${publicKey?.toString()}`,
      className: "bg-white",
    });

    const serialTx = Array.from(signedTransaction.serialize());

    const { txSig, confirmationErr } = await trpc.rpc.sendAndConfirm.query({
      serialTx,
      blockhash: variant === "self" ? fulfillTxSelf?.blockhash : fulfillTxPartner?.blockhash,
      blockheight: variant === "self" ? fulfillTxSelf?.blockheight : fulfillTxPartner?.blockheight,
    });

    toast({
      title: "Transaction sent",
      description: "Transaction sent to the network",
      className: "bg-white",
    });

    if (confirmationErr) {
      throw new Error(`Transaction confirmation error: ${confirmationErr}`);
    }

    toast({
      title: "Confirmed Transaction",
      description: "You successfully made a promise",
      className: "bg-white",
      action: (
        <ToastAction altText="View here" asChild>
          <a href={"https://solscan.io/tx/" + txSig} target="_blank">
            View here
          </a>
        </ToastAction>
      ),
    });
    releasePromise.mutate({ id: id });
  };

  return (
    <Drawer.Root
      key={id}
      direction="right"
      open={isOpen}
      onOpenChange={(open) => setIsOpen(open)}
    >
      <Drawer.Trigger asChild>
        <div className="pb-2 pr-2">
          <Card className="h-40 w-80 hover:border-black">
            <CardHeader>
              <CardTitle className="truncate">{promiseContent}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <strong>Expires</strong>:{" "}
              {DateTime.fromMillis(parseInt(promiseEpoch ?? "0") * 1000)
                .setZone("utc")
                .toLocaleString(DateTime.DATETIME_FULL)}
              <br />
              <strong>Size</strong>:{" "}
              {parseInt(promiseLamports?.toString() ?? "0") / 10 ** 9} SOL
            </CardContent>
          </Card>
        </div>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40" />
        <Drawer.Content
          className="fixed bottom-0 right-0 top-0 z-10 flex w-2/3 outline-hidden sm:w-1/2"
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
                <Drawer.Title className="mb-2 text-wrap wrap-break-word font-medium">
                  {promiseContent}
                </Drawer.Title>

                {variant === "partner" ?
                  (<><p>You are the partner for this promise</p><br/></>) : null
                }
                <div>
                  <strong>Expires: </strong>{" "}
                  {DateTime.fromMillis(parseInt(promiseEpoch ?? "0") * 1000)
                    .setZone("utc")
                    .toLocaleString(DateTime.DATETIME_FULL)}
                </div>
                <div>
                  <strong>Size: </strong>{" "}
                  {parseInt(promiseLamports?.toString() ?? "0") / 10 ** 9} SOL
                </div>
                {variant === "partner" && (
                  <div>
                    <strong>Creator: </strong>{creatorWallet ?? "None"}
                  </div>
                )}
              </div>
              <Drawer.Description />
            </div>
            <Drawer.Close asChild>
              <Button
                type="submit"
                className="w-full rounded-md bg-slate-900 text-white hover:bg-slate-800"
                onClick={async () => await handlePromiseRelease(id)}
              >
                Release Promise
              </Button>
            </Drawer.Close>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
