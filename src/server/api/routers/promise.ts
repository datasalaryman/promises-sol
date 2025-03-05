import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { promisesSelf } from "@/server/db/schema";

export const postRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      content: z.string(),
      epoch: z.bigint(), 
      lamports: z.bigint(), 
      wallet: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(promisesSelf).values({
        promiseContent: input.content, 
        promiseEpoch: input.epoch, 
        promiseLamports: input.lamports, 
        promiseWallet: input.wallet
      });
    }),

});
