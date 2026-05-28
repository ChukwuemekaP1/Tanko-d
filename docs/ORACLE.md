# Tanko Fuel Price Oracle Implementation

## Overview

The Tanko Fuel Price Oracle is a cryptographically secured system that provides real-time fuel prices to the Soroban smart contracts and frontend applications. It ensures that escrow allocations reflect accurate market rates by using Ed25519 signatures to verify price authenticity.

### Key Features

- **Real-Time Price Feeds**: Fetches current fuel prices from reliable data sources
- **Cryptographic Verification**: Ed25519 signature verification ensures price integrity
- **Replay Attack Prevention**: Timestamp validation prevents stale price exploitation
- **Multi-Fuel Support**: Handles multiple fuel types (Diesel, Premium, Magna)
- **Regional Pricing**: Optional station-specific price overrides
- **Automatic Updates**: Scheduled cron jobs keep prices fresh
- **Smart Contract Integration**: Prices directly accessible by Soroban contracts

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│  Driver App → FuelRequestForm → useOraclePrice Hook         │
└────────────────────────────┬────────────────────────────────┘
                             │ (HTTP)
┌────────────────────────────▼────────────────────────────────┐
│              BACKEND SERVICES (Node.js/Express)             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Oracle Service                                       │   │
│  │ ├─ oracleService: Price fetching & signing          │   │
│  │ ├─ oracleCronService: Scheduled updates             │   │
│  │ └─ oracleController: API endpoints                  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │ (Soroban RPC)
┌────────────────────────────▼────────────────────────────────┐
│         SOROBAN SMART CONTRACTS (Rust)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ TankoRegistry Contract                               │   │
│  │ ├─ init_oracle(publicKey)                            │   │
│  │ ├─ update_price(price, timestamp, signature)         │   │
│  │ ├─ get_current_price() → FuelPrice                   │   │
│  │ └─ is_current_price_fresh() → bool                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│         STELLAR BLOCKCHAIN (Testnet/Public)                 │
│  Account Storage, Transaction Ledger, Data Validation       │
└─────────────────────────────────────────────────────────────┘
```

## Installation & Setup

### 1. Backend Configuration

#### Environment Variables

Create or update `.env` in the backend root directory:

```bash
# Oracle Configuration
ORACLE_ENABLED=true
ORACLE_PUBLIC_KEY=GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Your Oracle's public key
ORACLE_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  # Your Oracle's secret key
ORACLE_CRON="0 * * * *"  # Every hour (cron expression)
ORACLE_MAX_PRICE_AGE=3600000  # 1 hour in milliseconds

# Price API Configuration
PRICE_API_URL=https://api.example.com/prices  # Your price data source
PRICE_API_KEY=your-api-key-here

# Stellar Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

#### Generate Oracle Keypair

If you don't have an Oracle keypair, generate one:

```bash
# In backend directory
npm run dev
# Then in another terminal:
curl -X POST http://localhost:3001/api/v1/helper/generate-keypair
```

Save the keypair securely and update `.env` with the values.

### 2. Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../contracts/tanko-registry
cargo build --target wasm32-unknown-unknown --release
```

### 3. Database Migrations

```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 4. Deploy Contract (Optional - v1 uses existing)

For v1, the contract deployment happens manually. See [Soroban Deployment Guide](../docs/deployment.md).

### 5. Start Services

```bash
# Backend
cd backend
npm run dev  # Starts Oracle cron service automatically

# Frontend (in another terminal)
cd frontend
npm run dev
```

## API Endpoints

### Public Endpoints

#### Get All Current Prices

```http
GET /api/v1/oracle/prices

Response:
{
  "success": true,
  "data": {
    "prices": [
      {
        "payload": {
          "fuelType": "Diesel",
          "pricePerLiter": 25.0,
          "timestamp": 1234567890000,
          "stationId": null
        },
        "signature": "abc123...",
        "oraclePublicKey": "GXXXXXXX..."
      }
    ],
    "oraclePublicKey": "GXXXXXXX...",
    "fetchedAt": "2025-05-27T10:30:00Z",
    "maxPriceAge": 3600000
  }
}
```

#### Get Price by Fuel Type

```http
GET /api/v1/oracle/prices/:fuelType

Example: GET /api/v1/oracle/prices/Diesel

Response:
{
  "success": true,
  "data": {
    "price": {
      "payload": {
        "fuelType": "Diesel",
        "pricePerLiter": 25.0,
        "timestamp": 1234567890000,
        "stationId": null
      },
      "signature": "abc123...",
      "oraclePublicKey": "GXXXXXXX..."
    },
    "oraclePublicKey": "GXXXXXXX...",
    "fetchedAt": "2025-05-27T10:30:00Z"
  }
}
```

#### Get Oracle Status

```http
GET /api/v1/oracle/status

Response:
{
  "success": true,
  "data": {
    "enabled": true,
    "oraclePublicKey": "GXXXXXXX...",
    "maxPriceAge": 3600000
  }
}
```

### Admin Endpoints

#### Verify Signed Price

```http
POST /api/v1/oracle/verify

Request Body:
{
  "price": {
    "payload": {
      "fuelType": "Diesel",
      "pricePerLiter": 25.0,
      "timestamp": 1234567890000
    },
    "signature": "abc123...",
    "oraclePublicKey": "GXXXXXXX..."
  }
}

Response:
{
  "success": true,
  "data": {
    "isValid": true,
    "price": { ... },
    "message": "Signature is valid"
  }
}
```

#### Manually Update Prices

```http
POST /api/v1/oracle/update

Response:
{
  "success": true,
  "data": {
    "prices": [ ... ],
    "message": "Updated 3 prices",
    "fetchedAt": "2025-05-27T10:30:00Z"
  }
}
```

## Frontend Integration

### Using the useOraclePrice Hook

```typescript
import { useOraclePrice } from '@/hooks/useOraclePrice'

export function MyComponent() {
  const {
    prices,          // Array of signed prices
    loading,         // Loading state
    error,           // Error message
    getPrice,        // Get price payload by fuel type
    getPricePerLiter, // Get price per liter number
    calculateFuelCost, // Calculate total cost
    refetch,         // Manual refetch
  } = useOraclePrice()

  if (loading) return <div>Loading prices...</div>
  if (error) return <div>Error: {error}</div>

  const dieselPrice = getPricePerLiter('Diesel')
  const cost = calculateFuelCost(50, 'Diesel') // 50 liters

  return (
    <div>
      <p>Diesel: ${dieselPrice}/L</p>
      <p>Cost for 50L: ${cost}</p>
      <button onClick={refetch}>Refresh Prices</button>
    </div>
  )
}
```

### Using the FuelRequestForm Component

```typescript
import FuelRequestForm from '@/components/forms/FuelRequestForm'

export function DriverFuelRequest() {
  const [showForm, setShowForm] = useState(false)

  return (
    <>
      {showForm && (
        <FuelRequestForm
          driverPubKey="GXXXXX..."
          onSuccess={() => {
            setShowForm(false)
            // Refresh fuel requests list
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <button onClick={() => setShowForm(true)}>Request Fuel</button>
    </>
  )
}
```

### Standalone Functions

```typescript
import { fetchFuelPrice, fetchOracleStatus, verifySignedPrice } from '@/hooks/useOraclePrice'

// Get single fuel price
const price = await fetchFuelPrice('Diesel')

// Get oracle status
const status = await fetchOracleStatus()

// Verify a signed price
const isValid = await verifySignedPrice(signedPrice)
```

## Smart Contract Integration

### Initialize Oracle

```rust
let env = Env::default();
let admin = Address::generate(&env);

// Initialize contract
TankoRegistry::init(&env, admin);

// Initialize oracle with backend public key
let oracle_public_key = BytesN::<32>::from_array(&env, &[1u8; 32]); // Your oracle's public key
TankoRegistry::init_oracle(&env, admin, oracle_public_key);
```

### Update Price from Backend

```rust
let price_per_liter = 25_000_000u64; // $25/liter in stroops
let timestamp = env.ledger().timestamp() as u64;
let fuel_type = 1u32; // 1=Diesel, 2=Premium, 3=Magna
let signature = BytesN::<64>::from_array(&env, &[0u8; 64]); // From Oracle

TankoRegistry::update_price(
    &env,
    &admin,
    price_per_liter,
    timestamp,
    fuel_type,
    &None, // No station ID
    &signature,
);
```

### Get Current Price

```rust
let current_price: FuelPrice = TankoRegistry::get_current_price(&env);
println!("Current price: ${}", current_price.price_per_liter as f64 / 1e7);
```

### Check Price Freshness

```rust
let is_fresh = TankoRegistry::is_current_price_fresh(&env);
if !is_fresh {
    panic!("Price data is stale, please update");
}
```

## Security Considerations

### 1. Private Key Management

**CRITICAL**: Never commit private keys to version control.

```bash
# Good: Use environment variables
export ORACLE_SECRET_KEY="S..."

# Better: Use a key management service
# AWS Secrets Manager, HashiCorp Vault, etc.
```

### 2. Signature Verification

Prices are signed using Ed25519, ensuring:
- **Authenticity**: Only the Oracle can create valid signatures
- **Non-repudiation**: The Oracle cannot deny signing a price
- **Integrity**: Any tampering with the price invalidates the signature

### 3. Replay Attack Prevention

The contract validates:
- **Timestamp**: Prices older than `max_price_age` are rejected
- **Contract Storage**: Previous price is compared against new update

```rust
// In contract: Price timestamp must be within 1 hour
let now = env.ledger().timestamp() as u64;
let age = now.saturating_sub(timestamp);
assert!(age <= max_price_age, "Price timestamp is too old");
```

### 4. Feed Validation

Always verify:
- ✅ Signature is valid
- ✅ Public key matches expected Oracle
- ✅ Price is within reasonable bounds
- ✅ Timestamp is recent
- ✅ Fuel type is recognized

### 5. Regional Pricing

Station-specific prices allow for:
- Different price per region/vendor
- Emergency price adjustments
- A/B testing price strategies

```typescript
const stationPrice = prices.find(p =>
  p.payload.fuelType === 'Diesel' &&
  p.payload.stationId === 42 // Pemex
)
```

## Testing

### Unit Tests (Rust)

```bash
cd contracts/tanko-registry

# Run all tests
cargo test

# Run specific test
cargo test test_oracle_price_update

# Run with output
cargo test -- --nocapture
```

### Unit Tests (Backend)

```bash
cd backend

# Run all tests
npm test

# Run oracle tests
npm test -- oracle

# Watch mode
npm test -- --watch
```

### Integration Tests

```bash
cd backend

# Run integration tests (requires testnet contract)
npm test -- oracle.integration.test

# With coverage
npm test -- --coverage
```

### Manual Testing

```bash
# 1. Start backend
cd backend && npm run dev

# 2. Fetch current prices
curl http://localhost:3001/api/v1/oracle/prices

# 3. Get specific fuel type
curl http://localhost:3001/api/v1/oracle/prices/Diesel

# 4. Verify price signature
curl -X POST http://localhost:3001/api/v1/oracle/verify \
  -H "Content-Type: application/json" \
  -d '{"price": {...}}'

# 5. Check oracle status
curl http://localhost:3001/api/v1/oracle/status
```

## Roadmap (v2+)

- [ ] **Decentralized Oracle Network**: Multiple Oracle nodes with consensus
- [ ] **Historical Price Data**: Store and retrieve price history
- [ ] **Price Aggregation**: Average prices from multiple sources
- [ ] **Dynamic Fee Adjustment**: Adjust escrow fees based on fuel prices
- [ ] **Regional Network**: Gas station network for hyperlocal pricing
- [ ] **ML Price Prediction**: Predict future fuel prices
- [ ] **Emergency Price Halt**: Circuit breaker for extreme price movements

## Troubleshooting

### Oracle Service Not Starting

```bash
# Check if Oracle keys are configured
echo $ORACLE_SECRET_KEY

# Check cron expression syntax
npm test -- oracle-cron-syntax

# Check backend logs
tail -f backend/logs/debug.log
```

### Prices Not Updating

```bash
# Manually trigger update
curl -X POST http://localhost:3001/api/v1/oracle/update

# Check cron job status
ps aux | grep "node\|npm"

# Verify API endpoint
curl http://localhost:3001/api/v1/oracle/status
```

### Signature Verification Failed

```bash
# Verify Oracle public key in contract matches backend
curl http://localhost:3001/api/v1/oracle/status
# Compare oraclePublicKey with contract's stored key

# Re-init Oracle if keys changed
npm run dev  # Will log Oracle public key on startup
```

### Price Too Old Error

```bash
# Increase max price age if prices update slowly
ORACLE_MAX_PRICE_AGE=7200000  # 2 hours instead of 1
npm run dev

# Or manually update prices
curl -X POST http://localhost:3001/api/v1/oracle/update
```

## Support & Feedback

For issues or feature requests:
- GitHub Issues: https://github.com/LangSharp/Tanko-d/issues
- Discussion: https://github.com/LangSharp/Tanko-d/discussions
- Documentation: See `./docs` directory

## References

- [Soroban Documentation](https://soroban.stellar.org)
- [Stellar Smart Contracts](https://developers.stellar.org/learn/smart-contracts)
- [Ed25519 Signatures](https://en.wikipedia.org/wiki/EdDSA)
- [Oracle Design Patterns](https://ethereum.org/en/developers/tutorials/oracle-patterns/)
