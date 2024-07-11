import * as anchor from "@coral-xyz/anchor";
import { Voting } from "../target/types/voting";
import { assert } from "chai";
import { PublicKey } from '@solana/web3.js';
import { makeKeypairs, confirmTransaction } from '@solana-developers/helpers';

async function airdropSOL(provider, publicKey, amount) {
  const signature = await provider.connection.requestAirdrop(publicKey, amount);
  await confirmTransaction(provider.connection, signature);
}

describe("voting", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Voting as anchor.Program<Voting>;

  const daoName = 'TestDAO';
  const proposalTitle = 'Proposal Test';
  const proposalDescription = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat';

  it("Is initialized!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const account = await program.account.daoAccount.fetch(daoAccount.publicKey);

    assert.equal(account.name, daoName);
    assert.equal(account.owner.toString(), provider.wallet.publicKey);
  });

  it("Is created a proposal!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const tx = await program.methods
      .createProposal(proposalTitle, proposalDescription)
      .accounts({
        payer: provider.wallet.publicKey,
        daoAccount: daoAccount.publicKey,
      })
      .rpc();

    const [proposal, bump] = await PublicKey.findProgramAddressSync (
      [daoAccount.publicKey.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

    const proposalAccount = await program.account.proposal.fetch(proposal);

    assert.equal(proposalAccount.title, proposalTitle);
    assert.equal(proposalAccount.description, proposalDescription);
    assert.equal(proposalAccount.votesYes.toNumber(), 0);
    assert.equal(proposalAccount.votesNo.toNumber(), 0);
  });

  it("Is possible to vote yes!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const tx = await program.methods
      .createProposal(proposalTitle, proposalDescription)
      .accounts({
        payer: provider.wallet.publicKey,
        daoAccount: daoAccount.publicKey,
      })
      .rpc();

    const [proposalPda, bump] = await PublicKey.findProgramAddressSync (
      [daoAccount.publicKey.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

     const vote = true;

    await program.methods
      .vote(vote)
      .accounts({
        proposal: proposalPda,
        daoAccount: daoAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    const [voterPda, voterBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("voter"), proposalPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [rewardPda, rewardBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [daoAccount.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    const voterAccount = await program.account.voter.fetch(voterPda);
    const rewardAccount = await program.account.rewardAccount.fetch(rewardPda);
 
    assert.equal(proposalAccount.title, proposalTitle);
    assert.equal(proposalAccount.description, proposalDescription);
    assert.equal(proposalAccount.votesYes.toNumber(), 1);
    assert.equal(proposalAccount.votesNo.toNumber(), 0);
    assert.equal(voterAccount.hasVoted, true);
    assert.equal(rewardAccount.rewardPoints.toNumber(), 1);  
  });

  it("Is possible to vote No!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const tx = await program.methods
      .createProposal(proposalTitle, proposalDescription)
      .accounts({
        payer: provider.wallet.publicKey,
        daoAccount: daoAccount.publicKey,
      })
      .rpc();

    const [proposalPda, bump] = await PublicKey.findProgramAddressSync (
      [daoAccount.publicKey.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

     const vote = false;

    await program.methods
      .vote(vote)
      .accounts({
        proposal: proposalPda,
        daoAccount: daoAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    const [voterPda, voterBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("voter"), proposalPda.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [rewardPda, rewardBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [daoAccount.publicKey.toBuffer(), provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const proposalAccount = await program.account.proposal.fetch(proposalPda);
    const voterAccount = await program.account.voter.fetch(voterPda);
    const rewardAccount = await program.account.rewardAccount.fetch(rewardPda);
 
    assert.equal(proposalAccount.title, proposalTitle);
    assert.equal(proposalAccount.description, proposalDescription);
    assert.equal(proposalAccount.votesYes.toNumber(), 0);
    assert.equal(proposalAccount.votesNo.toNumber(), 1);
    assert.equal(voterAccount.hasVoted, true);
    assert.equal(rewardAccount.rewardPoints.toNumber(), 1);  
  });

  it("Is not possible to vote twice with the same user!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const tx = await program.methods
      .createProposal(proposalTitle, proposalDescription)
      .accounts({
        payer: provider.wallet.publicKey,
        daoAccount: daoAccount.publicKey,
      })
      .rpc();

    const [proposalPda, bump] = await PublicKey.findProgramAddressSync (
      [daoAccount.publicKey.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

     const vote = true;

    await program.methods
      .vote(vote)
      .accounts({
        proposal: proposalPda,
        daoAccount: daoAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    try {
      
    await program.methods
    .vote(vote)
    .accounts({
      proposal: proposalPda,
      daoAccount: daoAccount.publicKey,
      user: provider.wallet.publicKey,
    })
    .rpc();
  }catch(err) {
      assert.equal(err.error.errorCode.code, 'VotedTwice');
      assert.equal(err.error.errorMessage, 'The user has already voted');
    }
  });

  it("Is not possible to create proposal with texts too long!", async () => {
    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const textTooLong = 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?';

    try {
      const tx = await program.methods
        .createProposal(textTooLong, proposalDescription)
        .accounts({
          payer: provider.wallet.publicKey,
          daoAccount: daoAccount.publicKey,
        })
        .rpc();
    } catch(err) {
      assert(err, 'Reached maximum depth for account resolution');
    }

    try {
      const tx = await program.methods
        .createProposal(proposalTitle, textTooLong)
        .accounts({
          payer: provider.wallet.publicKey,
          daoAccount: daoAccount.publicKey,
        })
        .rpc();
    } catch(err) {
      assert(err, 'Reached maximum depth for account resolution');
    }
  });

  it('Is possible for multiples users to vote', async () => {
    const keypairs = makeKeypairs(4);

    const daoAccount = anchor.web3.Keypair.generate();

    await program.methods
      .initialize(daoName)
      .accounts({
        daoAccount: daoAccount.publicKey,
        payer: provider.wallet.publicKey,
      })
      .signers([daoAccount])
      .rpc();

    const tx = await program.methods
      .createProposal(proposalTitle, proposalDescription)
      .accounts({
        payer: provider.wallet.publicKey,
        daoAccount: daoAccount.publicKey,
      })
      .rpc();

    const [proposalPda, bump] = await PublicKey.findProgramAddressSync (
      [daoAccount.publicKey.toBuffer(), Buffer.from(proposalTitle)],
      program.programId
    );

    
    for(let i=0; i< keypairs.length; i++) {
      const vote = Math.random() < 0.5;

      await airdropSOL(provider, keypairs[i].publicKey, 1000000000);

      const balance = await provider.connection.getBalance(keypairs[i].publicKey);

      await program.methods
      .vote(vote)
      .accounts({
        proposal: proposalPda,
        daoAccount: daoAccount.publicKey,
        user: keypairs[i].publicKey,
      })
      .signers([keypairs[i]])
      .rpc();
    }

    const proposalAccount = await program.account.proposal.fetch(proposalPda);

    assert.equal(proposalAccount.votesYes.toNumber() + proposalAccount.votesNo.toNumber(), keypairs.length);
  })
});
