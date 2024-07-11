use anchor_lang::prelude::*;

declare_id!("DbEmYfDwjsW2ge6pF4BVc91W1XHVbs1Lk7hQ3JEc1hvP");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String) -> Result<()> {
        let dao_account = &mut ctx.accounts.dao_account;

        dao_account.name = name;
        dao_account.owner = *ctx.accounts.payer.key;

        Ok(())
    }

    pub fn create_proposal(ctx: Context<CreateProposal>, title: String, description: String) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        proposal.title = title;
        proposal.description = description;
        proposal.votes_yes = 0;
        proposal.votes_no = 0;

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, vote: bool) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        let voter = &mut ctx.accounts.voter;

        // Check if the user has already voted
        if voter.has_voted {
            return Err(VotingError::VotedTwice.into());
        }

        // Register the vote
        if vote {
            proposal.votes_yes += 1;
        } else {
            proposal.votes_no += 1;
        }

        // Mark the user as having voted
        voter.has_voted = true;

        // Reward the voter
        let reward = &mut ctx.accounts.reward_account;
        reward.reward_points += 1;

        Ok(())
    }
}


#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    #[account(
        init,
        space = 8 + DaoAccount::INIT_SPACE,
        payer = payer,
    )]
    pub dao_account: Account<'info, DaoAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        seeds = [dao_account.key().as_ref(), title.as_bytes()],
        space = 8 + Proposal::INIT_SPACE,
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub dao_account: Account<'info, DaoAccount>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    #[account(
        init_if_needed,
        seeds = [b"voter", proposal.key().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + Voter::INIT_SPACE,
    )]
    pub voter: Account<'info, Voter>,

    #[account(
        init_if_needed,
        seeds = [dao_account.key().as_ref(), user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + RewardAccount::INIT_SPACE,
    )]
    pub reward_account: Account<'info, RewardAccount>,

    #[account(mut)]
    pub dao_account: Account<'info, DaoAccount>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct DaoAccount  {
    #[max_len(20)]
    pub name: String,
    pub owner: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    #[max_len(50)]
    pub title: String,
    #[max_len(200)]
    pub description: String,
    pub votes_yes: u64,
    pub votes_no: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Voter {
    pub has_voted: bool,
}

#[account]
#[derive(InitSpace)]
pub struct RewardAccount {
    pub user: Pubkey,
    pub reward_points: u64,
}


#[error_code]
pub enum VotingError {
    #[msg("The user has already voted")]
    VotedTwice
}