import * as anchor from "@coral-xyz/anchor";
import BN from "bn.js"
import { Program } from "@coral-xyz/anchor";
import { Promisesprimitive } from "../target/types/promisesprimitive";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import 'dotenv/config';
import { initializeKeypair, sendVersionedTransaction } from "@solana-developers/helpers"
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env());

const program = anchor.workspace.Promisesprimitive as Program<Promisesprimitive>;

const provider = anchor.getProvider()

let authorKp: Keypair;
const newAccountKp = new Keypair();
const otherAccountKp = new Keypair();

before(async () => {
  authorKp = await initializeKeypair(provider.connection, {
    envVariableName: "AUTHOR_KEYPAIR",
  });

  const signerAirdop = await provider.connection.requestAirdrop(
    newAccountKp.publicKey,
    LAMPORTS_PER_SOL * 1.0
  );

  const signerBlockHash = await provider.connection.getLatestBlockhash();

  await provider.connection.confirmTransaction({
    blockhash: signerBlockHash.blockhash,
    lastValidBlockHeight: signerBlockHash.lastValidBlockHeight,
    signature: signerAirdop,
  });

  const otherAccountAirdop = await provider.connection.requestAirdrop(
    otherAccountKp.publicKey,
    LAMPORTS_PER_SOL * 2.5
  );

  const otherAccountBlockHash = await provider.connection.getLatestBlockhash();

  await provider.connection.confirmTransaction({
    blockhash: otherAccountBlockHash.blockhash,
    lastValidBlockHeight: otherAccountBlockHash.lastValidBlockHeight,
    signature: otherAccountAirdop,
  });

});

describe("promisesprimitive", async () => {

  it("able to make promise", async () => {

    const text = [126, 210, 132, 45, 145, 123, 53, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )

    chai.assert(makeTxConfirmation, "making promise failed")

  });


  it("able to fulfill promise", async () => {

    const text = [126, 81, 132, 53, 23, 111, 23, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const fulfillIx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const fulfillTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [fulfillIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(fulfillTxConfirmation, "fulfilling promise failed")

  });

  it("able to break promise", async () => {

    const text = [126, 41, 132, 45, 90, 41, 0, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const breakIx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 4000));
    const breakTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [breakIx],
      [authorKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(breakTxConfirmation, "fulfilling promise failed")

  });

  it("program error when non-creator or author try to fulfill promise", async () => {

    const text = [0, 157, 132, 45, 212, 30, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making promise failed")


    const nonCreatorFulfillIx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: otherAccountKp.publicKey,
      })
      .instruction();

    const nonCreatorFulfillTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [nonCreatorFulfillIx],
        [otherAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    // await nonCreatorFulfillTxConfirmation()
    chai.expect(nonCreatorFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)

    const authorFulfillIx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: authorKp.publicKey,
      })
      .instruction();

    const authorFulfillTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [authorFulfillIx],
        [authorKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    // await authorFulfillTxConfirmation()
    chai.expect(authorFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)


  })

  it ("program error when non-creator or creator try to break promise", async () => {

    const text = [42, 187, 99, 155, 201, 77, 13, 250] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    );

    const makeBlockHash = await provider.connection.getLatestBlockhash();

    await provider.connection.confirmTransaction({
      blockhash: makeBlockHash.blockhash,
      lastValidBlockHeight: makeBlockHash.lastValidBlockHeight,
      signature: makeTxConfirmation,
    });

    const nonCreatorBreakIx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 4000));

    const nonCreatorBreakTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [nonCreatorBreakIx],
        [otherAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(nonCreatorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)

    const creatorBreakIx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .instruction();

    const creatorBreakTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [creatorBreakIx],
        [newAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(creatorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  })

  it ("program error when creator tries to fulfill promise after unix secs", async () => {

    const text = [0, 32, 132, 45, 212, 30, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const creatorFulfillIx = await program
      .methods
      .fulfillSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 5000));

    const creatorFulfillTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [creatorFulfillIx],
        [newAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    // await authorFulfillTxConfirmation()
    chai.expect(creatorFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  })

  it ("program error when author tries to break promise before unix secs", async() => {

    const text = [0, 32, 132, 45, 212, 71, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10) // Longer deadline
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making promise failed")

    const authorBreakIx = await program
      .methods
      .breakSelfPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey
      })
      .instruction();

    const authorBreakTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [authorBreakIx],
        [authorKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(authorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  })

  it("program error when promise size is less than 10,000,000 lamports", async () => {

    const text = [99, 45, 178, 23, 111, 64, 37, 200] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10) // Set a reasonable deadline
    const size = new BN(5000000) // Less than 10,000,000 lamports

    const makeIx = await program
      .methods
      .makeSelfPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [makeIx],
        [newAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    // await makeTxConfirmation();

    chai.expect(makeTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

  it("able to make partner promise", async () => {
    const text = [126, 210, 132, 45, 145, 123, 53, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )

    chai.assert(makeTxConfirmation, "making partner promise failed")
  });

  it("able to fulfill partner promise", async () => {
    const text = [126, 81, 132, 53, 23, 111, 23, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const fulfillIx = await program
      .methods
      .fulfillPartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: otherAccountKp.publicKey,
        creator: newAccountKp.publicKey,
      })
      .instruction();

    const fulfillTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [fulfillIx],
      [otherAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(fulfillTxConfirmation, "fulfilling partner promise failed")
  });


  it("able to break partner promise", async () => {
    const text = [126, 41, 132, 45, 90, 41, 0, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const breakIx = await program
      .methods
      .breakPartnerPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 4000));
    const breakTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [breakIx],
      [authorKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(breakTxConfirmation, "breaking partner promise failed")
  });

  it("program error when partner is creator when making promise", async () => {
    const text = [126, 41, 132, 45, 90, 41, 0, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: newAccountKp.publicKey, // Using same account as partner
      })
      .instruction();

    const makeTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [makeIx],
        [newAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(makeTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)

  });

  it("program error when non-partner tries to fulfill partner promise", async () => {
    const text = [0, 157, 132, 45, 212, 30, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const nonPartnerFulfillIx = await program
      .methods
      .fulfillPartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: authorKp.publicKey,
        creator: newAccountKp.publicKey,
      })
      .instruction();

    const nonPartnerFulfillTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [nonPartnerFulfillIx],
        [authorKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(nonPartnerFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

  it("program error when non-author tries to break partner promise", async () => {
    const text = [42, 187, 99, 155, 201, 77, 13, 250] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const nonAuthorBreakIx = await program
      .methods
      .breakPartnerPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 4000));
    const nonAuthorBreakTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [nonAuthorBreakIx],
        [otherAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(nonAuthorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

  it("program error when partner tries to fulfill promise after deadline", async () => {
    const text = [0, 32, 132, 45, 212, 30, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 3)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const partnerFulfillIx = await program
      .methods
      .fulfillPartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: otherAccountKp.publicKey,
        creator: newAccountKp.publicKey,
      })
      .instruction();

    await new Promise(resolve => setTimeout(resolve, 5000));

    const partnerFulfillTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [partnerFulfillIx],
        [otherAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(partnerFulfillTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

  it("program error when author tries to break promise before deadline", async () => {
    const text = [0, 32, 132, 45, 212, 71, 42, 23] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(50000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = await sendVersionedTransaction(
      provider.connection,
      [makeIx],
      [newAccountKp],
      0,
      [],
      {
        onStatusUpdate(status):void {},
      }
    )
    chai.assert(makeTxConfirmation, "making partner promise failed")

    const authorBreakIx = await program
      .methods
      .breakPartnerPromise(text, deadlineSecs, size)
      .accounts({
        creator: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const authorBreakTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [authorBreakIx],
        [authorKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(authorBreakTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

  it("program error when partner promise size is less than 10,000,000 lamports", async () => {
    const text = [99, 45, 178, 23, 111, 64, 37, 200] as Array<number>
    const deadlineSecs = new BN(Math.floor(Date.now()/1000) + 10)
    const size = new BN(5000000)

    const makeIx = await program
      .methods
      .makePartnerPromise(text, deadlineSecs, size)
      .accounts({
        signer: newAccountKp.publicKey,
        partner: otherAccountKp.publicKey,
      })
      .instruction();

    const makeTxConfirmation = async () => {
      return sendVersionedTransaction(
        provider.connection,
        [makeIx],
        [newAccountKp],
        0,
        [],
        {
          onStatusUpdate(status):void {},
        }
      )
    }

    chai.expect(makeTxConfirmation()).to.eventually
      .be.rejectedWith("Simulation failed.")
      .and.be.an.instanceOf(Error)
  });

});
