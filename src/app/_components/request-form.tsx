"use client";

import type React from "react";
import { useState } from "react";
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
import { type UiWalletAccount } from "@wallet-ui/react";
import { DateTime } from "luxon";
import { api } from "@/trpc/react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { TRPCClientError } from "@trpc/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";


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

export const RequestForm = ({ account, disabled }: { account: UiWalletAccount, disabled: boolean }) => {

  const [renderDate ] = useState<DateTime>(DateTime.now().setZone("utc").set({ hour: DateTime.now().setZone("utc").hour + 1, minute: 0 }))

  const { toast } = useToast();

  const createRequest = api.promise.createRequest.useMutation();

  const form = useAppForm({
    defaultValues: {
      promiseCreator: "",
      promiseContent: "",
      epochTime: Math.floor(renderDate.toMillis() / 1000),
      promiseLamports: 10000000,
    },
    onSubmit: async ({ value }) => {
      try {
        if (!account?.address) {
          throw new Error("Wallet not connected");
        }

        if (!value.promiseCreator) {
          throw new Error("Please enter the promise creator's wallet address");
        }

        if (!value.promiseContent) {
          throw new Error("Please enter a promise");
        }

        if (value.promiseCreator === account.address) {
          throw new Error("You cannot request a promise from yourself");
        }

        createRequest.mutate({
          content: value.promiseContent,
          epoch: BigInt(value.epochTime),
          lamports: BigInt(value.promiseLamports),
          creatorWallet: value.promiseCreator,
          partnerWallet: account.address,
        });

        toast({
          title: "Promise Request Created",
          description: "Your promise request has been sent successfully",
          className: "bg-card",
        }); 
      } catch (err: unknown) {
        if (err instanceof TRPCClientError) {
          toast({
            variant: "destructive",
            title: "TRPC Client Error",
            description: `${JSON.stringify(err.shape)}`,
          });
        } else if (err instanceof Error) {
          toast({
            variant: "destructive",
            title: "Request Failed",
            description: err.message,
          });
        }
      }
      form.reset();
    }
  })

  const formValues = useStore(form.store, (state) => state.values)

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
            Request a Promise (coming soon)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          <form
            className="space-y-6"
          >

            <div className="space-y-2">
              <form.Subscribe>
                <Label htmlFor="partner-creator">Requesting promise from</Label>
                  <form.AppField
                    name="promiseCreator"
                  >{(field) => <field.Input
                      id="promise-creator"
                      placeholder="Enter promise creator's wallet address"
                      disabled={disabled}
                      value={field.state.value}
                      onChange={(e) => {
                        e.preventDefault()
                        field.handleChange(e.target.value)
                      }}
                      />}
                  </form.AppField>
            </form.Subscribe>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promise">Promise</Label>
              <form.AppField
                name="promiseContent"
              >{(field) => (<>
                <field.Textarea
                  id="promise"
                  placeholder="Enter your promise here..."
                  disabled={disabled}
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

            <div className="">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        disabled={disabled}
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
                        disabled={(date) => date < new Date()}
                        selected={epochToDateOnly(formValues.epochTime).toJSDate()}
                        onSelect={setEpochDate}
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
                      disabled={disabled}
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

                    <Select 
                      value={epochToMinuteOnly(formValues.epochTime).toString()}
                      onValueChange={setEpochMinute}
                    >
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
                Their promise will expire at{" "}
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
                    disabled={disabled}
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
              disabled={disabled || (!account && !formValues.promiseCreator) || !formValues.promiseContent}
              onClick={async () => {
                await form.handleSubmit();
              }}
            >
              {account ? "Request Promise" : "Connect Wallet to Continue"}
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
