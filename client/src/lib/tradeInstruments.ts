import type { Trade } from "./tradeTypes";

export type InstrumentCategory = "forex" | "metals" | "crypto" | "indices" | "equities" | "options" | "other";

export type InstrumentProfile = {
  category: InstrumentCategory;
  marker: string;
  label: string;
  quantityLabel: string;
  contractMultiplier: number;
  estimate: boolean;
  basis: string;
};

const cryptoSymbols = new Set(["BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "BNB", "AVAX", "LINK", "LTC"]);
const indexSymbols = new Set(["US30", "NAS100", "US100", "SPX500", "US500", "GER40", "UK100", "JP225", "HK50"]);

function normalizedSymbol(symbol: string) {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function inferInstrumentCategory(symbol: string): InstrumentCategory {
  const value = normalizedSymbol(symbol);
  if (value.startsWith("XAU") || value.startsWith("XAG")) return "metals";
  if (Array.from(cryptoSymbols).some(token => value.startsWith(token))) return "crypto";
  if (indexSymbols.has(value)) return "indices";
  if (/^[A-Z]{6}$/.test(value)) return "forex";
  return "equities";
}

export function getInstrumentProfile(symbol: string, suppliedCategory?: string): InstrumentProfile {
  const category = (["forex", "metals", "crypto", "indices", "equities", "options", "other"] as string[]).includes(suppliedCategory || "")
    ? suppliedCategory as InstrumentCategory
    : inferInstrumentCategory(symbol);
  const value = normalizedSymbol(symbol);

  if (category === "forex") {
    const jpyQuote = value.endsWith("JPY");
    return { category, marker: value.slice(0, 2) || "FX", label: "Forex", quantityLabel: "Lots", contractMultiplier: jpyQuote ? 100000 / 150 : 100000, estimate: jpyQuote, basis: jpyQuote ? "100,000 units per lot; JPY quote conversion uses an indicative 150 JPY/USD rate. Override with your broker result." : "100,000 base units per standard lot; exact broker conversion, swaps, and commissions may differ." };
  }
  if (category === "metals") {
    const silver = value.startsWith("XAG");
    return { category, marker: silver ? "AG" : "AU", label: silver ? "Silver" : "Gold", quantityLabel: "Lots", contractMultiplier: silver ? 5000 : 100, estimate: false, basis: `${silver ? "5,000 troy ounces" : "100 troy ounces"} per standard lot; broker contract sizing may differ.` };
  }
  if (category === "crypto") return { category, marker: value.slice(0, 3) || "CR", label: "Crypto", quantityLabel: "Units", contractMultiplier: 1, estimate: false, basis: "Quantity is treated as coin units; fees are deducted separately." };
  if (category === "indices") return { category, marker: value.slice(0, 3) || "IX", label: "Index", quantityLabel: "Contracts", contractMultiplier: 1, estimate: true, basis: "One point per contract is used as an estimate. Your broker’s point value can differ; override when needed." };
  if (category === "options") return { category, marker: "OP", label: "Options", quantityLabel: "Contracts", contractMultiplier: 100, estimate: true, basis: "100 underlying units per standard contract; multiplier and fees can vary by contract." };
  if (category === "other") return { category, marker: value.slice(0, 2) || "OT", label: "Other", quantityLabel: "Units", contractMultiplier: 1, estimate: true, basis: "One unit per price point is used as an estimate. Override with your broker result." };
  return { category: "equities", marker: value.slice(0, 3) || "EQ", label: "Equity", quantityLabel: "Shares", contractMultiplier: 1, estimate: false, basis: "Quantity is treated as shares; fees are deducted separately." };
}

export function calculateTradePnl(trade: Pick<Trade, "symbol" | "instrumentCategory" | "direction" | "entryPrice" | "exitPrice" | "quantity" | "fees">) {
  const profile = getInstrumentProfile(trade.symbol, trade.instrumentCategory);
  const priceMove = trade.direction === "LONG" ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice;
  const gross = priceMove * trade.quantity * profile.contractMultiplier;
  const net = gross - trade.fees;
  return { profile, gross, net: parseFloat(net.toFixed(2)), formula: `${trade.direction === "LONG" ? "Exit − Entry" : "Entry − Exit"} × ${profile.quantityLabel.toLowerCase()} × ${profile.contractMultiplier.toLocaleString()} − fees` };
}
