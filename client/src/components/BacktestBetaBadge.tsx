import React from "react";

export function BacktestBetaBadge({ className = "" }: { className?: string }) {
  return <span title="Backtest is in active beta" className={`inline-flex shrink-0 items-center rounded-md border border-amber-200/40 bg-gradient-to-br from-amber-300 to-amber-500 px-2 py-1 font-mono text-[8px] font-black uppercase leading-none tracking-[0.12em] text-amber-950 shadow-[0_5px_14px_rgb(245_158_11_/_0.3)] ${className}`}>BETA</span>;
}
