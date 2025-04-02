import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/promisesprimitive.json"
import { Connection, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { BN } from "bn.js";
import { Promisesprimitive } from "@/types/promisesprimitive";
import { env } from "@/env";

// TODO: create connection method to call instead of dev env
const connection = new Connection(env.RPC_URL, "confirmed");

const program = new anchor.Program<Promisesprimitive>(idl, {
  connection
});


export const solanaRouter = createTRPCRouter({
  makePromiseGenerate: publicProcedure
    .input(z.object({
      signer: z.string(),
      text: z.string().max(255),
      deadline: z.number(),
      size: z.number()
    }))
    .output(z.string().nullable())
    .query( async ({ input }) => {

      if (!input.signer) {
        return null
      }

      const textArray = Array.from<number>(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      // console.log(textArray);

      const makeIx = await program
        .methods
        .makeSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          signer: new PublicKey(input?.signer),
        }).instruction();

      return JSON.stringify(makeIx)

    }),
  fulfillPromiseGenerate: publicProcedure
    .input(z.object({
      signer: z.instanceof(PublicKey),
      text: z.string().length(255),
      deadline: z.number(),
      size: z.number()
    }))
    .output(z.instanceof(anchor.web3.TransactionInstruction))
    .query( async ({ input }) => {

      const textArray = Array.from(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      const fulfillIx = await program
        .methods
        .fulfillSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          signer: input.signer,
        })
        .instruction();

      return fulfillIx
    }),
  breakPromiseGenerate: publicProcedure
    .input(z.object({
      creator: z.instanceof(PublicKey),
      text: z.string().length(255),
      deadline: z.number(),
      size: z.number()
    }))
    .output(z.instanceof(anchor.web3.TransactionInstruction))
    .query( async ({ input }) => {

      const textArray = Array.from(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      const breakIx = await program
        .methods
        .breakSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          creator: input.creator,
        })
        .instruction();

      return breakIx
    })
});
