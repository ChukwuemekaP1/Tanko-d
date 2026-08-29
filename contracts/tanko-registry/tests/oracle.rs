use soroban_sdk::{
    testutils::{Address as _, Ledger as _},
    Address, BytesN, Env,
};

#[test]
fn test_oracle_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Initialize contract
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    // Create oracle public key (32 bytes)
    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);

    // Initialize oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Verify oracle was initialized
    let stored_key = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .get_oracle_public_key();

    assert_eq!(stored_key, oracle_public_key);
}

#[test]
fn test_oracle_price_update() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Update price
    let price_per_liter = 25_000_000u64; // $25/liter in stroops
    let fuel_type = 1u32; // Diesel
    let timestamp = env.ledger().timestamp() as u64;
    let signature = BytesN::<64>::from_array(&env, &[0u8; 64]);

    tanko_registry::TankoRegistryClient::new(&env, &contract_id).update_price(
        &admin,
        &price_per_liter,
        &timestamp,
        &fuel_type,
        &None,
        &signature,
    );

    // Verify price was stored
    let current_price = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .get_current_price();

    assert_eq!(current_price.price_per_liter, price_per_liter);
    assert_eq!(current_price.fuel_type, fuel_type);
}

#[test]
fn test_oracle_max_price_age() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Get default max price age (should be 3600 seconds = 1 hour)
    let max_age = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .get_max_price_age();

    assert_eq!(max_age, 3600u64);

    // Update max price age
    let new_max_age = 7200u64; // 2 hours
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .set_max_price_age(&admin, &new_max_age);

    // Verify new max age
    let updated_max_age = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .get_max_price_age();

    assert_eq!(updated_max_age, new_max_age);
}

#[test]
fn test_price_freshness_check() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Update price with current timestamp
    let price_per_liter = 25_000_000u64;
    let fuel_type = 1u32;
    let timestamp = env.ledger().timestamp() as u64;
    let signature = BytesN::<64>::from_array(&env, &[0u8; 64]);

    tanko_registry::TankoRegistryClient::new(&env, &contract_id).update_price(
        &admin,
        &price_per_liter,
        &timestamp,
        &fuel_type,
        &None,
        &signature,
    );

    // Check if price is fresh
    let is_fresh = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .is_current_price_fresh();

    assert!(is_fresh);
}

#[test]
#[should_panic(expected = "Only admin can initialize oracle")]
fn test_oracle_init_non_admin_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    // Initialize contract
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    // Try to initialize oracle as non-admin
    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&non_admin, &oracle_public_key);
}

#[test]
#[should_panic(expected = "Only admin can update prices")]
fn test_oracle_price_update_non_admin_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);
    let non_admin = Address::generate(&env);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Try to update price as non-admin
    let price_per_liter = 25_000_000u64;
    let fuel_type = 1u32;
    let timestamp = env.ledger().timestamp() as u64;
    let signature = BytesN::<64>::from_array(&env, &[0u8; 64]);

    tanko_registry::TankoRegistryClient::new(&env, &contract_id).update_price(
        &non_admin,
        &price_per_liter,
        &timestamp,
        &fuel_type,
        &None,
        &signature,
    );
}

#[test]
#[should_panic(expected = "Price timestamp is too old")]
fn test_oracle_stale_price_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Advance ledger time so a stale timestamp can be constructed without underflow
    env.ledger().set_timestamp(10_000);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Set max price age to 1 hour
    let max_age = 3600u64;
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .set_max_price_age(&admin, &max_age);

    // Try to update with stale timestamp (more than 1 hour ago)
    let now = env.ledger().timestamp() as u64;
    let stale_timestamp = now - 7200u64; // 2 hours ago
    let price_per_liter = 25_000_000u64;
    let fuel_type = 1u32;
    let signature = BytesN::<64>::from_array(&env, &[0u8; 64]);

    tanko_registry::TankoRegistryClient::new(&env, &contract_id).update_price(
        &admin,
        &price_per_liter,
        &stale_timestamp,
        &fuel_type,
        &None,
        &signature,
    );
}

#[test]
fn test_oracle_regional_price() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, tanko_registry::TankoRegistry);
    let admin = Address::generate(&env);

    // Initialize contract and oracle
    tanko_registry::TankoRegistryClient::new(&env, &contract_id).init(&admin);

    let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]);
    tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .init_oracle(&admin, &oracle_public_key);

    // Update price with station ID (regional price)
    let price_per_liter = 24_500_000u64; // $24.50/liter for Pemex
    let fuel_type = 1u32; // Diesel
    let station_id = Some(42u64); // Pemex station ID
    let timestamp = env.ledger().timestamp() as u64;
    let signature = BytesN::<64>::from_array(&env, &[0u8; 64]);

    tanko_registry::TankoRegistryClient::new(&env, &contract_id).update_price(
        &admin,
        &price_per_liter,
        &timestamp,
        &fuel_type,
        &station_id,
        &signature,
    );

    // Verify price was stored with station ID
    let current_price = tanko_registry::TankoRegistryClient::new(&env, &contract_id)
        .get_current_price();

    assert_eq!(current_price.price_per_liter, price_per_liter);
    assert_eq!(current_price.station_id, station_id);
}
