import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { AnchorProvider, getProvider, Program, setProvider, web3, workspace } from "@coral-xyz/anchor";
import { Promisesprimitive } from "@/types/promisesprimitive";
import { PublicKey } from "@solana/web3.js";
import { getSHA256Hash } from "boring-webcrypto-sha256"
import { BN } from "bn.js";

// setProvider(AnchorProvider.env());
// const provider = getProvider()

/* eslint-disable */
const program:Program<Promisesprimitive> = workspace.Promisesprimitive;
/* eslint-disable */

export const solanaRouter = createTRPCRouter({
  makePromiseGenerate: publicProcedure
    .input(z.object({
      signer: z.instanceof(PublicKey), 
      text: z.string().length(255), 
      deadline: z.number(), 
      size: z.number()
    }))
    .output(z.instanceof(web3.TransactionInstruction))
    .query( async ({ input }) => {

      const textArray = [ ...Buffer.from(await getSHA256Hash(input.text), 'utf8') ].slice(0, 8)

      const makeIx = await program
        .methods
        .makeSelfPromise(textArray, new BN(input.deadline), new BN(input.size))
        .accounts({
          signer: input.signer,
        })
        .instruction();
      
      return makeIx
    }), 
  fulfillPromiseGenerate: publicProcedure
    .input(z.object({
      signer: z.instanceof(PublicKey), 
      text: z.string().length(255), 
      deadline: z.number(), 
      size: z.number()
    }))
    .output(z.instanceof(web3.TransactionInstruction))
    .query( async ({ input }) => {

      const textArray = [ ...Buffer.from(await getSHA256Hash(input.text), 'utf8') ].slice(0, 8)

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
    .output(z.instanceof(web3.TransactionInstruction))
    .query( async ({ input }) => {

      const textArray = [ ...Buffer.from(await getSHA256Hash(input.text), 'utf8') ].slice(0, 8)

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
