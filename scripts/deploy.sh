#!/bin/bash
set -e

echo "🚀 Starting Tanko Registry deployment to Testnet..."

# Ensure we are running this from the root of the project
if [ ! -d "contracts/tanko-registry" ]; then
  echo "❌ Error: Please run this script from the root 'Tanko-d' directory."
  exit 1
fi

cd contracts/tanko-registry

echo "📦 Building the contract..."
stellar contract build

# Check if admin key exists locally; if not, generate it
if ! stellar keys address admin > /dev/null 2>&1; then
    echo "🔑 Generating new 'admin' keypair..."
    stellar keys generate --global admin --network testnet
else
    echo "✅ 'admin' keypair already exists locally."
fi

# Always ensure it is funded on the testnet (safe to run multiple times)
echo "💰 Ensuring 'admin' account is funded on testnet..."
stellar keys fund admin --network testnet || true

ADMIN_ADDRESS=$(stellar keys address admin)
echo "👤 Admin Address: $ADMIN_ADDRESS"

# Determine the correct WASM path based on the compiler target output
if [ -f "target/wasm32v1-none/release/tanko_registry.wasm" ]; then
    WASM_PATH="target/wasm32v1-none/release/tanko_registry.wasm"
elif [ -f "target/wasm32-unknown-unknown/release/tanko_registry.wasm" ]; then
    WASM_PATH="target/wasm32-unknown-unknown/release/tanko_registry.wasm"
else
    echo "❌ Error: Could not find the compiled .wasm file. Build might have failed."
    exit 1
fi

echo "🚢 Deploying contract to testnet using $WASM_PATH..."
CONTRACT_ID=$(stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source admin \
  --network testnet)

echo "✅ Contract deployed successfully!"
echo "📝 Contract ID: $CONTRACT_ID"

echo "⚙️ Initializing the contract..."
stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source admin \
  --network testnet \
  -- init \
  --admin "$ADMIN_ADDRESS"

echo "✅ Contract initialized successfully!"

echo ""
echo "---------------------------------------------------"
echo "🎉 Deployment Complete!"
echo "Please add the following to your .env files (e.g., backend/.env and .env.example):"
echo ""
echo "SOROBAN_CONTRACT_ID=\"$CONTRACT_ID\""
echo "SOROBAN_RPC_URL=\"https://soroban-testnet.stellar.org:443\""
echo "SOROBAN_NETWORK_PASSPHRASE=\"Test SDF Network ; September 2015\""
echo "---------------------------------------------------"