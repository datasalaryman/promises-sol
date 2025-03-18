import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Promisesprimitive } from "../target/types/promisesprimitive";
import { assert } from "console";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

describe("promisesprimitive", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const newAccountKp = new Keypair();

  const program = anchor.workspace.Promisesprimitive as Program<Promisesprimitive>;


  it("able to make promise", async () => {
    const provider = anchor.getProvider()
    const programAirdrop = await provider.connection.requestAirdrop(
      new PublicKey(program.idl.address),
      LAMPORTS_PER_SOL * 0.1
    );

    const programBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: programBlockHash.blockhash,
      lastValidBlockHeight: programBlockHash.lastValidBlockHeight,
      signature: programAirdrop,
    });

    const signerAirdop = await provider.connection.requestAirdrop(
      newAccountKp.publicKey,
      LAMPORTS_PER_SOL * 0.1
    );

    const signerBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: signerBlockHash.blockhash,
      lastValidBlockHeight: signerBlockHash.lastValidBlockHeight,
      signature: signerAirdop,
    });

    const text = [126, 234, 132, 45] as Array<number>
    const deadlineSecs = new BN(1742351473)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(Buffer.from(text), deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.rpc() ?? undefined;
    
    console.log(makeTx)

  });

});
