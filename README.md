# promisekeepr.xyz

A commitment contract system on Solana where users stake SOL to keep their promises. It's stickk.com for your SOL!

## What is a Promise?

A promise is a commitment contract where you:

- Stake SOL as collateral
- Set a deadline to complete your goal
- Get your SOL back if you succeed
- Lose your SOL if you fail

Example: "I promise to exercise daily for 30 days" with 0.01 SOL staked. If you complete it before the deadline, you can get your SOL back. If you fail, the author gets your SOL after the deadline.

## Key Concepts

### Operations

- **Create**: Stake SOL, set deadline, pay 0.005 SOL fee
- **Fulfill**: Return staked SOL before deadline
- **Break**: Author claims SOL after deadline

### Promise Structure

- 8-byte text identifier
- Deadline (Unix timestamp)
- Staked SOL amount (minimum 0.01 SOL)
- Creator's Solana address
- PDA bump for unique identification
