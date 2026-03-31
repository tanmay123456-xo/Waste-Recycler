import { useState, useEffect, useCallback } from "react";
import { useUpdateWalletAddress, getGetUserProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ensureSepoliaNetwork, getTokenBalance, SEPOLIA_CHAIN_ID } from "@/lib/contract";

export interface MetaMaskState {
  isInstalled: boolean;
  isConnecting: boolean;
  account: string | null;
  chainId: number | null;
  isOnSepolia: boolean;
  tokenBalance: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToSepolia: () => Promise<void>;
  refreshBalance: () => Promise<void>;
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
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const updateWallet = useUpdateWalletAddress();
  const queryClient = useQueryClient();

  const isInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
  const isOnSepolia = chainId === SEPOLIA_CHAIN_ID;

  const saveWallet = useCallback(
    (address: string) => {
      if (!autoSave) return;
      updateWallet.mutate(
        { data: { walletAddress: address } },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() }) }
      );
    },
    [autoSave, updateWallet, queryClient]
  );

  const refreshBalance = useCallback(async () => {
    if (!account || !isOnSepolia) return;
    try {
      const bal = await getTokenBalance(account);
      setTokenBalance(bal);
    } catch {
      setTokenBalance(null);
    }
  }, [account, isOnSepolia]);

  useEffect(() => {
    if (!isInstalled) return;

    const init = async () => {
      const accounts = (await window.ethereum!.request({ method: "eth_accounts" })) as string[];
      const chainHex = (await window.ethereum!.request({ method: "eth_chainId" })) as string;
      const cid = parseInt(chainHex, 16);
      setChainId(cid);
      if (accounts.length > 0) setAccount(accounts[0]);
    };
    init();

    const handleAccountsChanged = (accounts: unknown) => {
      const list = accounts as string[];
      setAccount(list.length > 0 ? list[0] : null);
    };
    const handleChainChanged = (chainHex: unknown) => {
      setChainId(parseInt(chainHex as string, 16));
    };

    window.ethereum!.on("accountsChanged", handleAccountsChanged);
    window.ethereum!.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum!.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum!.removeListener("chainChanged", handleChainChanged);
    };
  }, [isInstalled]);

  useEffect(() => {
    if (account && isOnSepolia) refreshBalance();
  }, [account, isOnSepolia, refreshBalance]);

  const connect = useCallback(async () => {
    if (!isInstalled) {
      setError("MetaMask is not installed. Visit metamask.io to install it.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const accounts = (await window.ethereum!.request({ method: "eth_requestAccounts" })) as string[];
      const address = accounts[0];
      setAccount(address);
      saveWallet(address);
      await ensureSepoliaNetwork();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection rejected");
    } finally {
      setIsConnecting(false);
    }
  }, [isInstalled, saveWallet]);

  const switchToSepolia = useCallback(async () => {
    try {
      await ensureSepoliaNetwork();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to switch network");
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setTokenBalance(null);
  }, []);

  return { isInstalled, isConnecting, account, chainId, isOnSepolia, tokenBalance, connect, disconnect, switchToSepolia, refreshBalance, error };
}
