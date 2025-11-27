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
import { SolanaCluster, UiWalletAccount, useWalletAccountTransactionSigner } from "@wallet-ui/react";
import { DateTime } from "luxon";
import { api } from "@/trpc/react";
import { trpc } from "@/trpc/vanilla";
import Link from "next/link";
import { env } from "@/env";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { TRPCClientError } from "@trpc/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import { 
  type Address, 
  decompileTransactionMessage, 
  getBase64EncodedWireTransaction, 
  getBase64Encoder, 
  getCompiledTransactionMessageDecoder, 
  getTransactionDecoder, 
  isOffCurveAddress, 
} from "@solana/kit";


const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm } = createFormHook({
  fieldComponents: {
    Input,
    Switch,
    Textarea,
    Calendar,
    Select,
    RadioGroup,
    RadioGroupItem,
    Button,
  },
  formComponents: {
    Button
  },
  fieldContext,
  formContext,
})

export const PromiseForm = ({ account, cluster }: { account: UiWalletAccount, cluster: SolanaCluster }) => {

  const [renderDate, setRenderDate] = useState<DateTime>(DateTime.now().setZone("utc").set({ hour: DateTime.now().setZone("utc").hour + 1, minute: 0 }))

  // const { signTransaction } = useWallet();
  const messageSigner = useWalletAccountTransactionSigner(account, cluster.id);
  const { toast } = useToast();

  const createSelfPromise = api.promise.createSelf.useMutation();
  const createPartnerPromise = api.promise.createPartner.useMutation();

  const form = useAppForm({
    defaultValues: {
      promiseContent: "",
      isPartner: false,
      partnerWallet: "",
      epochTime: Math.floor(renderDate.toMillis() / 1000),
      promiseLamports: 10000000,
    },
    onSubmit: async ({ value }) => {
      try {
        // @ts-expect-error - will only be defined if query is enabled
        const transactionBytes = getBase64Encoder().encode(value.isPartner ? makePartnerTx.serialTx : makeTx.serialTx);

        const decoded = getTransactionDecoder().decode(transactionBytes);
        const compiledTransaction = getCompiledTransactionMessageDecoder().decode(decoded.messageBytes);
        const transaction = decompileTransactionMessage(compiledTransaction);
        
        // const signedTransaction = await signTransaction!(transaction);


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
          // @ts-expect-error - will only be defined if query is enabled
          blockhash: value.isPartner ? makePartnerTx?.blockhash : makeTx?.blockhash,
          // @ts-expect-error - will only be defined if query is enabled
          blockheight: value.isPartner ? makePartnerTx?.blockheight : makeTx?.blockheight,
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

        if (value.isPartner) {
          createPartnerPromise.mutate({
            content: value.promiseContent,
            epoch: BigInt(value.epochTime),
            lamports: BigInt(value.promiseLamports),
            creatorWallet: account?.address ?? "",
            partnerWallet: value.partnerWallet,
          });
        } else {
          createSelfPromise.mutate({
            content: value.promiseContent,
            epoch: BigInt(value.epochTime),
            lamports: BigInt(value.promiseLamports),
            wallet: account?.address ?? "",
          });
        }

        await (value.isPartner ? makePartnerRefetch() : makeRefetch());
      } catch (err: unknown) {
        if (err instanceof TRPCClientError) {
          toast({
            variant: "destructive",
            title: "TRPC Client Error",
            description: `${JSON.stringify(err.shape)}`,
          });
          await (value.isPartner ? makePartnerRefetch() : makeRefetch());
        } else if (err instanceof Error) {
          toast({
            variant: "destructive",
            title: "Unsuccessful transaction",
            description: `Transaction failed ${err.message}`,
          });
          await (value.isPartner ? makePartnerRefetch() : makeRefetch());
        }
      }
    }

  })

  const formValues = useStore(form.store, (state) => state.values)

  const { data: makeTx, refetch: makeRefetch } =
    api.solana.makeSelfPromiseGenerate.useQuery(
      {
        text: formValues.promiseContent,
        deadline: formValues.epochTime,
        signer: account?.address,
        size: formValues.promiseLamports,
      },
      {
        enabled: !!account && !!formValues.promiseContent && !formValues.isPartner,
      },
    );

  const [isPartnerWalletValid, setIsPartnerWalletValid] = useState(false);

  const { data: makePartnerTx, refetch: makePartnerRefetch } =
    api.solana.makePartnerPromiseGenerate.useQuery(
      {
        creator: account?.address,
        partner: formValues.partnerWallet,
        text: formValues.promiseContent,
        deadline: formValues.epochTime,
        size: formValues.promiseLamports,
      },
      {
        enabled: !!account && 
                 !!formValues.promiseContent && 
                 formValues.isPartner && 
                 isPartnerWalletValid,
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
      formValues.epochTime - epochToDateOnly(formValues.epochTime).toMillis() / 1000;
    const newDateEpochSeconds = Math.floor(
      DateTime.fromJSDate(day ?? renderDate.toJSDate())
        .setZone("utc", { keepLocalTime: true })
        .toMillis() / 1000,
    );

    form.setFieldValue("epochTime", newDateEpochSeconds + hmsEpochSeconds);
  };

  const setEpochHour = (hour: string) => {
    const oldEpochHourSeconds = epochToHourOnly(formValues.epochTime) * 60 * 60;
    const newEpochHourSeconds = parseInt(hour) * 60 * 60;

    form.setFieldValue("epochTime", formValues.epochTime - oldEpochHourSeconds + newEpochHourSeconds);
  };

  const setEpochMinute = (minute: string) => {
    const oldEpochMinuteSeconds = epochToMinuteOnly(formValues.epochTime) * 60;
    const newEpochMinuteSeconds = parseInt(minute) * 60;

    form.setFieldValue("epochTime", formValues.epochTime - oldEpochMinuteSeconds + newEpochMinuteSeconds);
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
          <form
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <form.AppField
                name="promiseContent"
              >{(field) => (<>
                <field.Textarea
                  id="promise"
                  placeholder="Enter your promise here..."
                  required
                  value={field.state.value}
                  onChange={(e) => {
                    e.preventDefault()
                    if (field.state.value.length <= 255) {
                      field.handleChange(e.target.value)
                    }
                  }}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {field.state.value.length}/255 characters
                </p></>)
              }</form.AppField>
            </div>

            <div className="flex items-center space-x-2">
              <form.AppField
                name="isPartner"
              >{(field) => (
                  <>
                    <field.Switch
                      id="partner-mode"
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        field.setValue(checked)
                        if (!checked) {
                          form.setFieldValue("partnerWallet", "")
                        }
                      }}
                      className="border-border data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary [&>span]:bg-primary-foreground"
                    />
                    <Label htmlFor="partner-mode">With accountability partner</Label>
                  </>
                )}</form.AppField>
            </div>

            <div className="space-y-2">
              <form.Subscribe
                selector={(state) => state.values.isPartner}
              >{(isPartner) => isPartner ? (
                  <>
                  <Label htmlFor="partner-wallet">Partner Wallet Address</Label>
                  <form.AppField
                    name="partnerWallet"
                    validators={{
                      onChangeAsync: async ({ value }) => {
                        if (value.length === 0) {
                          setIsPartnerWalletValid(false);
                          return undefined;
                        }
                        if (value.length < 43) {
                          setIsPartnerWalletValid(false);
                          return "Wallet address input is too short";
                        }
                        if (isOffCurveAddress(value as Address)) {
                          setIsPartnerWalletValid(false);
                          return "Address is not a valid user wallet address";
                        }
                        if (value === account?.address) {
                          setIsPartnerWalletValid(false);
                          return "Can't use your own wallet address as a partner";
                        }
                        setIsPartnerWalletValid(true);
                        return undefined;
                      },
                    }}
                  >{(field) => (
                    <>
                      <field.Input
                        id="partner-wallet"
                        placeholder="Enter partner wallet address"
                        value={field.state.value}
                        onChange={(e) => {
                          e.preventDefault()
                          field.handleChange(e.target.value)
                        }}
                        required
                      />
                      {(formValues.partnerWallet.length > 0 && !field.state.meta.isValid) ? (
                        <em role="alert" className="text-xs text-destructive">{field.state.meta.errors.join(', ')}</em>
                      ) : null}
                      <div className="text-xs text-muted-foreground">Careful! Only this address can release your promise</div>
                    </>
                  )}
                </form.AppField>
                </>
                ) : null
              }
            </form.Subscribe>
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
                          !epochToDateOnly(formValues.epochTime).toJSDate() &&
                            "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formValues.epochTime
                          ? epochToDateOnly(formValues.epochTime).toISODate()
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        className="bg-popover"
                        mode="single"
                        selected={epochToDateOnly(formValues.epochTime).toJSDate()}
                        onSelect={setEpochDate}
                        disabled={{
                          before: DateTime.now().setZone("utc").toJSDate(),
                        }}
                        initialFocus={true}
                        defaultMonth={epochToDateOnly(formValues.epochTime).toJSDate()}
                        modifiersClassNames={{
                          selected:
                            "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={epochToHourOnly(formValues.epochTime).toString()}
                      onValueChange={setEpochHour}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Hour" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64 bg-popover md:max-h-72">
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
                      <SelectContent className="max-h-64 bg-popover md:max-h-72">
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
                {DateTime.fromMillis(formValues.epochTime * 1000)
                  .setZone("utc")
                  .toLocaleString(DateTime.DATETIME_FULL)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Promise Size</Label>
              <form.AppField
                name="promiseLamports"
              >
                {(field) => (
                  <field.RadioGroup
                    value={field.state.value.toString()}
                    onValueChange={(value) => field.handleChange(parseInt(value))}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <field.RadioGroupItem value={"10000000"} id="small" />
                      <Label htmlFor="small">Small (0.01 SOL)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <field.RadioGroupItem value={"50000000"} id="medium" />
                      <Label htmlFor="medium">Medium (0.05 SOL)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <field.RadioGroupItem value={"100000000"} id="large" />
                      <Label htmlFor="large">Large (0.1 SOL)</Label>
                    </div>
                  </field.RadioGroup>
                )}
              </form.AppField>
            </div>



            <form.Button
              type="submit"
              className="w-full rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!account || (formValues.isPartner && !formValues.partnerWallet && !formValues.promiseContent) || !formValues.promiseContent}
              onClick={async () => {
                await form.handleSubmit();
                form.reset();
              }}
            >
              {account ? "Make Promise" : "Connect Wallet to Continue"}
            </form.Button>
          </form>
          <div className="pt-2 text-center">
            <Link href="/dash" className="text-xs text-muted-foreground underline">
              View Promises
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
