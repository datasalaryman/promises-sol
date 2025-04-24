"use client";

import type React from "react";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { useWallet } from "@solana/wallet-adapter-react";
import { DateTime } from "luxon";
// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import { api } from "@/trpc/react";
import { trpc } from "@/trpc/vanilla";
import Link from "next/link";
import { VersionedTransaction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { TRPCClientError } from "@trpc/client";

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

export const PromiseForm = () => {
  const renderDate = DateTime.now()
    .setZone("utc")
    .set({ hour: DateTime.now().setZone("utc").hour + 1, minute: 0 });
  const [promiseContent, setPromiseContent] = useState("");
  const [promiseLamports, setPromiseLamports] = useState(10000000);
  const { publicKey, signTransaction } = useWallet();
  const [epochTime, setEpochTime] = useState<number>(
    Math.floor(renderDate.toMillis() / (1000 * 60)) * 60,
  );
  const { toast } = useToast();

  const [txSigned, setTxSigned] = useState<number[] | undefined>(undefined);

  const { data: makeTx, refetch: makeRefetch } =
    api.solana.makeSelfPromiseGenerate.useQuery(
      {
        text: promiseContent,
        deadline: epochTime,
        // @ts-expect-error - will only fire query if publicKey is defined
        signer: publicKey?.toString(),
        size: promiseLamports,
      },
      {
        enabled: !!publicKey && !!promiseContent,
        // TODO: refetch every 30 seconds
      },
    );

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

  const setEpochDate = (day: Date | undefined) => {
    const hmsEpochSeconds =
      epochTime - epochToDateOnly(epochTime).toMillis() / 1000;
    const newDateEpochSeconds = Math.floor(
      DateTime.fromJSDate(day ?? renderDate.toJSDate())
        .setZone("utc", { keepLocalTime: true })
        .toMillis() / 1000,
    );

    setEpochTime(newDateEpochSeconds + hmsEpochSeconds);
  };

  const setEpochHour = (hour: string) => {
    const oldEpochHourSeconds = epochToHourOnly(epochTime) * 60 * 60;
    const newEpochHourSeconds = parseInt(hour) * 60 * 60;

    setEpochTime(epochTime - oldEpochHourSeconds + newEpochHourSeconds);
  };

  const setEpochMinute = (minute: string) => {
    const oldEpochMinuteSeconds = epochToMinuteOnly(epochTime) * 60;
    const newEpochMinuteSeconds = parseInt(minute) * 60;

    setEpochTime(epochTime - oldEpochMinuteSeconds + newEpochMinuteSeconds);
  };

  const handlePromiseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length <= 255) {
      setPromiseContent(e.target.value);
    }
  };

  const createPromise = api.promise.createSelf.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const txDeserialized = VersionedTransaction.deserialize(
        new Uint8Array(makeTx.serialTx),
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
        blockhash: makeTx.blockhash,
        blockheight: makeTx.blockheight,
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

      createPromise.mutate({
        content: promiseContent,
        epoch: BigInt(epochTime),
        lamports: BigInt(promiseLamports),
        wallet: publicKey?.toString() ?? "",
        // TODO: add promise PDA here
      });

      setPromiseContent("");
      setPromiseLamports(10000000);
      setEpochTime(Math.floor(renderDate.toMillis() / (1000 * 60)) * 60);

      await makeRefetch();
    } catch (err: unknown) {
      if (err instanceof TRPCClientError) {
        toast({
          variant: "destructive",
          title: "TRPC Client Error",
          description: `${JSON.stringify(err.shape)}`,
          className: "bg-red-500",
        });
        await makeRefetch();
      } else if (err instanceof Error) {
        toast({
          variant: "destructive",
          title: "Unsuccessful transaction",
          description: `Transaction failed ${err.message}`,
          className: "bg-red-500",
        });
        await makeRefetch();
      }
    }
  };

  return (
    <div className="min-h-fit max-w-md py-5">
      <Card>
        <CardHeader>
          <CardTitle>
            Make a{" "}
            <Link href="/how-it-works" className="underline">
              Promise
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {publicKey ? (
            <WalletDisconnectButtonDynamic />
          ) : (
            <WalletMultiButtonDynamic />
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <Textarea
                id="promise"
                placeholder="Enter your promise here..."
                value={promiseContent}
                onChange={handlePromiseChange}
                required
              />
              <p className="text-right text-xs text-muted-foreground">
                {promiseContent.length}/255 characters
              </p>
            </div>

            <div className="">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !epochToDateOnly(epochTime).toJSDate() &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {epochTime
                          ? epochToDateOnly(epochTime).toISODate()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        className="bg-white"
                        mode="single"
                        selected={epochToDateOnly(epochTime).toJSDate()}
                        onSelect={setEpochDate}
                        disabled={{
                          before: DateTime.now().setZone("utc").toJSDate(),
                        }}
                        initialFocus={true}
                        defaultMonth={epochToDateOnly(epochTime).toJSDate()}
                        modifiersClassNames={{
                          selected:
                            "bg-black text-white hover:bg-slate-700 hover:text-white",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Select
                      defaultValue={epochToHourOnly(epochTime).toString()}
                      onValueChange={setEpochHour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 bg-white md:max-h-72">
                        <SelectGroup>
                          {Array.from(Array(24).keys()).map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                              {h.toString().padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>

                    <Select defaultValue={"0"} onValueChange={setEpochMinute}>
                      <SelectTrigger>
                        <SelectValue placeholder="Min" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 bg-white md:max-h-72">
                        <SelectGroup>
                          {Array.from({ length: 12 }, (_, i) => i * 5).map(
                            (m) => (
                              <SelectItem key={m} value={m.toString()}>
                                {m.toString().padStart(2, "0")}
                              </SelectItem>
                            ),
                          )}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <br />
              <p className="text-sm text-muted-foreground" suppressHydrationWarning>
                Your promise will expire at{" "}
                {DateTime.fromMillis(epochTime * 1000)
                  .setZone("utc")
                  .toLocaleString(DateTime.DATETIME_FULL)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Promise Size</Label>
              <RadioGroup
                value={`${promiseLamports}`}
                onValueChange={(value) => setPromiseLamports(parseInt(value))}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={"10000000"} id="small" />
                  <Label htmlFor="small">Small (0.01 SOL)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={"50000000"} id="medium" />
                  <Label htmlFor="medium">Medium (0.05 SOL)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={"100000000"} id="large" />
                  <Label htmlFor="large">Large (0.1 SOL)</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full rounded-md bg-slate-900 text-white hover:bg-slate-800"
              disabled={!publicKey}
            >
              {publicKey ? "Make Promise" : "Connect Wallet to Continue"}
            </Button>
          </form>
          <div className="pt-2 text-center">
            <Link href="/dash" className="text-xs text-gray-400 underline">
              View Promises
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
