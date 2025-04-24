use anchor_lang::prelude::*;

pub const AUTHOR: Pubkey = pubkey!("fTcVudr5vjBanSe9eYuX9HS3DuzjWKwavYBMbhLn2SJ");

#[account]
#[derive(Default)]
pub struct PartnerPromise {
    pub partner: Pubkey,
    pub text: [u8; 8],
    pub unix_seconds: u64,
    pub size: u64,
    pub bump: u8,
}

#[account]
#[derive(Default)]
pub struct SelfPromise {
    pub text: [u8; 8],
    pub unix_seconds: u64,
    pub size: u64,
    pub bump: u8,
}
