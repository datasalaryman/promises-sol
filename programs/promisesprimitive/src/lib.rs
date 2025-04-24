use anchor_lang::prelude::*;

pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("9NnVb7JtJL6WtKnWXB7NsTwZDrR7P616yRC4FxcXN2r5");

#[program]
pub mod promisesprimitive {
    use super::*;

    // Re-export the instruction functions directly
    pub fn make_self_promise(
        ctx: Context<MakeSelfPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::self_ixs::make_self_promise(ctx, text, deadline_secs, size)
    }

    pub fn fulfill_self_promise(
        ctx: Context<FulFillSelfPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::self_ixs::fulfill_self_promise(ctx, text, deadline_secs, size)
    }

    pub fn break_self_promise(
        ctx: Context<BreakSelfPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::self_ixs::break_self_promise(ctx, text, deadline_secs, size)
    }

    pub fn make_partner_promise(
        ctx: Context<MakePartnerPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::partner_ixs::make_partner_promise(ctx, text, deadline_secs, size)
    }

    pub fn fulfill_partner_promise(
        ctx: Context<FulFillPartnerPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::partner_ixs::fulfill_partner_promise(ctx, text, deadline_secs, size)
    }

    pub fn break_partner_promise(
        ctx: Context<BreakPartnerPromise>,
        text: [u8; 8],
        deadline_secs: u64,
        size: u64,
    ) -> Result<()> {
        instructions::partner_ixs::break_partner_promise(ctx, text, deadline_secs, size)
    }
}
