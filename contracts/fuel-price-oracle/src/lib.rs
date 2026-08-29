#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Bytes, BytesN, Env, Symbol,
};

/// Maximum age of a price update (1 hour).
pub const MAX_PRICE_AGE_SECS: u64 = 3600;

/// Fixed-point scale for MXN (4 decimals): 24.00 → 240_000.
pub const MXN_SCALE: u64 = 10_000;

/// Fixed-point scale for USDC (7 decimals): 1.39 → 13_900_000.
pub const USDC_SCALE: u64 = 10_000_000;

/// Storage TTL refresh threshold in ledgers (~7 hours at 5s/ledger).
/// When a key's remaining TTL drops below this, it is bumped on the next access.
pub const TTL_THRESHOLD: u32 = 5_000;

/// Storage TTL extension target in ledgers (~30 days at 5s/ledger).
pub const TTL_EXTEND_TO: u32 = 518_400;

#[contracttype]
#[derive(Clone, Copy, PartialEq, Eq)]
#[repr(u32)]
pub enum FuelType {
    Magna = 0,
    Premium = 1,
    Diesel = 2,
}

impl FuelType {
    pub fn to_u32(self) -> u32 {
        self as u32
    }

    pub fn from_symbol(_env: &Env, sym: &Symbol) -> Option<Self> {
        if sym == &symbol_short!("MAGNA") {
            Some(FuelType::Magna)
        } else if sym == &symbol_short!("PREMIUM") {
            Some(FuelType::Premium)
        } else if sym == &symbol_short!("DIESEL") {
            Some(FuelType::Diesel)
        } else {
            None
        }
    }
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PriceData {
    pub price_mxn: u64,
    pub price_usdc: u64,
    pub timestamp: u64,
    pub station_id: soroban_sdk::String,
}

/// Storage keys. `Price` and `LastTimestamp` are stored as direct persistent
/// entries (one row per fuel type) instead of a single instance map, so a
/// price update only touches the affected fuel type.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    /// Designated admin that may rotate the oracle public key (instance storage).
    Admin,
    /// Authorized ed25519 public key that signs price updates (instance storage).
    OraclePubKey,
    /// Certified price for a fuel type (persistent storage).
    Price(FuelType),
    /// Last accepted update timestamp per fuel type, for replay protection (persistent storage).
    LastTimestamp(FuelType),
}

#[contract]
pub struct FuelPriceOracle;

/// Extends the TTL of the contract instance (and code) when it drops below the
/// threshold, preventing instance data from expiring on-chain.
fn extend_instance_ttl(env: &Env) {
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

/// Extends the TTL of a single persistent storage key.
fn extend_persistent_ttl(env: &Env, key: &DataKey) {
    env.storage()
        .persistent()
        .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn build_message(
    env: &Env,
    fuel_type: FuelType,
    price_mxn: u64,
    price_usdc: u64,
    timestamp: u64,
    station_id: &soroban_sdk::String,
) -> Bytes {
    let station_hash = env.crypto().sha256(&station_id.to_bytes());
    let mut msg = Bytes::new(env);
    msg.extend_from_slice(&fuel_type.to_u32().to_be_bytes());
    msg.extend_from_slice(&price_mxn.to_be_bytes());
    msg.extend_from_slice(&price_usdc.to_be_bytes());
    msg.extend_from_slice(&timestamp.to_be_bytes());
    msg.extend_from_slice(&station_hash.to_array());
    msg
}

fn validate_timestamp(env: &Env, fuel_type: FuelType, timestamp: u64) {
    let now = env.ledger().timestamp();
    assert!(timestamp <= now, "Timestamp is in the future");
    assert!(
        now.saturating_sub(timestamp) <= MAX_PRICE_AGE_SECS,
        "Price timestamp expired"
    );

    let last_ts_key = DataKey::LastTimestamp(fuel_type);
    if let Some(last_ts) = env
        .storage()
        .persistent()
        .get::<_, u64>(&last_ts_key)
    {
        extend_persistent_ttl(env, &last_ts_key);
        assert!(timestamp > last_ts, "Replay attack: stale timestamp");
    }
}

#[contractimpl]
impl FuelPriceOracle {
    /// Initialize oracle with a designated admin, authorized public key, and
    /// seed prices (scaled fixed-point).
    #[allow(clippy::too_many_arguments)]
    pub fn init(
        env: Env,
        admin: Address,
        oracle_pubkey: BytesN<32>,
        seed_magna_mxn: u64,
        seed_premium_mxn: u64,
        seed_diesel_mxn: u64,
        seed_magna_usdc: u64,
        seed_premium_usdc: u64,
        seed_diesel_usdc: u64,
    ) {
        assert!(
            env.storage()
                .instance()
                .get::<_, Address>(&DataKey::Admin)
                .is_none(),
            "Already initialized"
        );
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::OraclePubKey, &oracle_pubkey);
        extend_instance_ttl(&env);

        let now = env.ledger().timestamp();
        let station = soroban_sdk::String::from_str(&env, "CRE-MX-SEED");

        let seeds = [
            (FuelType::Magna, seed_magna_mxn, seed_magna_usdc),
            (FuelType::Premium, seed_premium_mxn, seed_premium_usdc),
            (FuelType::Diesel, seed_diesel_mxn, seed_diesel_usdc),
        ];

        for (fuel_type, price_mxn, price_usdc) in seeds {
            let price_key = DataKey::Price(fuel_type);
            let last_ts_key = DataKey::LastTimestamp(fuel_type);

            env.storage().persistent().set(
                &price_key,
                &PriceData {
                    price_mxn,
                    price_usdc,
                    timestamp: now,
                    station_id: station.clone(),
                },
            );
            env.storage().persistent().set(&last_ts_key, &now);
            extend_persistent_ttl(&env, &price_key);
            extend_persistent_ttl(&env, &last_ts_key);
        }
    }

    /// Update certified price for a fuel type. Signature covers
    /// [fuel_type, price_mxn, price_usdc, timestamp, station_id].
    ///
    /// Emits a `price_up` event with the accepted price data.
    #[allow(deprecated)] // env.events().publish — kept for the exact topic/data shape in the spec
    pub fn update_price(
        env: Env,
        fuel_type_sym: Symbol,
        price_mxn: u64,
        price_usdc: u64,
        timestamp: u64,
        station_id: soroban_sdk::String,
        signature: BytesN<64>,
    ) {
        let fuel_type = FuelType::from_symbol(&env, &fuel_type_sym)
            .unwrap_or_else(|| panic!("Invalid fuel type"));

        validate_timestamp(&env, fuel_type, timestamp);

        let oracle_pubkey = env
            .storage()
            .instance()
            .get::<_, BytesN<32>>(&DataKey::OraclePubKey)
            .unwrap_or_else(|| panic!("Oracle not initialized"));
        extend_instance_ttl(&env);

        let message = build_message(
            &env,
            fuel_type,
            price_mxn,
            price_usdc,
            timestamp,
            &station_id,
        );

        env.crypto()
            .ed25519_verify(&oracle_pubkey, &message, &signature);

        let price_key = DataKey::Price(fuel_type);
        let last_ts_key = DataKey::LastTimestamp(fuel_type);

        env.storage().persistent().set(
            &price_key,
            &PriceData {
                price_mxn,
                price_usdc,
                timestamp,
                station_id: station_id.clone(),
            },
        );
        env.storage().persistent().set(&last_ts_key, &timestamp);
        extend_persistent_ttl(&env, &price_key);
        extend_persistent_ttl(&env, &last_ts_key);

        env.events().publish(
            (symbol_short!("price_up"), fuel_type_sym),
            (price_mxn, price_usdc, timestamp, station_id),
        );
    }

    /// Simplified entry point per spec: updates MAGNA price using scaled values.
    pub fn update_price_simple(
        env: Env,
        price_mxn: u64,
        timestamp: u64,
        signature: BytesN<64>,
    ) {
        let price_key = DataKey::Price(FuelType::Magna);
        let current = env
            .storage()
            .persistent()
            .get::<_, PriceData>(&price_key)
            .unwrap_or_else(|| panic!("Magna price not set"));
        extend_persistent_ttl(&env, &price_key);

        Self::update_price(
            env,
            symbol_short!("MAGNA"),
            price_mxn,
            current.price_usdc,
            timestamp,
            current.station_id,
            signature,
        );
    }

    pub fn get_price(env: Env, fuel_type_sym: Symbol) -> PriceData {
        let fuel_type = FuelType::from_symbol(&env, &fuel_type_sym)
            .unwrap_or_else(|| panic!("Invalid fuel type"));

        let price_key = DataKey::Price(fuel_type);
        let price = env
            .storage()
            .persistent()
            .get::<_, PriceData>(&price_key)
            .unwrap_or_else(|| panic!("Price not found for fuel type"));
        extend_persistent_ttl(&env, &price_key);
        extend_instance_ttl(&env);

        price
    }

    /// Rotate the oracle public key. Only the designated admin may do this.
    pub fn set_oracle_pubkey(env: Env, admin: Address, new_pubkey: BytesN<32>) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(
            admin == stored_admin,
            "Only admin can rotate the oracle public key"
        );
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::OraclePubKey, &new_pubkey);
        extend_instance_ttl(&env);
    }

    pub fn get_oracle_pubkey(env: Env) -> BytesN<32> {
        let pubkey = env
            .storage()
            .instance()
            .get(&DataKey::OraclePubKey)
            .unwrap_or_else(|| panic!("Oracle not initialized"));
        extend_instance_ttl(&env);

        pubkey
    }
}

#[cfg(test)]
mod test;
