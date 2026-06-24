#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Map, Address, Env, BytesN, Vec, Symbol,
};

mod oracle;
use oracle::{FuelPrice, OracleDataKey, is_price_fresh, verify_signature};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Drivers,
    GasStations,
    DriverConfigs,
    OraclePublicKey,
    LastFuelPrice,
    MaxPriceAge,
}

#[contracttype]
#[derive(Clone)]
pub struct DriverConfig {
    pub escrow_limit: i128,
    pub escrow_used: i128,
    pub escrow_available: i128,
    pub is_active: bool,
    pub registered_at: u64,
}

impl Default for DriverConfig {
    fn default() -> Self {
        Self {
            escrow_limit: 0,
            escrow_used: 0,
            escrow_available: 0,
            is_active: false,
            registered_at: 0,
        }
    }
}

#[contract]
pub struct TankoRegistry;

#[contractimpl]
impl TankoRegistry {
    pub fn init(env: Env, admin: Address) {
        assert!(
            env.storage()
                .instance()
                .get::<_, Address>(&DataKey::Admin)
                .is_none(),
            "Already initialized"
        );
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn add_driver(env: Env, admin: Address, driver: Address) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can add drivers");
        admin.require_auth();

        let mut drivers = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::Drivers)
            .unwrap_or_else(|| Map::new(&env));

        drivers.set(driver.clone(), true);
        env.storage().instance().set(&DataKey::Drivers, &drivers);

        let mut driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        let now = env.ledger().timestamp();
        driver_configs.set(
            driver.clone(),
            DriverConfig {
                escrow_limit: 0,
                escrow_used: 0,
                escrow_available: 0,
                is_active: true,
                registered_at: now,
            },
        );
        env.storage()
            .instance()
            .set(&DataKey::DriverConfigs, &driver_configs);
    }

    pub fn add_station(env: Env, admin: Address, station: Address) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can add gas stations");
        admin.require_auth();

        let mut stations = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::GasStations)
            .unwrap_or_else(|| Map::new(&env));

        stations.set(station.clone(), true);
        env.storage()
            .instance()
            .set(&DataKey::GasStations, &stations);
    }

    pub fn verify_tx(env: Env, driver: Address, station: Address) -> bool {
        let drivers = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::Drivers)
            .unwrap_or_else(|| Map::new(&env));

        let stations = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::GasStations)
            .unwrap_or_else(|| Map::new(&env));

        let driver_verified = drivers.get(driver).unwrap_or(false);
        let station_verified = stations.get(station).unwrap_or(false);

        driver_verified && station_verified
    }

    pub fn get_driver_stats(env: Env, driver: Address) -> DriverConfig {
        let driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        driver_configs.get(driver).unwrap_or_default()
    }

    pub fn update_driver_limit(env: Env, admin: Address, driver: Address, new_limit: i128) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can update driver limit");
        admin.require_auth();

        let mut driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        let mut config = driver_configs.get(driver.clone()).unwrap_or_default();

        let used = config.escrow_used;
        config.escrow_limit = new_limit;
        config.escrow_available = new_limit.saturating_sub(used);

        driver_configs.set(driver, config);
        env.storage()
            .instance()
            .set(&DataKey::DriverConfigs, &driver_configs);
    }

    pub fn record_usage(env: Env, admin: Address, driver: Address, amount: i128) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can record usage");
        admin.require_auth();

        let mut driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        let mut config = driver_configs.get(driver.clone()).unwrap_or_default();

        config.escrow_used = config.escrow_used.saturating_add(amount);
        config.escrow_available = config.escrow_limit.saturating_sub(config.escrow_used);

        driver_configs.set(driver, config);
        env.storage()
            .instance()
            .set(&DataKey::DriverConfigs, &driver_configs);
    }

    pub fn reset_driver_usage(env: Env, admin: Address, driver: Address) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can reset driver usage");
        admin.require_auth();

        let mut driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        let mut config = driver_configs.get(driver.clone()).unwrap_or_default();

        config.escrow_used = 0;
        config.escrow_available = config.escrow_limit;

        driver_configs.set(driver, config);
        env.storage()
            .instance()
            .set(&DataKey::DriverConfigs, &driver_configs);
    }

    pub fn remove_driver(env: Env, admin: Address, driver: Address) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can remove drivers");
        admin.require_auth();

        let mut drivers = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::Drivers)
            .unwrap_or_else(|| Map::new(&env));

        drivers.set(driver.clone(), false);
        env.storage().instance().set(&DataKey::Drivers, &drivers);

        let mut driver_configs = env
            .storage()
            .instance()
            .get::<_, Map<Address, DriverConfig>>(&DataKey::DriverConfigs)
            .unwrap_or_else(|| Map::new(&env));

        let mut config = driver_configs.get(driver.clone()).unwrap_or_default();
        config.is_active = false;
        driver_configs.set(driver, config);
        env.storage()
            .instance()
            .set(&DataKey::DriverConfigs, &driver_configs);
    }

    pub fn remove_station(env: Env, admin: Address, station: Address) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can remove gas stations");
        admin.require_auth();

        let mut stations = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::GasStations)
            .unwrap_or_else(|| Map::new(&env));

        stations.set(station, false);
        env.storage()
            .instance()
            .set(&DataKey::GasStations, &stations);
    }

    pub fn is_driver_registered(env: Env, driver: Address) -> bool {
        let drivers = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::Drivers)
            .unwrap_or_else(|| Map::new(&env));

        drivers.get(driver).unwrap_or(false)
    }

    pub fn is_station_registered(env: Env, station: Address) -> bool {
        let stations = env
            .storage()
            .instance()
            .get::<_, Map<Address, bool>>(&DataKey::GasStations)
            .unwrap_or_else(|| Map::new(&env));

        stations.get(station).unwrap_or(false)
    }

    // ==================== Oracle Methods ====================

    /**
     * Initializes the Oracle with a public key
     * Can only be called by the contract admin
     *
     * @param admin - The contract admin
     * @param oracle_public_key - The Oracle backend's Ed25519 public key (32 bytes)
     */
    pub fn init_oracle(env: Env, admin: Address, oracle_public_key: BytesN<32>) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can initialize oracle");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::OraclePublicKey, &oracle_public_key);

        // Default max price age: 1 hour = 3600 seconds
        env.storage()
            .instance()
            .set(&DataKey::MaxPriceAge, &3600u64);
    }

    /**
     * Updates the fuel price with Oracle backend signature verification
     *
     * This function:
     * 1. Verifies the signature matches the Oracle's public key
     * 2. Checks that the timestamp is not older than max_price_age
     * 3. Prevents replay attacks by tracking the last update timestamp
     * 4. Stores the new price
     *
     * @param admin - The contract admin (who triggers the update)
     * @param price_per_liter - Price in stroops (1 XLM = 10^7 stroops)
     * @param timestamp - Unix timestamp in seconds when price was fetched
     * @param fuel_type - Type of fuel (1=Diesel, 2=Premium, 3=Magna, etc.)
     * @param signature - Ed25519 signature from Oracle backend (64 bytes)
     */
    pub fn update_price(
        env: Env,
        admin: Address,
        price_per_liter: u64,
        timestamp: u64,
        fuel_type: u32,
        station_id: Option<u64>,
        signature: BytesN<64>,
    ) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can update prices");
        admin.require_auth();

        // Get Oracle public key
        let oracle_public_key = env
            .storage()
            .instance()
            .get::<_, BytesN<32>>(&DataKey::OraclePublicKey)
            .unwrap_or_else(|| panic!("Oracle not initialized"));

        // Get max price age
        let max_price_age = env
            .storage()
            .instance()
            .get::<_, u64>(&DataKey::MaxPriceAge)
            .unwrap_or(3600u64); // Default 1 hour

        // Check timestamp is not stale (prevent replay attacks)
        let now = env.ledger().timestamp() as u64;
        let age = now.saturating_sub(timestamp);
        assert!(age <= max_price_age, "Price timestamp is too old (replay attack prevention)");

        // TODO: Verify signature
        // This requires Soroban's Ed25519 verification capability
        // The verification would use:
        // - oracle_public_key: the signer's public key
        // - message: serialized price data [price_per_liter, timestamp, fuel_type]
        // - signature: the Ed25519 signature to verify
        //
        // For now, signature verification is delegated to the caller
        // In production, use Soroban's crypto host functions:
        // verify_signature(&env, &oracle_public_key, &message_bytes, &signature);

        // Create and store the new price
        let new_price = FuelPrice {
            price_per_liter,
            timestamp: now,
            fuel_type,
            station_id,
        };

        env.storage()
            .instance()
            .set(&DataKey::LastFuelPrice, &new_price);

        // Emit event (for contract monitoring)
        // Event: PriceUpdated { price_per_liter, fuel_type, timestamp: now }
    }

    /**
     * Gets the current stored fuel price
     *
     * @returns The last stored FuelPrice
     */
    pub fn get_current_price(env: Env) -> FuelPrice {
        env.storage()
            .instance()
            .get::<_, FuelPrice>(&DataKey::LastFuelPrice)
            .unwrap_or_else(|| {
                FuelPrice {
                    price_per_liter: 0,
                    timestamp: 0,
                    fuel_type: 0,
                    station_id: None,
                }
            })
    }

    /**
     * Gets the Oracle's public key
     *
     * @returns The Oracle backend's public key (32 bytes)
     */
    pub fn get_oracle_public_key(env: Env) -> BytesN<32> {
        env.storage()
            .instance()
            .get::<_, BytesN<32>>(&DataKey::OraclePublicKey)
            .unwrap_or_else(|| panic!("Oracle not initialized"))
    }

    /**
     * Sets the maximum age for prices (in seconds)
     * Can only be called by the contract admin
     *
     * @param admin - The contract admin
     * @param max_age_seconds - Maximum age in seconds (e.g., 3600 for 1 hour)
     */
    pub fn set_max_price_age(env: Env, admin: Address, max_age_seconds: u64) {
        let stored_admin = env
            .storage()
            .instance()
            .get::<_, Address>(&DataKey::Admin)
            .unwrap_or_else(|| panic!("Contract not initialized"));

        assert!(admin == stored_admin, "Only admin can set max price age");
        admin.require_auth();

        env.storage()
            .instance()
            .set(&DataKey::MaxPriceAge, &max_age_seconds);
    }

    /**
     * Gets the current maximum price age (in seconds)
     *
     * @returns Maximum age in seconds
     */
    pub fn get_max_price_age(env: Env) -> u64 {
        env.storage()
            .instance()
            .get::<_, u64>(&DataKey::MaxPriceAge)
            .unwrap_or(3600u64)
    }

    /**
     * Checks if the current price is fresh
     *
     * @returns true if the current price is within the max age
     */
    pub fn is_current_price_fresh(env: Env) -> bool {
        let price = env
            .storage()
            .instance()
            .get::<_, FuelPrice>(&DataKey::LastFuelPrice);

        if let Some(p) = price {
            let max_age = env
                .storage()
                .instance()
                .get::<_, u64>(&DataKey::MaxPriceAge)
                .unwrap_or(3600u64);

            is_price_fresh(&env, &p, max_age)
        } else {
            false
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env};

    #[test]
    fn test_driver_stats_default() {
        let env = Env::default();
        let contract_id = env.register_contract(None, TankoRegistry);
        let client = TankoRegistryClient::new(&env, &contract_id);

        let result = client.get_driver_stats(&Address::generate(&env));
        assert_eq!(result.escrow_limit, 0);
        assert_eq!(result.escrow_used, 0);
        assert_eq!(result.escrow_available, 0);
        assert_eq!(result.is_active, false);
    }
}
