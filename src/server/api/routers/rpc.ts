import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Connection, PublicKey, VersionedTransaction } from "@solana/web3.js";
import { env } from "@/env";
import { sign } from "crypto";

const connection = new Connection(env.RPC_URL, "confirmed");

export const rpcRouter = createTRPCRouter({
  sendAndConfirm: publicProcedure
    .input(z.object({
      serialTx: z.number().array(), 
      blockhash: z.string(),  
      blockheight: z.number()
    }))
    .output(z.object({
      txSig: z.string(), 
      confirmation: z.string()
    }))
    .query( async ({ctx, input}) => {

      const signature = await connection.sendTransaction(
        VersionedTransaction.deserialize(new Uint8Array(input.serialTx)),
        { skipPreflight: true, maxRetries: 0 },
      );

      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: input.blockhash,
        lastValidBlockHeight: input.blockheight,
      });

      return {
        txSig: signature, 
        confirmation: JSON.stringify(confirmation)
      }

    })
})