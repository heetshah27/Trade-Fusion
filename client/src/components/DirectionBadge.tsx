import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

export type TradeDirection = "LONG" | "SHORT" | "Long" | "Short";

const sizeClasses = {
  sm: "gap-1 px-2 py-1 text-[9px]",
  md: "gap-1.5 px-2.5 py-1.5 text-[10px]",
  lg: "gap-1.5 px-3 py-2 text-xs",
};

export function DirectionBadge({ direction, size = "md", className = "" }: { direction: TradeDirection | string; size?: keyof typeof sizeClasses; className?: string }) {
  const isLong = direction.toUpperCase() === "LONG";
  const label = isLong ? "Long direction" : "Short direction";
  const tone = isLong
    ? "border-sky-300/25 bg-gradient-to-br from-sky-400/[.17] to-blue-500/[.10] text-sky-100 shadow-[0_6px_18px_rgba(37,99,235,.13)]"
    : "border-rose-300/25 bg-gradient-to-br from-rose-400/[.15] to-red-500/[.08] text-rose-100 shadow-[0_6px_18px_rgba(225,29,72,.11)]";
  const Icon = isLong ? TrendingUp : TrendingDown;
  return <span role="img" aria-label={label} title={label} className={`tf-direction-badge inline-flex items-center rounded-lg border font-mono font-semibold uppercase tracking-[.08em] ${sizeClasses[size]} ${tone} ${className}`}><Icon className="h-3.5 w-3.5" aria-hidden="true" />{isLong ? "Long" : "Short"}</span>;
}
