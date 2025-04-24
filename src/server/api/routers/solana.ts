import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import * as anchor from "@coral-xyz/anchor";
import idl from "@/idl/promisesprimitive.json";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { createHash } from "crypto";
import { BN } from "bn.js";
import { type Promisesprimitive } from "@/types/promisesprimitive";
import { env } from "@/env";
import Redis from "ioredis";

const connection = new Connection(env.RPC_URL, "confirmed");

const program = new anchor.Program<Promisesprimitive>(idl, {
  connection,
});

const redis = new Redis(env.REDIS_URL);

export const solanaRouter = createTRPCRouter({
  makeSelfPromiseGenerate: publicProcedure
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

      // Implement caching for blockhash, lastValidBlockHeight, and blocktime
      const CACHE_KEY_PREFIX = "solana:blockinfo:";
      const blockhashCacheKey = `${CACHE_KEY_PREFIX}blockhash`;
      const blockHeightCacheKey = `${CACHE_KEY_PREFIX}blockheight`;

      // Try to get cached values
      const [cachedBlockhash, cachedBlockHeight] = await Promise.all([
        redis.get(blockhashCacheKey),
        redis.get(blockHeightCacheKey),
      ]);

      let blockhash: string;
      let lastValidBlockHeight: number;

      // If we have all cached values, use them
      if (cachedBlockhash && cachedBlockHeight) {
        blockhash = cachedBlockhash;
        lastValidBlockHeight = parseInt(cachedBlockHeight);
        console.log("Using cached block info");
      } else {
        // Fetch fresh values from Solana
        const blockInfo = await connection.getLatestBlockhash("confirmed");
        blockhash = blockInfo.blockhash;
        lastValidBlockHeight = blockInfo.lastValidBlockHeight;

        // Cache the values with expiration based on blocktime
        // Set expiration to 2 minutes (120 seconds) from the blocktime
        const expirationTime = 45; // 2 minutes in seconds

        await Promise.all([
          redis.set(blockhashCacheKey, blockhash, "EX", expirationTime),
          redis.set(
            blockHeightCacheKey,
            lastValidBlockHeight,
            "EX",
            expirationTime,
          ),
        ]);

        console.log("Fetched and cached new block info");
      }

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
  fulfillSelfPromiseGenerate: publicProcedure
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

      // Implement caching for blockhash, lastValidBlockHeight, and blocktime
      const CACHE_KEY_PREFIX = "solana:blockinfo:";
      const blockhashCacheKey = `${CACHE_KEY_PREFIX}blockhash`;
      const blockHeightCacheKey = `${CACHE_KEY_PREFIX}blockheight`;

      // Try to get cached values
      const [cachedBlockhash, cachedBlockHeight] = await Promise.all([
        redis.get(blockhashCacheKey),
        redis.get(blockHeightCacheKey),
      ]);

      let blockhash: string;
      let lastValidBlockHeight: number;
      let blocktime: number | null;

      // If we have all cached values, use them
      if (cachedBlockhash && cachedBlockHeight) {
        blockhash = cachedBlockhash;
        lastValidBlockHeight = parseInt(cachedBlockHeight);
        console.log("Using cached block info");
      } else {
        // Fetch fresh values from Solana
        const blockInfo = await connection.getLatestBlockhash("confirmed");
        blockhash = blockInfo.blockhash;
        lastValidBlockHeight = blockInfo.lastValidBlockHeight;

        // Cache the values with expiration based on blocktime
        // Set expiration to 2 minutes (120 seconds) from the blocktime
        const expirationTime = 45; // 2 minutes in seconds

        await Promise.all([
          redis.set(blockhashCacheKey, blockhash, "EX", expirationTime),
          redis.set(
            blockHeightCacheKey,
            lastValidBlockHeight,
            "EX",
            expirationTime,
          ),
        ]);

        console.log("Fetched and cached new block info");
      }

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
  breakSelfPromiseGenerate: publicProcedure
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
