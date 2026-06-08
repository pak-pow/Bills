#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, token, Symbol};

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    Members,
    Balance(Address),
    ShareBps(Address),
}

#[contract]
pub struct PaloBillsContract;

#[contractimpl]
impl PaloBillsContract {
    /// Initialize the contract with an admin and the payment token (USDC)
    pub fn initialize(env: Env, admin: Address, token: Address) {
        assert!(!env.storage().instance().has(&DataKey::Admin), "Already initialized");
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        
        let empty_members: Vec<Address> = Vec::new(&env);
        env.storage().instance().set(&DataKey::Members, &empty_members);
    }

    /// Read the admin address
    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Read the token address
    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    /// Add a member (roommate) with their split share in basis points (e.g. 5000 = 50%)
    pub fn add_member(env: Env, member: Address, share_bps: u32) {
        // Only admin can add members
        let admin: Address = Self::get_admin(env.clone());
        admin.require_auth();

        let mut members: Vec<Address> = env.storage().instance().get(&DataKey::Members).unwrap();
        
        // Check if member already exists
        let mut exists = false;
        for m in members.iter() {
            if m == member {
                exists = true;
                break;
            }
        }

        if !exists {
            members.push_back(member.clone());
            env.storage().instance().set(&DataKey::Members, &members);
        }

        // Set the member's share
        env.storage().persistent().set(&DataKey::ShareBps(member), &share_bps);
    }

    /// Get the list of all members
    pub fn get_members(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Members).unwrap_or_else(|| Vec::new(&env))
    }

    /// Get a member's share in basis points
    pub fn get_share_bps(env: Env, member: Address) -> u32 {
        env.storage().persistent().get(&DataKey::ShareBps(member)).unwrap_or(0)
    }

    /// Get a member's pre-funded balance
    pub fn get_balance(env: Env, member: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(member)).unwrap_or(0)
    }

    /// Members deposit USDC to pre-fund their bills
    pub fn deposit(env: Env, from: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "Amount must be positive");

        // Verify the depositor is a registered member
        let share = Self::get_share_bps(env.clone(), from.clone());
        assert!(share > 0, "Depositor is not a registered member");

        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);

        // Transfer tokens from user to contract
        token_client.transfer(&from, &env.current_contract_address(), &amount);

        // Update member's on-chain pre-funded balance
        let mut current_balance = Self::get_balance(env.clone(), from.clone());
        current_balance += amount;
        env.storage().persistent().set(&DataKey::Balance(from), &current_balance);
    }

    /// Admin charges a bill. The contract calculates each roommate's share,
    /// deducts it from their balances, and transfers the sum to the admin.
    pub fn charge_bill(env: Env, _description: Symbol, total_amount: i128) -> i128 {
        let admin = Self::get_admin(env.clone());
        admin.require_auth();
        assert!(total_amount > 0, "Bill amount must be positive");

        let members = Self::get_members(env.clone());
        let mut total_charged: i128 = 0;

        // Verify shares sum to 100% (10000 bps)
        let mut total_bps: u32 = 0;
        for member in members.iter() {
            total_bps += Self::get_share_bps(env.clone(), member.clone());
        }
        assert!(total_bps == 10000, "Member shares must sum to exactly 10000 basis points (100%)");

        // Deduct from each member
        for member in members.iter() {
            let share_bps = Self::get_share_bps(env.clone(), member.clone());
            let member_share = (total_amount * share_bps as i128) / 10000;
            
            let mut balance = Self::get_balance(env.clone(), member.clone());
            assert!(balance >= member_share, "Member has insufficient pre-funded balance");
            
            balance -= member_share;
            total_charged += member_share;
            env.storage().persistent().set(&DataKey::Balance(member), &balance);
        }

        // Transfer total collected funds to admin/utility manager
        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &admin, &total_charged);

        total_charged
    }

    /// Roommate withdraws their excess pre-funded balance
    pub fn withdraw(env: Env, from: Address, amount: i128) {
        from.require_auth();
        assert!(amount > 0, "Amount must be positive");

        let mut balance = Self::get_balance(env.clone(), from.clone());
        assert!(balance >= amount, "Insufficient pre-funded balance");

        balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(from.clone()), &balance);

        let token_addr = Self::get_token(env.clone());
        let token_client = token::Client::new(&env, &token_addr);
        token_client.transfer(&env.current_contract_address(), &from, &amount);
    }
}

#[cfg(test)]
mod test;
