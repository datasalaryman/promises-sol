import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Connection, VersionedTransaction } from "@solana/web3.js";
import { env } from "@/env";
import { getBase64Encoder } from "@solana/kit";

const connection = new Connection(env.RPC_URL, "confirmed");

export const rpcRouter = createTRPCRouter({
  sendAndConfirm: publicProcedure
    .input(
      z.object({
        serialTx: z.string(),
        blockhash: z.string(),
        blockheight: z.number(),
      }),
    )
    .output(
      z.object({
        txSig: z.string(),
        confirmationErr: z.string().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {

      const encoded = getBase64Encoder().encode(input.serialTx);

      const signature = await connection.sendTransaction(
        VersionedTransaction.deserialize(new Uint8Array(encoded)),
        { maxRetries: 0 },
      );

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: input.blockhash,
        lastValidBlockHeight: input.blockheight,
      });

      return {
        txSig: signature,
        confirmationErr: confirmation.value.err
          ? JSON.stringify(confirmation.value.err)
          : undefined,
      };
    }),
});
