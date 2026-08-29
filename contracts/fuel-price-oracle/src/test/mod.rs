#![cfg(test)]

extern crate std;

use super::*;
use std::vec::Vec;
use ed25519_dalek::{Signer as DalekSigner, SigningKey};
use sha2::{Digest, Sha256};
use soroban_sdk::testutils::{Address as _, Events, Ledger};
use soroban_sdk::{symbol_short, Address, BytesN, Env, String, Symbol, TryFromVal, Val, Vec as SorobanVec};

fn build_message_vec(
    fuel_type: FuelType,
    price_mxn: u64,
    price_usdc: u64,
    timestamp: u64,
    station_id: &str,
) -> Vec<u8> {
    let station_hash = Sha256::digest(station_id.as_bytes());
    let mut msg = Vec::with_capacity(60);
    msg.extend_from_slice(&fuel_type.to_u32().to_be_bytes());
    msg.extend_from_slice(&price_mxn.to_be_bytes());
    msg.extend_from_slice(&price_usdc.to_be_bytes());
    msg.extend_from_slice(&timestamp.to_be_bytes());
    msg.extend_from_slice(&station_hash);
    msg
}

const TEST_SEED: [u8; 32] = [
    0x5a, 0xcc, 0x72, 0x53, 0x29, 0x5d, 0xfc, 0x35, 0x6c, 0x04, 0x62, 0x97, 0x92, 0x5a, 0x36,
    0x9f, 0x3d, 0x27, 0x62, 0xd0, 0x0a, 0xfd, 0xf2, 0x58, 0x3e, 0xcb, 0xe9, 0x21, 0x80, 0xb0,
    0x7c, 0x37,
];

fn test_signing_key() -> SigningKey {
    SigningKey::from_bytes(&TEST_SEED)
}

fn pubkey_bytes(env: &Env) -> BytesN<32> {
    BytesN::from_array(env, &test_signing_key().verifying_key().to_bytes())
}

fn sign_payload(
    env: &Env,
    fuel_type: FuelType,
    price_mxn: u64,
    price_usdc: u64,
    timestamp: u64,
    station_id: &str,
) -> BytesN<64> {
    let msg_vec = build_message_vec(fuel_type, price_mxn, price_usdc, timestamp, station_id);
    let sig = test_signing_key().sign(&msg_vec);
    BytesN::from_array(env, &sig.to_bytes())
}

fn scale_mxn(value: f64) -> u64 {
    (value * MXN_SCALE as f64).round() as u64
}

fn scale_usdc(value: f64) -> u64 {
    (value * USDC_SCALE as f64).round() as u64
}

fn setup_initialized_with_admin(env: &Env) -> (FuelPriceOracleClient<'_>, Address) {
    let contract_id = env.register(FuelPriceOracle, ());
    let client = FuelPriceOracleClient::new(env, &contract_id);
    let admin = Address::generate(env);

    client.init(
        &admin,
        &pubkey_bytes(env),
        &scale_mxn(24.0),
        &scale_mxn(28.66),
        &scale_mxn(27.44),
        &scale_usdc(1.39),
        &scale_usdc(1.66),
        &scale_usdc(1.59),
    );

    (client, admin)
}

fn setup_initialized(env: &Env) -> FuelPriceOracleClient<'_> {
    let (client, _admin) = setup_initialized_with_admin(env);
    client
}

#[test]
fn test_init_seed_prices() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    let magna = client.get_price(&symbol_short!("MAGNA"));
    assert_eq!(magna.price_mxn, scale_mxn(24.0));
    assert_eq!(magna.price_usdc, scale_usdc(1.39));

    let premium = client.get_price(&symbol_short!("PREMIUM"));
    assert_eq!(premium.price_mxn, scale_mxn(28.66));

    let diesel = client.get_price(&symbol_short!("DIESEL"));
    assert_eq!(diesel.price_mxn, scale_mxn(27.44));
}

#[test]
fn test_accepts_valid_signed_payload() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    env.ledger().with_mut(|li| {
        li.timestamp = 1_748_304_000;
    });

    let price_mxn = scale_mxn(24.50);
    let price_usdc = scale_usdc(1.42);
    let timestamp = 1_748_304_000u64;
    let station_id = String::from_str(&env, "CRE-MX-001");
    let signature = sign_payload(
        &env,
        FuelType::Magna,
        price_mxn,
        price_usdc,
        timestamp,
        "CRE-MX-001",
    );

    client.update_price(
        &symbol_short!("MAGNA"),
        &price_mxn,
        &price_usdc,
        &timestamp,
        &station_id,
        &signature,
    );

    let updated = client.get_price(&symbol_short!("MAGNA"));
    assert_eq!(updated.price_mxn, price_mxn);
    assert_eq!(updated.price_usdc, price_usdc);
    assert_eq!(updated.timestamp, timestamp);
}

#[test]
fn test_rejects_altered_signature() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    env.ledger().with_mut(|li| {
        li.timestamp = 1_748_304_000;
    });

    let price_mxn = scale_mxn(25.0);
    let price_usdc = scale_usdc(1.45);
    let timestamp = 1_748_304_000u64;
    let station_id = String::from_str(&env, "CRE-MX-001");

    let wrong_key = SigningKey::from_bytes(&[1u8; 32]);
    let message = build_message_vec(
        FuelType::Premium,
        price_mxn,
        price_usdc,
        timestamp,
        "CRE-MX-001",
    );
    let bad_sig_bytes = wrong_key.sign(&message);
    let bad_signature = BytesN::from_array(&env, &bad_sig_bytes.to_bytes());

    let result = client.try_update_price(
        &symbol_short!("PREMIUM"),
        &price_mxn,
        &price_usdc,
        &timestamp,
        &station_id,
        &bad_signature,
    );
    assert!(result.is_err());
}

#[test]
fn test_rejects_expired_timestamp() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    let now = 1_748_304_000u64;
    env.ledger().with_mut(|li| {
        li.timestamp = now;
    });

    let expired_ts = now - MAX_PRICE_AGE_SECS - 1;
    let price_mxn = scale_mxn(24.0);
    let price_usdc = scale_usdc(1.39);
    let station_id = String::from_str(&env, "CRE-MX-001");
    let signature = sign_payload(
        &env,
        FuelType::Magna,
        price_mxn,
        price_usdc,
        expired_ts,
        "CRE-MX-001",
    );

    let result = client.try_update_price(
        &symbol_short!("MAGNA"),
        &price_mxn,
        &price_usdc,
        &expired_ts,
        &station_id,
        &signature,
    );
    assert!(result.is_err());
}

#[test]
fn test_rejects_replay_timestamp() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    let ts1 = 1_748_304_000u64;
    env.ledger().with_mut(|li| {
        li.timestamp = ts1;
    });

    let price_mxn = scale_mxn(24.10);
    let price_usdc = scale_usdc(1.40);
    let station_id = String::from_str(&env, "CRE-MX-001");
    let signature = sign_payload(
        &env,
        FuelType::Diesel,
        price_mxn,
        price_usdc,
        ts1,
        "CRE-MX-001",
    );

    client.update_price(
        &symbol_short!("DIESEL"),
        &price_mxn,
        &price_usdc,
        &ts1,
        &station_id,
        &signature,
    );

    let sig_replay = sign_payload(
        &env,
        FuelType::Diesel,
        price_mxn,
        price_usdc,
        ts1,
        "CRE-MX-001",
    );
    let result = client.try_update_price(
        &symbol_short!("DIESEL"),
        &price_mxn,
        &price_usdc,
        &ts1,
        &station_id,
        &sig_replay,
    );
    assert!(result.is_err());
}

#[test]
fn test_admin_can_rotate_oracle_pubkey() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup_initialized_with_admin(&env);

    let new_key = BytesN::from_array(&env, &[7u8; 32]);
    client.set_oracle_pubkey(&admin, &new_key);

    assert_eq!(client.get_oracle_pubkey(), new_key);
}

#[test]
fn test_rejects_non_admin_oracle_rotation() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _admin) = setup_initialized_with_admin(&env);

    let impostor = Address::generate(&env);
    let new_key = BytesN::from_array(&env, &[9u8; 32]);

    let result = client.try_set_oracle_pubkey(&impostor, &new_key);
    assert!(result.is_err());

    // The stored key is unchanged.
    assert_eq!(client.get_oracle_pubkey(), pubkey_bytes(&env));
}

#[test]
fn test_update_price_emits_price_up_event() {
    let env = Env::default();
    env.mock_all_auths();
    let client = setup_initialized(&env);

    env.ledger().with_mut(|li| {
        li.timestamp = 1_748_304_000;
    });

    let price_mxn = scale_mxn(24.50);
    let price_usdc = scale_usdc(1.42);
    let timestamp = 1_748_304_000u64;
    let station_id = String::from_str(&env, "CRE-MX-001");
    let signature = sign_payload(
        &env,
        FuelType::Magna,
        price_mxn,
        price_usdc,
        timestamp,
        "CRE-MX-001",
    );

    client.update_price(
        &symbol_short!("MAGNA"),
        &price_mxn,
        &price_usdc,
        &timestamp,
        &station_id,
        &signature,
    );

    let events = env.events().all();
    assert_eq!(events.len(), 1);

    let (_contract_id, topics, data) = events.get(0).unwrap();

    let topic0 = Symbol::try_from_val(&env, &topics.get(0).unwrap()).unwrap();
    assert_eq!(topic0, symbol_short!("price_up"));

    let topic1 = Symbol::try_from_val(&env, &topics.get(1).unwrap()).unwrap();
    assert_eq!(topic1, symbol_short!("MAGNA"));

    let data_vec = SorobanVec::<Val>::try_from_val(&env, &data).unwrap();
    assert_eq!(
        u64::try_from_val(&env, &data_vec.get(0).unwrap()).unwrap(),
        price_mxn
    );
    assert_eq!(
        u64::try_from_val(&env, &data_vec.get(1).unwrap()).unwrap(),
        price_usdc
    );
    assert_eq!(
        u64::try_from_val(&env, &data_vec.get(2).unwrap()).unwrap(),
        timestamp
    );
    assert_eq!(
        String::try_from_val(&env, &data_vec.get(3).unwrap()).unwrap(),
        station_id
    );
}
