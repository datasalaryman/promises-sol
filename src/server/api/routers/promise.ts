import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { promisesSelf } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const promiseRouter = createTRPCRouter({
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
  getAll: publicProcedure
    .input(z.object({
      wallet: z.string()
    }))
    .output(
      z.object({
        id: z.number(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
        promiseContent: z.string().nullable(), 
        promiseEpoch: z.bigint().nullable(), 
        promiseLamports: z.bigint().nullable(), 
        promiseWallet: z.string().nullable()
      }).array()
    )
    .query( async ({ ctx, input }) => {
      const promises = await ctx.db.query.promisesSelf.findMany({
        where: eq(promisesSelf.promiseWallet, input.wallet), 
        orderBy: desc(promisesSelf.promiseEpoch)
      })
      return promises
    }),
  getOne: publicProcedure
    .input(z.object({
      id: z.number()
    }))
    .output(
      z.object({
        id: z.number(),
        createdAt: z.date(),
        updatedAt: z.date().nullable(),
        promiseContent: z.string().nullable(), 
        promiseEpoch: z.bigint().nullable(), 
        promiseLamports: z.bigint().nullable(), 
        promiseWallet: z.string().nullable()
      }).nullish()
    )
    .query( async ({ ctx, input }) => {
      const promise = await ctx.db.query.promisesSelf.findFirst({
        where: eq(promisesSelf.id, input.id)
      })
      return promise
    })
});
