import * as anchor from "@coral-xyz/anchor";
import { BN, Program } from "@coral-xyz/anchor";
import { Promisesprimitive } from "../target/types/promisesprimitive";
// import { assert } from "console";
import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, sendAndConfirmTransaction, SystemProgram } from "@solana/web3.js";
import 'dotenv/config';
import { initializeKeypair } from "@solana-developers/helpers"
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env());
const newAccountKp = new Keypair();
const otherAccountKp = new Keypair();

const program = anchor.workspace.Promisesprimitive as Program<Promisesprimitive>;

const provider = anchor.getProvider()

let authorKp: Keypair;

before(async () => {
  authorKp = await initializeKeypair(provider.connection, {
    envVariableName: "AUTHOR_KEYPAIR",
  });
});

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

    const text = [126, 210, 132, 45, 145, 123, 53, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      makeTx,
      [newAccountKp]
    )
    chai.assert(makeTxConfirmation, "making promise failed")

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

    const text = [126, 81, 132, 53, 23, 111, 23, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      makeTx,
      [newAccountKp]
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const fulfillTx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const fulfillTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      fulfillTx,
      [newAccountKp]
    )
    chai.assert(fulfillTxConfirmation, "fulfilling promise failed")

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

    const text = [126, 41, 132, 45, 90, 41, 0, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      makeTx,
      [newAccountKp]
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const breakTx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .signers([authorKp])?.transaction() ?? undefined;

    const breakTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      breakTx,
      [authorKp]
    )
    chai.assert(breakTxConfirmation, "fulfilling promise failed")

  });

  it("program error when non-creator or author try to fulfill promise", async () => {
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

    const otherAirdop = await provider.connection.requestAirdrop(
      otherAccountKp.publicKey,
      LAMPORTS_PER_SOL * 0.6
    );

    const otherBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: otherBlockHash.blockhash,
      lastValidBlockHeight: otherBlockHash.lastValidBlockHeight,
      signature: otherAirdop,
    });

    const text = [0, 157, 132, 45, 212, 30, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      makeTx,
      [newAccountKp]
    )
    chai.assert(makeTxConfirmation, "making promise failed")


    const nonCreatorFulfillTx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: otherAccountKp.publicKey,
      })
      .signers([otherAccountKp])?.transaction() ?? undefined;

    const nonCreatorFulfillTxConfirmation = async () => {
      return sendAndConfirmTransaction(
        provider.connection,
        nonCreatorFulfillTx,
        [otherAccountKp]
      )
    }

    // await nonCreatorFulfillTxConfirmation()
    chai.expect(nonCreatorFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)

    const authorFulfillTx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: authorKp.publicKey,
      })
      .signers([authorKp])?.transaction() ?? undefined;

    const authorFulfillTxConfirmation = async () => {
      return sendAndConfirmTransaction(
        provider.connection,
        authorFulfillTx,
        [authorKp]
      )
    }

    // await authorFulfillTxConfirmation()
    chai.expect(authorFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)


  })

  it ("program error when non-creator or creator try to break promise", async () => {
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

    const text = [42, 187, 99, 155, 201, 77, 13, 250] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeTx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const makeTxConfirmation = await sendAndConfirmTransaction(
      provider.connection,
      makeTx,
      [newAccountKp]
    );

    const makeBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: makeBlockHash.blockhash,
      lastValidBlockHeight: makeBlockHash.lastValidBlockHeight,
      signature: makeTxConfirmation,
    });

    const nonCreatorBreakTx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .signers([otherAccountKp])?.transaction() ?? undefined;

    const nonCreatorBreakTxConfirmation = async () => {
      return sendAndConfirmTransaction(
        provider.connection,
        nonCreatorBreakTx,
        [otherAccountKp]
      )
    }

    chai.expect(nonCreatorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)

    const creatorBreakTx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .signers([newAccountKp])?.transaction() ?? undefined;

    const creatorBreakTxConfirmation = async () => {
      return sendAndConfirmTransaction(
        provider.connection,
        creatorBreakTx,
        [newAccountKp]
      )
    }

    chai.expect(creatorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  })
  // it ("program error when creator tries to fulfill promise after unix secs", () => {})
  // it ("program error when author tries to break promise after unix secs", () => {})

});
