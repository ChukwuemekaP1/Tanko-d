# Tanko Registry: Soroban Testnet Deployment Runbook

This document outlines how maintainers can reproduce the deployment of the `tanko-registry` smart contract to the Stellar Testnet and how to configure the backend to use it.

## Prerequisites
- Rust toolchain (`rustup target add wasm32-unknown-unknown` / `wasm32v1-none`)
- Latest Stellar CLI (`cargo install --force --locked stellar-cli`)
- A configured testnet environment:
  ```bash
  stellar network add \
    --global testnet \
    --rpc-url https://soroban-testnet.stellar.org:443 \
    --network-passphrase "Test SDF Network ; September 2015"
  ```

## Automated Deployment (Recommended)

You can deploy and initialize the contract automatically using the provided bash script. From the root of the `Tanko-d` repository, run:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

What this script does:

1. Compiles the contract to WebAssembly with overflow checks enabled.
2. Generates a new `admin` keypair if one doesn't exist.
3. Funds the `admin` account on the Testnet via Friendbot.
4. Deploys the `.wasm` binary to the testnet.
5. Invokes the `init` function to set the `admin` address.
6. Outputs the `CONTRACT_ID`.

## Backend Configuration

Once deployed, copy the `CONTRACT_ID` output by the script and update the backend environment variables. The `stellar.service.ts` expects these values to resolve contract invocations:

```env
SOROBAN_CONTRACT_ID="C..."
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org:443"
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
```

## Verification / Validation

To verify the contract is live and readable, you can perform a read-only RPC call using the CLI. For example, querying a random address to see if it is registered as a driver:

```bash
stellar contract invoke \
  --id <YOUR_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- is_driver_registered \
  --driver GDVJVRY2SHFZ5QNED5665XPB2AI7LIFMCRH4KX4VFMED7NMWXKOTJYOU
```

Expected Output: `false`