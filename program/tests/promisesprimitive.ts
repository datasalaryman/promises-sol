import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Promisesprimitive } from "../target/types/promisesprimitive";
import { assert } from "console";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import 'dotenv/config';
import { initializeKeypair } from "@solana-developers/helpers"

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const newAccountKp = new Keypair();
  
  const program = anchor.workspace.Promisesprimitive as Program<Promisesprimitive>;

  const provider = anchor.getProvider()

  const authorKp = (async() => await initializeKeypair(provider.connection, {
    envVariableName: "AUTHOR_KEYPAIR",
  }));

describe("promisesprimitive", async () => {

  it("able to make promise", async () => {
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
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection, 
      makeTx, 
      [newAccountKp]
    )
    assert(makeTxConfirmation, "making promise failed")

  });


  it("able to fulfill promise", async () => {
    // const programAirdrop = await provider.connection.requestAirdrop(
    //   new PublicKey(program.idl.address),
    //   LAMPORTS_PER_SOL * 0.1
    // );

    // const programBlockHash = await provider.connection.getLatestBlockhash();

    // await provider.connection.confirmTransaction({
    //   blockhash: programBlockHash.blockhash,
    //   lastValidBlockHeight: programBlockHash.lastValidBlockHeight,
    //   signature: programAirdrop,
    // });

    const signerAirdop = await provider.connection.requestAirdrop(
      newAccountKp.publicKey,
      LAMPORTS_PER_SOL * 0.6
    );

    const signerBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: signerBlockHash.blockhash,
      lastValidBlockHeight: signerBlockHash.lastValidBlockHeight,
      signature: signerAirdop,
    });

    const text = [126, 234, 542, 45] as Array<number>
    const deadlineSecs = new BN(1742351473)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(Buffer.from(text), deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection, 
      makeTx, 
      [newAccountKp]
    )
    assert(makeTxConfirmation, "making promise failed")

    const fulfillTx = await program
      .methods
      .fulfillSelfPromise(Buffer.from(text), deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

      const fulfillTxConfirmation = await sendAndConfirmTransaction(
        provider.connection, 
        fulfillTx, 
        [newAccountKp]
      )
      assert(fulfillTxConfirmation, "fulfilling promise failed")

  });

  it("able to break promise", async () => {
    // const programAirdrop = await provider.connection.requestAirdrop(
    //   new PublicKey(program.idl.address),
    //   LAMPORTS_PER_SOL * 0.1
    // );

    // const programBlockHash = await provider.connection.getLatestBlockhash();

    // await provider.connection.confirmTransaction({
    //   blockhash: programBlockHash.blockhash,
    //   lastValidBlockHeight: programBlockHash.lastValidBlockHeight,
    //   signature: programAirdrop,
    // });

    const signerAirdop = await provider.connection.requestAirdrop(
      newAccountKp.publicKey,
      LAMPORTS_PER_SOL * 0.6
    );

    const signerBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: signerBlockHash.blockhash,
      lastValidBlockHeight: signerBlockHash.lastValidBlockHeight,
      signature: signerAirdop,
    });

    const text = [126, 234, 456, 45] as Array<number>
    const deadlineSecs = new BN(1742351473)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(Buffer.from(text), deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection, 
      makeTx, 
      [newAccountKp]
    )
    assert(makeTxConfirmation, "making promise failed")

    const breakTx = await program
      .methods
      .breakSelfPromise(Buffer.from(text), deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .signers([(await authorKp())])?.transaction() ?? undefined;

      const breakTxConfirmation = await sendAndConfirmTransaction(
        provider.connection, 
        breakTx, 
        [(await authorKp())]
      )
      assert(breakTxConfirmation, "fulfilling promise failed")

  });

});
