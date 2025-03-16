use anchor_lang::prelude::*;

declare_id!("8sL8SYGgy7JPbzQzA2MXtZzuHvgG4j84CeuV9Rxd42jb");

const AUTHOR: Pubkey = pubkey!("fTcVudr5vjBanSe9eYuX9HS3DuzjWKwavYBMbhLn2SJ");

#[program]
pub mod promisesprimitive {
    use anchor_lang::solana_program::instruction::Instruction;

    use super::*;

    pub fn make_self_promise(
        ctx: Context<MakeSelfPromise>, 
        text: Vec<u8>,
        deadline_secs: u64, 
        size: u64, 
    ) -> Result<()> {
        ctx.accounts.promise_account.bump = ctx.bumps.promise_account;
        ctx.accounts.promise_account.size = size; 
        ctx.accounts.promise_account.unix_seconds = deadline_secs; 
        // let hold_promise: Instruction = anchor_lang::solana_program::system_instruction::transfer(
        //     &ctx.accounts.signer.key(),
        //     &ctx.accounts.promise_account.key(),
        //     size,
        // );
        // let _ = anchor_lang::solana_program::program::invoke(
        //     &hold_promise,
        //     &[
        //         ctx.accounts.signer.to_account_info(),
        //         ctx.accounts.promise_account.to_account_info(),
        //     ],
        // );
        msg!("Making a promise with {:?}", ctx.program_id);
        Ok(())
    }

    pub fn fulfill_self_promise(
        ctx: Context<FulFillSelfPromise>, 
        text: Vec<u8>,
        deadline_secs: u64, 
        size: u64, 
    ) -> Result<()> {
        // let release_promise = anchor_lang::solana_program::system_instruction::transfer(
        //     &ctx.accounts.promise_account.key(),
        //     &ctx.accounts.signer.key(),
        //     size,
        // );
        // let _ = anchor_lang::solana_program::program::invoke(
        //     &release_promise,
        //     &[
        //         ctx.accounts.promise_account.to_account_info(),
        //         ctx.accounts.signer.to_account_info(),
        //     ],
        // );
        msg!("Fulfilling a promise with {:?}", ctx.program_id);
        Ok(())
    }

    pub fn break_self_promise(
        ctx: Context<BreakSelfPromise>, 
        creator: Pubkey, 
        text: Vec<u8>,
        deadline_secs: u64, 
        size: u64, 
    ) -> Result<()> {
        // let release_promise = anchor_lang::solana_program::system_instruction::transfer(
        //     &ctx.accounts.promise_account.key(),
        //     &ctx.accounts.signer.key(),
        //     size,
        // );
        // let _ = anchor_lang::solana_program::program::invoke(
        //     &release_promise,
        //     &[
        //         ctx.accounts.promise_account.to_account_info(),
        //         ctx.accounts.signer.to_account_info(),
        //     ],
        // );
        msg!("Breaking a promise with {:?}", ctx.program_id);
        Ok(())
    }

}

#[derive(Accounts)]
#[instruction(
    text: Vec<u8>,
    deadline_secs: u64, 
    size: u64, 
)]
pub struct MakeSelfPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init, 
        payer = signer, 
        space = 8 + 8 + 1, 
        seeds = [b"selfpromise", signer.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump
    )]
    pub promise_account: Account<'info, SelfPromise>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    text: Vec<u8>,
    deadline_secs: u64, 
    size: u64, 
)]
pub struct FulFillSelfPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        seeds = [b"selfpromise", signer.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump
    )]
    pub promise_account: Account<'info, SelfPromise>,
}

#[derive(Accounts)]
#[instruction(
    creator: Pubkey, 
    text: Vec<u8>,
    deadline_secs: u64, 
    size: u64, 
)]
pub struct BreakSelfPromise<'info> {
    #[account(address = AUTHOR)]
    pub signer: Signer<'info>,
    #[account(
        seeds = [b"selfpromise", creator.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump,
    )]
    pub promise_account: Account<'info, SelfPromise>,
}

#[account]
pub struct SelfPromise {
    data: u64,
    unix_seconds: u64, 
    size: u64, 
    bump: u8
}