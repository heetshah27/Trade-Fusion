import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type TradingAccount = {
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  accountType: string;
  performance?: {
    tradeCount: number;
    wins: number;
    losses: number;
    netPnl: number;
    winRate: number;
    profitFactor: number | null;
    maxDrawdown: number;
    maxDrawdownPercent: number;
  };
};

type TradingAccountContextValue = {
  accounts: TradingAccount[];
  selectedAccount: TradingAccount | null;
  selectedAccountId: number | null;
  selectAccount: (id: number) => void;
};

const STORAGE_KEY = "trade-fusion:selected-account-id";
const TradingAccountContext = createContext<TradingAccountContextValue | null>(null);

export function TradingAccountProvider({ accounts, children }: { accounts: TradingAccount[]; children: React.ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(value) && value > 0 ? value : null;
  });

  useEffect(() => {
    if (selectedAccountId !== null && accounts.some(account => account.id === selectedAccountId)) return;
    if (accounts.length === 1) setSelectedAccountId(accounts[0].id);
    else if (selectedAccountId !== null) setSelectedAccountId(null);
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedAccountId === null) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, String(selectedAccountId));
  }, [selectedAccountId]);

  const value = useMemo(() => ({
    accounts,
    selectedAccountId,
    selectedAccount: accounts.find(account => account.id === selectedAccountId) ?? null,
    selectAccount: (id: number) => setSelectedAccountId(id),
  }), [accounts, selectedAccountId]);

  return <TradingAccountContext.Provider value={value}>{children}</TradingAccountContext.Provider>;
}

export function useTradingAccount() {
  const context = useContext(TradingAccountContext);
  if (!context) throw new Error("useTradingAccount must be used inside TradingAccountProvider");
  return context;
}

export function useOptionalTradingAccount() {
  return useContext(TradingAccountContext);
}

export function markWorkspaceEntrySeen() {
  if (typeof window !== "undefined") window.localStorage.setItem("trade-fusion:workspace-entry-seen", "true");
}

export function shouldShowWorkspaceEntry() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("trade-fusion:workspace-entry-seen") !== "true";
}
