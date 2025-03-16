import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Promisesprimitive } from "../target/types/promisesprimitive";
import { assert } from "console";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("promisesprimitive", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const newAccountKp = new Keypair();

  const program = anchor.workspace.Promisesprimitive as Program<Promisesprimitive>;


  // it("able to make promise", async () => {
  //   const text = [126, 234, 132, 45] as Array<number>
  //   const deadlineSecs = new BN(1742351473)
  //   const size = new BN(50000000)

  //   await program
  //     .methods
  //     .makeSelfPromise(Buffer.from(text), deadlineSecs, size)
  //     .accounts({
  //       signer: newAccountKp.publicKey,
  //     })
  //     .signers([newAccountKp])?.rpc() ?? undefined;
  // });

});
