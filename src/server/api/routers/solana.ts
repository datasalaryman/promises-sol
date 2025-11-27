import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { createHash } from "crypto";
import { env } from "@/env";
import Redis from "ioredis";
import {
  address,
  type Address,
  createSolanaRpc,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  pipe,
  blockhash as blockhashHelper,
  type TransactionSigner,
  compileTransaction,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
// TODO: Generate Codama client by running: npx codama generate
// The generated files should be in clients/js/src/generated
import {
  getMakeSelfPromiseInstructionAsync,
  getFulfillSelfPromiseInstructionAsync,
  getMakePartnerPromiseInstructionAsync,
  getFulfillPartnerPromiseInstructionAsync,
  getBreakPartnerPromiseInstructionAsync,
  getBreakSelfPromiseInstructionAsync,
} from "../../../../clients/js/src/generated";

const redis = new Redis(env.REDIS_URL);

const rpc = createSolanaRpc(env.RPC_URL);

// Create a dummy signer for building unsigned transactions
function createDummySigner(signerAddress: Address): TransactionSigner<typeof signerAddress> {
  return {
    address: signerAddress,
    signTransactions: async () => {
      throw new Error("This is a dummy signer - cannot sign");
    },
  };
}

// Helper function to get cached blockhash or fetch new one
async function getBlockhashInfo() {
  const CACHE_KEY_PREFIX = "solana:blockinfo:";
  const blockhashCacheKey = `${CACHE_KEY_PREFIX}blockhash`;
  const blockHeightCacheKey = `${CACHE_KEY_PREFIX}blockheight`;

  // Try to get cached values
  const [cachedBlockhash, cachedBlockHeight] = await Promise.all([
    redis.get(blockhashCacheKey),
    redis.get(blockHeightCacheKey),
  ]);

  let blockhashStr: string;
  let lastValidBlockHeight: number;

  // If we have all cached values, use them
  if (cachedBlockhash && cachedBlockHeight) {
    blockhashStr = cachedBlockhash;
    lastValidBlockHeight = parseInt(cachedBlockHeight);
    console.log("Using cached block info");
  } else {
    // Fetch fresh values from Solana
    const blockInfo = await rpc.getLatestBlockhash().send();
    blockhashStr = blockInfo.value.blockhash;
    lastValidBlockHeight = Number(blockInfo.value.lastValidBlockHeight);

    // Cache the values with expiration
    const expirationTime = 45; // 45 seconds

    await Promise.all([
      redis.set(blockhashCacheKey, blockhashStr, "EX", expirationTime),
      redis.set(
        blockHeightCacheKey,
        lastValidBlockHeight.toString(),
        "EX",
        expirationTime,
      ),
    ]);

    console.log("Fetched and cached new block info");
  }

  console.log(
    `blockhash: ${blockhashStr}, blockheight: ${lastValidBlockHeight}`,
  );

  return { blockhash: blockhashHelper(blockhashStr), blockhashStr, lastValidBlockHeight };
}

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
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const signerAddress = address(input.signer);
      const dummySigner = createDummySigner(signerAddress);

      const makeIx = await getMakeSelfPromiseInstructionAsync({
        signer: dummySigner,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(signerAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(makeIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
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
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const signerAddress = address(input.signer);
      const dummySigner = createDummySigner(signerAddress);

      const fulfillIx = await getFulfillSelfPromiseInstructionAsync({
        signer: dummySigner,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(signerAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(fulfillIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
        blockheight: lastValidBlockHeight,
      };
    }),
  breakSelfPromiseGenerate: publicProcedure
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
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const signerAddress = address(input.signer);
      const dummySigner = createDummySigner(signerAddress);

      const breakIx = await getBreakSelfPromiseInstructionAsync({
        signer: dummySigner,
        creator: signerAddress,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(signerAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(breakIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
        blockheight: lastValidBlockHeight,
      };
    }),
  makePartnerPromiseGenerate: publicProcedure
    .input(
      z.object({
        creator: z.string(),
        partner: z.string(),
        text: z.string().max(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(
      z.object({
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      if (input.creator === input.partner) {
        throw new Error("Creator and partner cannot be the same");
      }

      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const creatorAddress = address(input.creator);
      const partnerAddress = address(input.partner);

      const dummySigner = createDummySigner(creatorAddress);

      const createIx = await getMakePartnerPromiseInstructionAsync({
        signer: dummySigner,
        partner: partnerAddress,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(creatorAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(createIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
        blockheight: lastValidBlockHeight,
      };
    }),
  fulfillPartnerPromiseGenerate: publicProcedure
    .input(
      z.object({
        creator: z.string(),
        partner: z.string(),
        text: z.string().max(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(
      z.object({
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const creatorAddress = address(input.creator);
      const partnerAddress = address(input.partner);

      const dummySigner = createDummySigner(partnerAddress);

      const fulfillIx = await getFulfillPartnerPromiseInstructionAsync({
        signer: dummySigner,
        creator: creatorAddress,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(partnerAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(fulfillIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
        blockheight: lastValidBlockHeight,
      };
    }),
  breakPartnerPromiseGenerate: publicProcedure
    .input(
      z.object({
        creator: z.string(),
        partner: z.string(),
        text: z.string().max(255),
        deadline: z.number(),
        size: z.number(),
      }),
    )
    .output(
      z.object({
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .query(async ({ input }) => {
      const textArray = new Uint8Array(
        createHash("sha256").update(input.text).digest(),
      ).subarray(0, 8);

      const creatorAddress = address(input.creator);
      const partnerAddress = address(input.partner);

      const breakIx = await getBreakPartnerPromiseInstructionAsync({
        creator: creatorAddress,
        partner: partnerAddress,
        text: textArray,
        deadlineSecs: BigInt(input.deadline),
        size: BigInt(input.size),
      });

      const { blockhash, blockhashStr, lastValidBlockHeight } = await getBlockhashInfo();

      const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayer(creatorAddress, tx),
        (tx) =>
          setTransactionMessageLifetimeUsingBlockhash(
            { blockhash, lastValidBlockHeight: BigInt(lastValidBlockHeight) },
            tx,
          ),
        (tx) => appendTransactionMessageInstruction(breakIx, tx),
      );

      const compiledTransaction = compileTransaction(transactionMessage);
      const encodedMessage = getBase64EncodedWireTransaction(compiledTransaction);

      return {
        serialTx: encodedMessage,
        blockhash: blockhashStr,
        blockheight: lastValidBlockHeight,
      };
    }),
});
