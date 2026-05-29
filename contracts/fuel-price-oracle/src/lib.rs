#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Bytes, BytesN, Env, Map, Symbol,
};

/// Maximum age of a price update (1 hour).
pub const MAX_PRICE_AGE_SECS: u64 = 3600;

/// Fixed-point scale for MXN (4 decimals): 24.00 → 240_000.
pub const MXN_SCALE: u64 = 10_000;

/// Fixed-point scale for USDC (7 decimals): 1.39 → 13_900_000.
pub const USDC_SCALE: u64 = 10_000_000;

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

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    OraclePubKey,
    Prices,
    LastTimestamps,
}

#[contract]
pub struct FuelPriceOracle;

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

    let last_timestamps = env
        .storage()
        .instance()
        .get::<_, Map<FuelType, u64>>(&DataKey::LastTimestamps)
        .unwrap_or_else(|| Map::new(env));

    if let Some(last_ts) = last_timestamps.get(fuel_type) {
        assert!(timestamp > last_ts, "Replay attack: stale timestamp");
    }
}

#[contractimpl]
impl FuelPriceOracle {
    /// Initialize oracle with authorized public key and seed prices (scaled fixed-point).
    pub fn init(
        env: Env,
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
                .get::<_, BytesN<32>>(&DataKey::OraclePubKey)
                .is_none(),
            "Already initialized"
        );

        env.storage()
            .instance()
            .set(&DataKey::OraclePubKey, &oracle_pubkey);

        let now = env.ledger().timestamp();
        let station = soroban_sdk::String::from_str(&env, "CRE-MX-SEED");

        let mut prices = Map::<FuelType, PriceData>::new(&env);
        let mut last_ts = Map::<FuelType, u64>::new(&env);

        let seeds = [
            (
                FuelType::Magna,
                seed_magna_mxn,
                seed_magna_usdc,
            ),
            (
                FuelType::Premium,
                seed_premium_mxn,
                seed_premium_usdc,
            ),
            (
                FuelType::Diesel,
                seed_diesel_mxn,
                seed_diesel_usdc,
            ),
        ];

        for (fuel_type, price_mxn, price_usdc) in seeds {
            prices.set(
                fuel_type,
                PriceData {
                    price_mxn,
                    price_usdc,
                    timestamp: now,
                    station_id: station.clone(),
                },
            );
            last_ts.set(fuel_type, now);
        }

        env.storage().instance().set(&DataKey::Prices, &prices);
        env.storage()
            .instance()
            .set(&DataKey::LastTimestamps, &last_ts);
    }

    /// Update certified price for a fuel type. Signature covers
    /// [fuel_type, price_mxn, price_usdc, timestamp, station_id].
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

        let mut prices = env
            .storage()
            .instance()
            .get::<_, Map<FuelType, PriceData>>(&DataKey::Prices)
            .unwrap_or_else(|| panic!("Oracle not initialized"));

        prices.set(
            fuel_type,
            PriceData {
                price_mxn,
                price_usdc,
                timestamp,
                station_id: station_id.clone(),
            },
        );
        env.storage().instance().set(&DataKey::Prices, &prices);

        let mut last_timestamps = env
            .storage()
            .instance()
            .get::<_, Map<FuelType, u64>>(&DataKey::LastTimestamps)
            .unwrap_or_else(|| Map::new(&env));
        last_timestamps.set(fuel_type, timestamp);
        env.storage()
            .instance()
            .set(&DataKey::LastTimestamps, &last_timestamps);
    }

    /// Simplified entry point per spec: updates MAGNA price using scaled values.
    pub fn update_price_simple(
        env: Env,
        price_mxn: u64,
        timestamp: u64,
        signature: BytesN<64>,
    ) {
        let prices = env
            .storage()
            .instance()
            .get::<_, Map<FuelType, PriceData>>(&DataKey::Prices)
            .unwrap_or_else(|| panic!("Oracle not initialized"));

        let current = prices
            .get(FuelType::Magna)
            .unwrap_or_else(|| panic!("Magna price not set"));

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

        let prices = env
            .storage()
            .instance()
            .get::<_, Map<FuelType, PriceData>>(&DataKey::Prices)
            .unwrap_or_else(|| panic!("Oracle not initialized"));

        prices
            .get(fuel_type)
            .unwrap_or_else(|| panic!("Price not found for fuel type"))
    }

    pub fn get_oracle_pubkey(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get(&DataKey::OraclePubKey)
            .unwrap_or_else(|| panic!("Oracle not initialized"))
    }
}

#[cfg(test)]
mod test;
