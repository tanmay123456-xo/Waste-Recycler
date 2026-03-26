import { useState, useEffect, useCallback } from "react";
import { useUpdateWalletAddress, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface MetaMaskState {
  isInstalled: boolean;
  isConnecting: boolean;
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useMetaMask(autoSave = true): MetaMaskState {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateWallet = useUpdateWalletAddress();
  const queryClient = useQueryClient();

  const isInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  const saveWallet = useCallback(
    (address: string) => {
      if (!autoSave) return;
      updateWallet.mutate(
        { data: { walletAddress: address } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
          },
        }
      );
    },
    [autoSave, updateWallet, queryClient]
  );

  useEffect(() => {
    if (!isInstalled) return;

    window.ethereum!.request({ method: "eth_accounts" }).then((accounts) => {
      const list = accounts as string[];
      if (list.length > 0) {
        setAccount(list[0]);
      }
    });

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      if (list.length === 0) {
        setAccount(null);
      } else {
        setAccount(list[0]);
      }
    };

    window.ethereum!.on("accountsChanged", handleAccountsChanged);
    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [isInstalled]);

  const connect = useCallback(async () => {
    if (!isInstalled) {
      setError("MetaMask is not installed. Please install it from metamask.io");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum!.request({
        method: "eth_requestAccounts",
      })) as string[];
      const address = accounts[0];
      setAccount(address);
      saveWallet(address);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection rejected";
      setError(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [isInstalled, saveWallet]);

  const disconnect = useCallback(() => {
    setAccount(null);
  }, []);

  return { isInstalled, isConnecting, account, connect, disconnect, error };
}
