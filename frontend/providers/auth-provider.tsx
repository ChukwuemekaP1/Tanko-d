"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  connectWallet,
  disconnectWallet,
  restoreWalletSession,
  signWalletTransaction,
} from "@/lib/wallet/stellar-wallet-service";
import {
  STORAGE_KEYS,
  FREIGHTER_WALLET,
  type WalletType,
} from "@/lib/wallet/types";

export type UserRole = "CONDUCTOR" | "JEFE" | null;

function parseStoredWalletType(raw: string | null): WalletType | null {
  if (
    raw === "freighter" ||
    raw === "albedo" ||
    raw === "wallet_connect"
  ) {
    return raw;
  }
  return null;
}

function walletLabel(walletType: WalletType | null): string {
  switch (walletType) {
    case "freighter":
      return "Freighter";
    case "albedo":
      return "Albedo";
    case "wallet_connect":
      return "WalletConnect";
    default:
      return "Stellar";
  }
}

interface AuthState {
  address: string | null;
  walletType: WalletType | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  role: UserRole;
  userId: string | null;
}

interface AuthContextType extends AuthState {
  /** Unified alias for `address` (issue #31) */
  walletAddress: string | null;
  setRole: (role: UserRole) => void;
  setUserId: (id: string | null) => void;
  connectWithWallet: (walletType: WalletType) => Promise<void>;
  /** @deprecated Prefer connectWithWallet; defaults to Freighter */
  connect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  disconnect: () => Promise<void>;
  walletLabel: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    address: null,
    walletType: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    role: null,
    userId: null,
  });

  const persistSession = useCallback(
    (address: string, walletType: WalletType) => {
      localStorage.setItem(STORAGE_KEYS.ADDRESS, address);
      localStorage.setItem(STORAGE_KEYS.WALLET_TYPE, walletType);
    },
    [],
  );

  const clearWalletSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.WALLET_TYPE);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
  }, []);

  useEffect(() => {
    async function restore() {
      const storedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS);
      const storedWalletType = parseStoredWalletType(
        localStorage.getItem(STORAGE_KEYS.WALLET_TYPE),
      );
      const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole;
      const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (!storedAddress) {
        return;
      }

      if (storedWalletType) {
        const liveAddress = await restoreWalletSession(storedWalletType);
        if (liveAddress) {
          persistSession(liveAddress, storedWalletType);
          setState({
            address: liveAddress,
            walletType: storedWalletType,
            isConnected: true,
            isConnecting: false,
            error: null,
            role: storedRole,
            userId: storedUserId,
          });
          return;
        }
      }

      // Fallback: show last known address until user reconnects or disconnects
      setState({
        address: storedAddress,
        walletType: storedWalletType,
        isConnected: true,
        isConnecting: false,
        error: null,
        role: storedRole,
        userId: storedUserId,
      });
    }

    restore().catch((err) => {
      console.error("[Tanko] Wallet restore error:", err);
    });
  }, [persistSession]);

  const connectWithWallet = useCallback(
    async (walletType: WalletType) => {
      setState((prev) => ({ ...prev, isConnecting: true, error: null }));
      try {
        const address = await connectWallet(walletType);
        persistSession(address, walletType);
        setState((prev) => ({
          ...prev,
          address,
          walletType,
          isConnected: true,
          isConnecting: false,
          error: null,
        }));
        console.log(
          `[Tanko] ✅ ${walletLabel(walletType)} connected: ${address}`,
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not connect. Unlock your wallet and try again.";
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: message,
        }));
      }
    },
    [persistSession],
  );

  const connect = useCallback(async () => {
    await connectWithWallet(FREIGHTER_WALLET);
  }, [connectWithWallet]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (!state.address) {
        throw new Error("No wallet connected.");
      }
      try {
        return await signWalletTransaction(xdr, state.address);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Transaction signing failed.";
        setState((prev) => ({ ...prev, error: message }));
        throw err;
      }
    },
    [state.address],
  );

  const disconnect = useCallback(async () => {
    await disconnectWallet();
    clearWalletSession();
    setState({
      address: null,
      walletType: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      role: null,
      userId: null,
    });
    console.log("[Tanko] Wallet disconnected");
    if (typeof window !== "undefined") {
      window.location.href = "/connect";
    }
  }, [clearWalletSession]);

  const setRole = useCallback((role: UserRole) => {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
    setState((prev) => ({ ...prev, role }));
  }, []);

  const setUserId = useCallback((userId: string | null) => {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    }
    setState((prev) => ({ ...prev, userId }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        walletAddress: state.address,
        connectWithWallet,
        connect,
        signTransaction,
        disconnect,
        setRole,
        setUserId,
        walletLabel: walletLabel(state.walletType),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
