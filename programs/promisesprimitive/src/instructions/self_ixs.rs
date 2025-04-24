use crate::state;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::{native_token::LAMPORTS_PER_SOL};

pub fn make_self_promise(
    ctx: Context<MakeSelfPromise>,
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
) -> Result<()> {
    // Check if promise size is at least 10000000 lamports
    msg!("Checking if promise size is at least 10000000 lamports");
    require_gte!(size, 10000000);

    ctx.accounts.promise_account.bump = ctx.bumps.promise_account;
    ctx.accounts.promise_account.size = size;

    msg!("Checking if deadline is at a future time");
    require_gte!(deadline_secs, Clock::get().unwrap().unix_timestamp as u64);
    ctx.accounts.promise_account.unix_seconds = deadline_secs;
    ctx.accounts.promise_account.text = text;

    const FEE_TO_AUTHOR: u64 = LAMPORTS_PER_SOL / 200;

    msg!("Paying the author a fee");
    let pay_author = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.signer.key(),
        &ctx.accounts.author.key(),
        FEE_TO_AUTHOR,
    );
    let _ = anchor_lang::solana_program::program::invoke(
        &pay_author,
        &[
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.author.to_account_info(),
        ],
    );

    msg!("Transfering sol to new promise PDA");
    let hold_promise = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.signer.key(),
        &ctx.accounts.promise_account.key(),
        size,
    );
    let _ = anchor_lang::solana_program::program::invoke(
        &hold_promise,
        &[
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.promise_account.to_account_info(),
        ],
    );
    msg!("Made a promise with {:?}", ctx.program_id);
    Ok(())
}

pub fn fulfill_self_promise(
    ctx: Context<FulFillSelfPromise>,
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
) -> Result<()> {
    msg!("Checking if date criteria was met for fulfillment");
    require_gte!(deadline_secs, Clock::get().unwrap().unix_timestamp as u64);

    msg!("Returning SOL to creator");
    **ctx
        .accounts
        .promise_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= size;
    **ctx
        .accounts
        .signer
        .to_account_info()
        .try_borrow_mut_lamports()? += size;

    msg!("Fulfilled a promise with {:?}", ctx.program_id);
    Ok(())
}

pub fn break_self_promise(
    ctx: Context<BreakSelfPromise>,
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
) -> Result<()> {
    msg!("Checking if date criteria was met for breaking");
    require_gte!(Clock::get().unwrap().unix_timestamp as u64, deadline_secs);

    msg!("Sending SOL to author");
    **ctx
        .accounts
        .promise_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= size;
    **ctx
        .accounts
        .signer
        .to_account_info()
        .try_borrow_mut_lamports()? += size;

    msg!("Broke a promise with {:?}", ctx.program_id);
    Ok(())
}

#[derive(Accounts)]
#[instruction(
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
)]
pub struct MakeSelfPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 8 + 8 + 8 + 1,
        seeds = [b"selfpromise", signer.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump
    )]
    pub promise_account: Account<'info, state::SelfPromise>,
    #[account(mut, address = state::AUTHOR)]
    pub author: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
)]
pub struct FulFillSelfPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"selfpromise", signer.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump,
        close = signer
    )]
    promise_account: Account<'info, state::SelfPromise>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
)]
pub struct BreakSelfPromise<'info> {
    #[account(mut, address = state::AUTHOR)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"selfpromise", creator.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump,
        close = creator
    )]
    pub promise_account: Account<'info, state::SelfPromise>,
    system_program: Program<'info, System>,
}
