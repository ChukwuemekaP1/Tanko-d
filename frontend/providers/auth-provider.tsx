"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type UserRole = "CONDUCTOR" | "JEFE" | null;

interface AuthState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  freighterInstalled: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  userId: string | null;
  setUserId: (id: string | null) => void;
}

interface AuthContextType extends AuthState {
  connect: () => Promise<void>;
  disconnect: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ADDRESS: "tanko_stellar_address",
  ROLE: "tanko_user_role",
  USER_ID: "tanko_user_id",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    error: null,
    freighterInstalled: false,
    role: null,
    userId: null,
    setRole: (role: UserRole) => setState(prev => ({ ...prev, role })),
    setUserId: (id: string | null) => setState(prev => ({ ...prev, userId: id })),
  });

  useEffect(() => {
    async function restore() {
      try {
        const freighter = await import("@stellar/freighter-api");

        const { isConnected } = await freighter.isConnected();
        const storedAddress = localStorage.getItem(STORAGE_KEYS.ADDRESS);
        const storedRole = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole;
        const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

        if (!isConnected) {
          if (storedAddress) {
            setState((prev) => ({
              ...prev,
              address: storedAddress,
              isConnected: true,
              freighterInstalled: false,
              role: storedRole,
              userId: storedUserId,
              setRole: prev.setRole,
              setUserId: prev.setUserId,
            }));
          }
          return;
        }

        setState((prev) => ({ ...prev, freighterInstalled: true }));

        const { isAllowed } = await freighter.isAllowed();
        if (isAllowed) {
          const { address, error } = await freighter.getAddress();
          if (!error && address) {
            localStorage.setItem(STORAGE_KEYS.ADDRESS, address);
            setState((prev) => ({
              address,
              isConnected: true,
              isConnecting: false,
              error: null,
              freighterInstalled: true,
              role: storedRole,
              userId: storedUserId,
              setRole: prev.setRole,
              setUserId: prev.setUserId,
            }));
          }
        } else if (storedAddress) {
          setState((prev) => ({
            ...prev,
            address: storedAddress,
            isConnected: true,
            freighterInstalled: true,
            role: storedRole,
            userId: storedUserId,
            setRole: prev.setRole,
            setUserId: prev.setUserId,
          }));
        }
      } catch (err) {
        console.error("[Tanko] Freighter init error:", err);
      }
    }

    restore();
  }, []);

  const connect = async () => {
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const freighter = await import("@stellar/freighter-api");

      const { isConnected } = await freighter.isConnected();
      if (!isConnected) {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          freighterInstalled: false,
          error:
            "Freighter is not installed. Install it at freighter.app and reload the page.",
          setRole: prev.setRole,
          setUserId: prev.setUserId,
        }));
        return;
      }

      const { address, error } = await freighter.requestAccess();

      if (error) {
        setState((prev) => ({
          ...prev,
          isConnecting: false,
          error: `Freighter denied access: ${error}`,
          setRole: prev.setRole,
          setUserId: prev.setUserId,
        }));
        return;
      }

      if (address) {
        localStorage.setItem(STORAGE_KEYS.ADDRESS, address);
        setState((prev) => ({
          address,
          isConnected: true,
          isConnecting: false,
          error: null,
          freighterInstalled: true,
          role: prev.role,
          userId: prev.userId,
          setRole: prev.setRole,
          setUserId: prev.setUserId,
        }));
        console.log(`[Tanko] ✅ Freighter connected: ${address}`);
      }
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error:
          err?.message || "Connection error. Make sure Freighter is unlocked.",
        setRole: prev.setRole,
        setUserId: prev.setUserId,
      }));
    }
  };

  const disconnect = () => {
    localStorage.removeItem(STORAGE_KEYS.ADDRESS);
    localStorage.removeItem(STORAGE_KEYS.ROLE);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    setState((prev) => ({
      ...prev,
      address: null,
      isConnected: false,
      isConnecting: false,
      error: null,
      role: null,
      userId: null,
      setRole: prev.setRole,
      setUserId: prev.setUserId,
    }));
    console.log("[Tanko] Wallet disconnected");
  };

  const setRole = (role: UserRole) => {
    if (role) {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ROLE);
    }
    setState((prev) => ({ ...prev, role }));
  };

  const setUserId = (userId: string | null) => {
    if (userId) {
      localStorage.setItem(STORAGE_KEYS.USER_ID, userId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER_ID);
    }
    setState((prev) => ({ ...prev, userId }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, connect, disconnect, setRole, setUserId }}
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
