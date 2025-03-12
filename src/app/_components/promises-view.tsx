"use client";

import type React from "react"
import { useState } from "react"
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { DateTime } from "luxon"; 
// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';
import { api } from "@/trpc/react";
import Link from "next/link";


const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletDisconnectButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
  { ssr: false }
)

export const PromisesView = () =>  {

  const { publicKey } = useWallet();

  console.log(publicKey)

  const {data: result, isLoading, isError } = api.promise.getAll.useQuery({ wallet: publicKey?.toString() ?? '' })

  if (isLoading) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          { 
            publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
          }
        </WalletModalProvider>
        <div className="flex flex-wrap basis-1/2 py-9">
          <div key="loading" className="pr-2 pb-2">
            <Card className="w-80 h-40">
              <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                  Loading ...
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-full">
        <WalletModalProvider>
          { 
            publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
          }
        </WalletModalProvider>
        <div className="flex flex-wrap basis-1/2 py-9">
          <div key="error" className="pr-2 pb-2">
            <Card className="w-80 h-40">
              <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                  Failure to connect to db
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <WalletModalProvider>
        { 
          publicKey ? <WalletDisconnectButtonDynamic/> : <WalletMultiButtonDynamic />
        }
      </WalletModalProvider>
      <div className="flex flex-wrap basis-1/2 py-9">
      {
        result?.length ?? 0 > 0 ? result?.map((promise) => {
          return (
            <div key={promise.id} className="pr-2 pb-2">
              <Card className="w-80 h-40">
                <CardHeader>
                  <CardTitle>{promise.promiseContent}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <strong>Expires</strong>: {promise.promiseEpoch} <br/>
                  <strong>Size</strong>: {parseInt(promise.promiseLamports?.toString() ?? '0') / (10 ** 9)} SOL
                </CardContent>
              </Card>
            </div>
        )}) : (
          <div className="pr-2 pb-2">
            <Link href="/" target="_blank">
              <Card className="w-80 h-40 outline-dashed">
                <CardContent className="space-y-8 items-center content-center text-center w-full h-full">
                    Create a promise
                </CardContent>
              </Card>
            </Link>
        </div>
        )
      }
      </div>

    </div>
  )

}

