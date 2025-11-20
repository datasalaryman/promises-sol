import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { 
  getBase64Encoder,
  createSolanaRpc,
  getTransactionDecoder,
  getSignatureFromTransaction,
  Base64EncodedWireTransaction,
} from "@solana/kit";

const rpc = createSolanaRpc(env.RPC_URL);

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

      let confirmationErr: string | null = null;

      const encoded = getBase64Encoder().encode(input.serialTx);
      const transaction = getTransactionDecoder().decode(encoded);
      const signature = getSignatureFromTransaction(transaction);

      try {
        await rpc.sendTransaction(input.serialTx as Base64EncodedWireTransaction, { encoding: 'base64' }).send();
      } catch (e) {
        console.error("Error sending transaction:", e);
        confirmationErr = (e as Error).message;
      }

      return {
        txSig: signature as string,
        confirmationErr: confirmationErr,
      };
    }),
});
