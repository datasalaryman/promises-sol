use crate::state;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;

pub fn make_partner_promise(
    ctx: Context<MakePartnerPromise>,
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
) -> Result<()> {
    // Check if promise size is at least 10000000 lamports
    msg!("Checking if promise size is at least 10000000 lamports");
    require_gte!(size, 10000000);

    ctx.accounts.promise_account.bump = ctx.bumps.promise_account;

    msg!("Checking if partner is not the signer");
    require_neq!(ctx.accounts.partner.key(), ctx.accounts.signer.key());

    ctx.accounts.promise_account.partner = ctx.accounts.partner.key();
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

pub fn fulfill_partner_promise(
    ctx: Context<FulFillPartnerPromise>,
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
) -> Result<()> {
    msg!("Checking if date criteria was met for fulfillment");
    require_gte!(deadline_secs, Clock::get().unwrap().unix_timestamp as u64);

    msg!("Checking if signer is the partner");
    require_eq!(
        ctx.accounts.promise_account.partner,
        ctx.accounts.signer.key()
    );

    msg!("Returning SOL to creator");
    **ctx
        .accounts
        .promise_account
        .to_account_info()
        .try_borrow_mut_lamports()? -= size;
    **ctx
        .accounts
        .creator
        .to_account_info()
        .try_borrow_mut_lamports()? += size;

    msg!("Fulfilled a promise with {:?}", ctx.program_id);
    Ok(())
}

pub fn break_partner_promise(
    ctx: Context<BreakPartnerPromise>,
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
pub struct MakePartnerPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub partner: SystemAccount<'info>,
    #[account(
        init,
        payer = signer,
        space = 8 + 32 + 8 + 8 + 8 + 1,
        seeds = [b"partnerpromise", signer.key().as_ref(), partner.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump
    )]
    pub promise_account: Account<'info, state::PartnerPromise>,
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
pub struct FulFillPartnerPromise<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"partnerpromise", creator.key().as_ref(), signer.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump,
        close = creator
    )]
    promise_account: Account<'info, state::PartnerPromise>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(
    text: [u8; 8],
    deadline_secs: u64,
    size: u64,
)]
pub struct BreakPartnerPromise<'info> {
    #[account(mut, address = state::AUTHOR)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub creator: SystemAccount<'info>,
    #[account(mut)]
    pub partner: SystemAccount<'info>,
    #[account(
        mut,
        seeds = [b"partnerpromise", creator.key().as_ref(), partner.key().as_ref(), text.as_ref(), &deadline_secs.to_le_bytes().to_vec(), &size.to_le_bytes().to_vec()],
        bump = promise_account.bump,
        close = creator
    )]
    promise_account: Account<'info, state::PartnerPromise>,
    system_program: Program<'info, System>,
}
