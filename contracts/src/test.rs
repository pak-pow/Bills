#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Env, symbol_short};
use soroban_sdk::token::Client as TokenClient;
use soroban_sdk::token::StellarAssetClient;

#[test]
fn test_bill_split_happy_path() {
    let env = Env::default();
    env.mock_all_auths();

    // Setup admin and roommates
    let admin = Address::generate(&env);
    let roommate_a = Address::generate(&env);
    let roommate_b = Address::generate(&env);
    let roommate_c = Address::generate(&env);

    // Setup mock USDC token
    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = TokenClient::new(&env, &token_contract_id.address());
    let token_asset_client = StellarAssetClient::new(&env, &token_contract_id.address());

    // Mint USDC to roommates
    token_asset_client.mint(&roommate_a, &1000);
    token_asset_client.mint(&roommate_b, &1000);
    token_asset_client.mint(&roommate_c, &1000);

    // Deploy PaloBills contract
    let contract_id = env.register_contract(None, PaloBillsContract);
    let client = PaloBillsContractClient::new(&env, &contract_id);

    // Initialize
    client.initialize(&admin, &token_contract_id.address());
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_token(), token_contract_id.address());

    // Add roommates with their splits: 50% (5000 bps), 30% (3000 bps), 20% (2000 bps)
    client.add_member(&roommate_a, &5000);
    client.add_member(&roommate_b, &3000);
    client.add_member(&roommate_c, &2000);

    assert_eq!(client.get_share_bps(&roommate_a), 5000);
    assert_eq!(client.get_share_bps(&roommate_b), 3000);
    assert_eq!(client.get_share_bps(&roommate_c), 2000);

    // Roommates deposit USDC into the bill pre-fund pool
    client.deposit(&roommate_a, &500);
    client.deposit(&roommate_b, &300);
    client.deposit(&roommate_c, &200);

    assert_eq!(client.get_balance(&roommate_a), 500);
    assert_eq!(client.get_balance(&roommate_b), 300);
    assert_eq!(client.get_balance(&roommate_c), 200);

    assert_eq!(token_client.balance(&contract_id), 1000);

    // Admin charges a bill of 200 USDC
    // Expected charges:
    // Roommate A: 200 * 50% = 100 USDC
    // Roommate B: 200 * 30% = 60 USDC
    // Roommate C: 200 * 20% = 40 USDC
    let total_charged = client.charge_bill(&symbol_short!("Meralco"), &200);
    assert_eq!(total_charged, 200);

    // Verify balances after bill charging
    assert_eq!(client.get_balance(&roommate_a), 400); // 500 - 100
    assert_eq!(client.get_balance(&roommate_b), 240); // 300 - 60
    assert_eq!(client.get_balance(&roommate_c), 160); // 200 - 40

    // Verify admin received the 200 USDC
    assert_eq!(token_client.balance(&admin), 200);
    assert_eq!(token_client.balance(&contract_id), 800); // 1000 - 200

    // Roommate A withdraws 100 USDC from their excess balance
    client.withdraw(&roommate_a, &100);
    assert_eq!(client.get_balance(&roommate_a), 300); // 400 - 100
    assert_eq!(token_client.balance(&roommate_a), 600); // 500 remaining + 100 withdrawn
    assert_eq!(token_client.balance(&contract_id), 700); // 800 - 100
}

#[test]
#[should_panic(expected = "Member has insufficient pre-funded balance")]
fn test_bill_split_insufficient_funds() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let roommate_a = Address::generate(&env);
    let roommate_b = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract_id = env.register_stellar_asset_contract_v2(token_admin);
    let token_asset_client = StellarAssetClient::new(&env, &token_contract_id.address());

    token_asset_client.mint(&roommate_a, &100);
    token_asset_client.mint(&roommate_b, &100);

    let contract_id = env.register_contract(None, PaloBillsContract);
    let client = PaloBillsContractClient::new(&env, &contract_id);

    client.initialize(&admin, &token_contract_id.address());
    client.add_member(&roommate_a, &5000);
    client.add_member(&roommate_b, &5000);

    client.deposit(&roommate_a, &50);
    client.deposit(&roommate_b, &50);

    // Charge 200 USDC (requires 100 USDC from roommate A, but roommate A only deposited 50)
    client.charge_bill(&symbol_short!("Rent"), &200);
}
