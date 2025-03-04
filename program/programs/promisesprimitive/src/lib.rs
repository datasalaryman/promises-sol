use anchor_lang::prelude::*;

declare_id!("8sL8SYGgy7JPbzQzA2MXtZzuHvgG4j84CeuV9Rxd42jb");

#[program]
pub mod promisesprimitive {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
