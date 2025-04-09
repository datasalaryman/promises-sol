import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/promisesprimitive.json";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { createHash } from "crypto";
import { BN } from "bn.js";
import { type Promisesprimitive } from "@/types/promisesprimitive";
import { env } from "@/env";

const connection = new Connection(env.RPC_URL, "confirmed");

const program = new anchor.Program<Promisesprimitive>(idl, {
  connection,
});

export const solanaRouter = createTRPCRouter({
  makePromiseGenerate: publicProcedure
    .input(
      z.object({
        signer: z.string(),
        text: z.string().max(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(
      z.object({
        serialTx: z.number().array(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = Array.from<number>(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      const makeIx = await program.methods
        .makeSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          signer: new PublicKey(input?.signer),
        })
        .instruction();

      const instructions = [makeIx];

      // TODO: add caching here
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      console.log(
        `blockhash: ${blockhash}, blockheight: ${lastValidBlockHeight}`,
      );

      const messageV0 = new anchor.web3.TransactionMessage({
        payerKey: new PublicKey(input.signer),
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      return {
        serialTx: Array.from(transaction.serialize()),
        blockhash: blockhash,
        blockheight: lastValidBlockHeight,
      };
    }),
  fulfillPromiseGenerate: publicProcedure
    .input(
      z.object({
        signer: z.string(),
        text: z.string().max(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(
      z.object({
        serialTx: z.number().array(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = Array.from(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      const fulfillIx = await program.methods
        .fulfillSelfPromise(
          textArray,
          new BN(input.deadline),
          new BN(input.size),
        )
        .accounts({
          signer: input.signer,
        })
        .instruction();

      const instructions = [fulfillIx];

      // TODO: add caching here
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");

      console.log(
        `blockhash: ${blockhash}, blockheight: ${lastValidBlockHeight}`,
      );

      const messageV0 = new anchor.web3.TransactionMessage({
        payerKey: new PublicKey(input.signer),
        recentBlockhash: blockhash,
        instructions,
      }).compileToV0Message();

      const transaction = new VersionedTransaction(messageV0);

      return {
        serialTx: Array.from(transaction.serialize()),
        blockhash: blockhash,
        blockheight: lastValidBlockHeight,
      };
    }),
  breakPromiseGenerate: publicProcedure
    .input(
      z.object({
        creator: z.string(),
        text: z.string().length(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(z.string().nullable())
    .query(async ({ input }) => {
      const textArray = Array.from(
        Uint8Array.from(
          createHash("sha256").update(input.text).digest(),
        ).subarray(0, 8),
      );

      const breakIx = await program.methods
        .breakSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          creator: input.creator,
        })
        .instruction();

      return JSON.stringify(breakIx);
    }),
});
