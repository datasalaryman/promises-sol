import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { promisesSelf, promisesPartner } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export const promiseRouter = createTRPCRouter({
  createSelf: publicProcedure
    .input(
      z.object({
        content: z.string(),
        epoch: z.bigint(),
        lamports: z.bigint(),
        wallet: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(promisesSelf).values({
        promiseContent: input.content,
        promiseEpoch: input.epoch,
        promiseLamports: input.lamports,
        promiseWallet: input.wallet,
      });
    }),
  releaseSelf: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(promisesSelf).where(eq(promisesSelf.id, input.id));
    }),
  getAllSelf: publicProcedure
    .input(
      z.object({
        wallet: z.string(),
      }),
    )
    .output(
      z
        .object({
          id: z.number(),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
          promiseContent: z.string().nullable(),
          promiseEpoch: z.bigint().nullable(),
          promiseLamports: z.bigint().nullable(),
          promiseWallet: z.string().nullable(),
        })
        .array(),
    )
    .query(async ({ ctx, input }) => {
      const promises = await ctx.db.query.promisesSelf.findMany({
        where: eq(promisesSelf.promiseWallet, input.wallet),
        orderBy: desc(promisesSelf.promiseEpoch),
      });
      return promises;
    }),
  getOneSelf: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .output(
      z
        .object({
          id: z.number(),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
          promiseContent: z.string().nullable(),
          promiseEpoch: z.bigint().nullable(),
          promiseLamports: z.bigint().nullable(),
          promiseWallet: z.string().nullable(),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      const promise = await ctx.db.query.promisesSelf.findFirst({
        where: eq(promisesSelf.id, input.id),
      });
      return promise;
    }),
  createPartner: publicProcedure
    .input(
      z.object({
        content: z.string(),
        epoch: z.bigint(),
        lamports: z.bigint(),
        creatorWallet: z.string(),
        partnerWallet: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(promisesPartner).values({
        promiseContent: input.content,
        promiseEpoch: BigInt(input.epoch),
        promiseLamports: BigInt(input.lamports),
        creatorWallet: input.creatorWallet,
        partnerWallet: input.partnerWallet,
      });
    }),
  getAllPartner: publicProcedure
    .input(
      z.object({
        partner: z.string(),
      }),
    )
    .output(
      z
        .object({
          id: z.number(),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
          promiseContent: z.string().nullable(),
          promiseEpoch: z.bigint().nullable(),
          promiseLamports: z.bigint().nullable(),
          creatorWallet: z.string(),
          partnerWallet: z.string(),
        })
        .array(),
    )
    .query(async ({ ctx, input }) => {
      const promises = await ctx.db.query.promisesPartner.findMany({
        where: eq(promisesPartner.partnerWallet, input.partner),
        orderBy: desc(promisesPartner.promiseEpoch),
      });
      return promises;
    }),
  getOnePartner: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .output(
      z
        .object({
          id: z.number(),
          createdAt: z.date(),
          updatedAt: z.date().nullable(),
          promiseContent: z.string().nullable(),
          promiseEpoch: z.bigint().nullable(),
          promiseLamports: z.bigint().nullable(),
          creatorWallet: z.string(),
          partnerWallet: z.string(),
        })
        .nullish(),
    )
    .query(async ({ ctx, input }) => {
      const promise = await ctx.db.query.promisesPartner.findFirst({
        where: eq(promisesPartner.id, input.id),
      });
      return promise;
    }),
  releasePartner: publicProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(promisesPartner).where(
        eq(promisesPartner.id, input.id),
      );
    }),
});
