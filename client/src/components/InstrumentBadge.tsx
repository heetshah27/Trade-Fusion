import React from "react";
import { getInstrumentProfile, type InstrumentCategory } from "@/lib/tradeInstruments";

type BadgeSize = "sm" | "md" | "lg";

const CURRENCY_TOKENS: Record<string, { glyph: string; flag: string; label: string; tone: string }> = {
  EUR: { glyph: "€", flag: "🇪🇺", label: "Euro", tone: "border-blue-300/25 bg-blue-400/[.12] text-blue-100" },
  USD: { glyph: "$", flag: "🇺🇸", label: "US dollar", tone: "border-emerald-300/25 bg-emerald-400/[.12] text-emerald-100" },
  GBP: { glyph: "£", flag: "🇬🇧", label: "British pound", tone: "border-violet-300/25 bg-violet-400/[.12] text-violet-100" },
  JPY: { glyph: "¥", flag: "🇯🇵", label: "Japanese yen", tone: "border-rose-300/25 bg-rose-400/[.12] text-rose-100" },
  CHF: { glyph: "₣", flag: "🇨🇭", label: "Swiss franc", tone: "border-red-300/25 bg-red-400/[.12] text-red-100" },
  AUD: { glyph: "A$", flag: "🇦🇺", label: "Australian dollar", tone: "border-amber-300/25 bg-amber-400/[.12] text-amber-100" },
  CAD: { glyph: "C$", flag: "🇨🇦", label: "Canadian dollar", tone: "border-orange-300/25 bg-orange-400/[.12] text-orange-100" },
  NZD: { glyph: "N$", flag: "🇳🇿", label: "New Zealand dollar", tone: "border-cyan-300/25 bg-cyan-400/[.12] text-cyan-100" },
};

const SIZE: Record<BadgeSize, { root: string; token: string; stacked: string }> = {
  sm: { root: "h-6 min-w-6", token: "h-4 w-4 text-[7px]", stacked: "-ml-1.5" },
  md: { root: "h-8 min-w-8", token: "h-5 w-5 text-[8px]", stacked: "-ml-2" },
  lg: { root: "h-10 min-w-10", token: "h-6 w-6 text-[10px]", stacked: "-ml-2.5" },
};

const XAU_GOLD_BARS_ASSET = "/manus-storage/trade-fusion-xauusd-gold-bars_1b1d3759.png";
const XAG_SILVER_BARS_ASSET = "/manus-storage/trade-fusion-xagusd-silver-bars_e5cb130a.png";

function normalized(symbol: string) {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function marketLabel(symbol: string, category: InstrumentCategory) {
  const value = normalized(symbol);
  if (category === "metals") return value.startsWith("XAG") ? "Silver" : "Gold";
  if (category === "crypto") return value.replace("USD", "") || "Crypto";
  if (category === "indices") return value || "Index";
  if (category === "equities") return value || "Equity";
  if (category === "options") return value || "Options";
  return value || "Market";
}

export function InstrumentBadge({ symbol, category, size = "md", className = "" }: { symbol: string; category?: string; size?: BadgeSize; className?: string }) {
  const profile = getInstrumentProfile(symbol, category);
  const value = normalized(symbol);
  const scale = SIZE[size];
  const pair = profile.category === "forex" && value.length === 6 ? [value.slice(0, 3), value.slice(3)] : null;
  const label = pair ? `${CURRENCY_TOKENS[pair[0]]?.label ?? pair[0]} / ${CURRENCY_TOKENS[pair[1]]?.label ?? pair[1]} forex pair` : `${marketLabel(symbol, profile.category)} ${profile.label}`;

  if (pair) {
    const first = CURRENCY_TOKENS[pair[0]] ?? { glyph: pair[0].slice(0, 1), flag: pair[0].slice(0, 1), label: pair[0], tone: "border-slate-300/20 bg-slate-300/[.10] text-slate-100" };
    const second = CURRENCY_TOKENS[pair[1]] ?? { glyph: pair[1].slice(0, 1), flag: pair[1].slice(0, 1), label: pair[1], tone: "border-slate-300/20 bg-slate-300/[.10] text-slate-100" };
    return <span role="img" aria-label={label} title={label} className={`inline-flex ${scale.root} items-center justify-center ${className}`}><span className="relative inline-flex items-center"><span className={`grid ${scale.token} z-10 place-items-center rounded-md border font-sans font-bold shadow-[0_4px_10px_rgb(15_23_42_/_0.22)] ${first.tone}`}>{first.flag}</span><span className={`grid ${scale.token} ${scale.stacked} place-items-center rounded-md border font-sans font-bold shadow-[0_4px_10px_rgb(15_23_42_/_0.22)] ${second.tone}`}>{second.flag}</span></span></span>;
  }

  if (profile.category === "metals" && value.startsWith("XAU")) {
    return <span role="img" aria-label={label} title={label} className={`inline-grid ${scale.root} overflow-hidden rounded-lg border border-amber-300/25 bg-[#d89f00] shadow-[0_5px_14px_rgb(180_120_0_/_0.2)] ${className}`}><img src={XAU_GOLD_BARS_ASSET} alt="" className="h-full w-full object-cover" /></span>;
  }

  if (profile.category === "metals" && value.startsWith("XAG")) {
    return <span role="img" aria-label={label} title={label} className={`inline-grid ${scale.root} overflow-hidden rounded-lg border border-slate-200/30 bg-[#a7a7b2] shadow-[0_5px_14px_rgb(148_163_184_/_0.18)] ${className}`}><img src={XAG_SILVER_BARS_ASSET} alt="" className="h-full w-full object-cover" /></span>;
  }

  const style = profile.category === "metals" ? "border-amber-300/25 bg-amber-400/[.12] text-amber-100" : profile.category === "crypto" ? "border-orange-300/25 bg-orange-400/[.12] text-orange-100" : profile.category === "indices" ? "border-sky-300/25 bg-sky-400/[.12] text-sky-100" : profile.category === "options" ? "border-violet-300/25 bg-violet-400/[.12] text-violet-100" : profile.category === "equities" ? "border-slate-300/20 bg-slate-300/[.09] text-slate-100" : "border-blue-300/20 bg-blue-400/[.10] text-blue-100";
  const mark = profile.category === "metals" ? (value.startsWith("XAG") ? "Ag" : "Au") : profile.category === "crypto" ? (value.startsWith("BTC") ? "₿" : value.startsWith("ETH") ? "Ξ" : value.slice(0, 2)) : profile.category === "indices" ? "IX" : profile.category === "options" ? "OP" : profile.marker.slice(0, 2);
  return <span role="img" aria-label={label} title={label} className={`inline-grid ${scale.root} place-items-center rounded-lg border font-mono text-[10px] font-bold ${style} ${className}`}>{mark}</span>;
}
