"use client";

import { getCoreProvider, isAvalancheAddress, normalizeAvalancheAddress } from "@/lib/wallet/core-wallet-service";

export const TANKO_AVALANCHE_ESCROW_ABI = [
  {
    type: "function",
    name: "createFuelEscrow",
    stateMutability: "payable",
    inputs: [
      { name: "driver", type: "address" },
      { name: "reference", type: "string" },
    ],
    outputs: [{ name: "escrowId", type: "uint256" }],
  },
  {
    type: "function",
    name: "releaseFuelEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "refundFuelEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "escrowId", type: "uint256" }],
    outputs: [],
  },
] as const;

const MASK_64 = (BigInt(1) << BigInt(64)) - BigInt(1);
const KECCAK_ROUND_CONSTANTS = [
  "0x0000000000000001", "0x0000000000008082", "0x800000000000808a", "0x8000000080008000",
  "0x000000000000808b", "0x0000000080000001", "0x8000000080008081", "0x8000000000008009",
  "0x000000000000008a", "0x0000000000000088", "0x0000000080008009", "0x000000008000000a",
  "0x000000008000808b", "0x800000000000008b", "0x8000000000008089", "0x8000000000008003",
  "0x8000000000008002", "0x8000000000000080", "0x000000000000800a", "0x800000008000000a",
  "0x8000000080008081", "0x8000000000008080", "0x0000000080000001", "0x8000000080008008",
].map((value) => BigInt(value));
const KECCAK_ROTATION = [
  [0, 36, 3, 41, 18],
  [1, 44, 10, 45, 2],
  [62, 6, 43, 15, 61],
  [28, 55, 25, 21, 56],
  [27, 20, 39, 8, 14],
];

function rotateLeft64(value: bigint, shift: number): bigint {
  if (shift === 0) {
    return value;
  }
  return ((value << BigInt(shift)) | (value >> BigInt(64 - shift))) & MASK_64;
}

function keccakF(state: bigint[]): void {
  for (const roundConstant of KECCAK_ROUND_CONSTANTS) {
    const c = new Array<bigint>(5);
    const d = new Array<bigint>(5);
    for (let x = 0; x < 5; x += 1) {
      c[x] = state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20];
    }
    for (let x = 0; x < 5; x += 1) {
      d[x] = c[(x + 4) % 5] ^ rotateLeft64(c[(x + 1) % 5], 1);
    }
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] = (state[x + 5 * y] ^ d[x]) & MASK_64;
      }
    }

    const b = new Array<bigint>(25);
    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        b[y + 5 * ((2 * x + 3 * y) % 5)] = rotateLeft64(
          state[x + 5 * y],
          KECCAK_ROTATION[x][y],
        );
      }
    }

    for (let x = 0; x < 5; x += 1) {
      for (let y = 0; y < 5; y += 1) {
        state[x + 5 * y] = (b[x + 5 * y] ^ ((~b[((x + 1) % 5) + 5 * y] & MASK_64) & b[((x + 2) % 5) + 5 * y])) & MASK_64;
      }
    }
    state[0] = (state[0] ^ roundConstant) & MASK_64;
  }
}

function keccak256(input: string): string {
  const rateInBytes = 136;
  const bytes = Array.from(new TextEncoder().encode(input));
  bytes.push(0x01);
  while (bytes.length % rateInBytes !== rateInBytes - 1) {
    bytes.push(0);
  }
  bytes.push(0x80);

  const state = new Array<bigint>(25).fill(BigInt(0));
  for (let offset = 0; offset < bytes.length; offset += rateInBytes) {
    for (let i = 0; i < rateInBytes / 8; i += 1) {
      let lane = BigInt(0);
      for (let byte = 0; byte < 8; byte += 1) {
        lane |= BigInt(bytes[offset + i * 8 + byte]) << BigInt(8 * byte);
      }
      state[i] ^= lane;
    }
    keccakF(state);
  }

  const output: number[] = [];
  for (let i = 0; output.length < 32; i += 1) {
    const lane = state[i];
    for (let byte = 0; byte < 8 && output.length < 32; byte += 1) {
      output.push(Number((lane >> BigInt(8 * byte)) & BigInt(0xff)));
    }
  }
  return output.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function selector(signature: string): string {
  return `0x${keccak256(signature).slice(0, 8)}`;
}

function padHex(value: string): string {
  return value.replace(/^0x/, "").padStart(64, "0");
}

function encodeAddress(address: string): string {
  if (!isAvalancheAddress(address)) {
    throw new Error("Invalid Avalanche C-Chain address.");
  }
  return padHex(normalizeAvalancheAddress(address));
}

function encodeUint(value: bigint | number): string {
  return BigInt(value).toString(16).padStart(64, "0");
}

function encodeString(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const paddedLength = Math.ceil(hex.length / 64) * 64;
  return encodeUint(bytes.length) + hex.padEnd(paddedLength, "0");
}

function getEscrowContractAddress(): string {
  const address = process.env.NEXT_PUBLIC_AVALANCHE_ESCROW_CONTRACT_ADDRESS;
  if (!address || !isAvalancheAddress(address)) {
    throw new Error("NEXT_PUBLIC_AVALANCHE_ESCROW_CONTRACT_ADDRESS is not configured.");
  }
  return normalizeAvalancheAddress(address);
}

export async function createFuelEscrowTx(params: {
  manager: string;
  driver: string;
  reference: string;
  valueWei: bigint | string;
}): Promise<string> {
  const provider = getCoreProvider();
  if (!provider) {
    throw new Error("Core Wallet is required to create Avalanche fuel escrow transactions.");
  }

  const referenceData = encodeString(params.reference);
  const data =
    selector("createFuelEscrow(address,string)") +
    encodeAddress(params.driver) +
    encodeUint(64).slice(0) +
    referenceData;

  return provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from: normalizeAvalancheAddress(params.manager),
        to: getEscrowContractAddress(),
        value: `0x${BigInt(params.valueWei).toString(16)}`,
        data,
      },
    ],
  });
}

export async function releaseFuelEscrowTx(manager: string, escrowId: bigint | number): Promise<string> {
  const provider = getCoreProvider();
  if (!provider) {
    throw new Error("Core Wallet is required to release Avalanche fuel escrows.");
  }

  return provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from: normalizeAvalancheAddress(manager),
        to: getEscrowContractAddress(),
        data: selector("releaseFuelEscrow(uint256)") + encodeUint(escrowId),
      },
    ],
  });
}

export async function refundFuelEscrowTx(manager: string, escrowId: bigint | number): Promise<string> {
  const provider = getCoreProvider();
  if (!provider) {
    throw new Error("Core Wallet is required to refund Avalanche fuel escrows.");
  }

  return provider.request<string>({
    method: "eth_sendTransaction",
    params: [
      {
        from: normalizeAvalancheAddress(manager),
        to: getEscrowContractAddress(),
        data: selector("refundFuelEscrow(uint256)") + encodeUint(escrowId),
      },
    ],
  });
}
