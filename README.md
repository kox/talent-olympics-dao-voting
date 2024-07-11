# Talent Olympics: DAO Voting

This repository contains a DAO voting program built using the lastest version of Anchor on the Solana blockchain. The program allows users to create a DAO, create proposals within the DAO, vote on those proposals, and receive rewards for voting participation. The program ensures that each user can only vote once on a proposal.

## Features

- Initialize DAO: Create a new DAO with a unique name and owner.
- Create Proposal: Create proposals within the DAO.
- Vote on Proposals: Users can vote on proposals, and each user can vote only once per proposal.
- Reward Voting Participation: Users receive reward points for participating in the voting process.

## Prerequisites

- Rust
- Solana CLI
- Anchor CLI
- Node.js
- Pnpm or Yarn or npm

## Installation

Clone the repository:

```bash
git clone https://github.com/kox/talent-olympics-dao-voting
cd talent-olympics-dao-voting
```

Install dependencies:

```bash
pnpm i
```

Build the program:

```bash
anchor build
```

Run the tests:

```bash
anchor test
```

Deploy the program:

```bash
anchor deploy
```

### Usage

Check the tests where provides all information to use each instruction and the expected data.


