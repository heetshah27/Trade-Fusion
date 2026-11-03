import React from "react";

type MarkSize = "small" | "regular" | "large" | "launch";
type BrandMode = "full" | "compact" | "launch";

const sizeClasses: Record<MarkSize, string> = {
  small: "tf-monogram-small",
  regular: "",
  large: "tf-monogram-large",
  launch: "tf-monogram-launch",
};

function TradingMarkSvg() {
  return (
    <svg className="tf-vector-mark" viewBox="0 0 76 76" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="tf-mark-teal" x1="12" y1="14" x2="56" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6EE7C8" />
          <stop offset="0.48" stopColor="#16C7B1" />
          <stop offset="1" stopColor="#1584F5" />
        </linearGradient>
        <linearGradient id="tf-mark-blue" x1="36" y1="22" x2="62" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#44D6FF" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="72" height="72" rx="20" fill="#091426" stroke="rgba(110,231,200,.34)" strokeWidth="1.5" />
      <path d="M12 17.5h48l-7.2 9.3H40.5V59H30.2V26.8H12z" fill="url(#tf-mark-teal)" />
      <path d="M43.5 28.4H64l-7.2 8.4H46.5v7.4h12.8l-7.1 8.2H46.5V59H36.2V28.4z" fill="url(#tf-mark-blue)" />
      <path d="M18 57.5V45.7M25 57.5V38.5M32 57.5V31.5" stroke="#6EE7C8" strokeWidth="2.2" strokeLinecap="round" opacity=".92" />
      <path d="M18 45.7v-4.2M25 38.5v-4.8M32 31.5v-5" stroke="#6EE7C8" strokeWidth="1.5" strokeLinecap="round" opacity=".92" />
      <path d="M16 64h44" stroke="#44D6FF" strokeWidth="1" strokeLinecap="round" opacity=".24" />
    </svg>
  );
}

export function TradeFusionMark({ size = "regular", className = "" }: { size?: MarkSize; className?: string }) {
  return (
    <div className={`tf-monogram ${sizeClasses[size]} ${className}`.trim()} aria-label="Trade Fusion trading emblem" role="img" data-testid="trade-fusion-mark">
      <TradingMarkSvg />
    </div>
  );
}

export function TradeFusionBrand({ mode = "full", markSize = "regular", className = "" }: { mode?: BrandMode; markSize?: MarkSize; className?: string }) {
  const isLaunch = mode === "launch";
  const isCompact = mode === "compact";
  return (
    <div className={`tf-brand-lockup ${isLaunch ? "tf-brand-lockup-launch" : ""} ${className}`.trim()} aria-label="Trade Fusion" data-testid="trade-fusion-brand">
      <TradeFusionMark size={markSize} />
      <div className={`tf-brand-copy ${isLaunch ? "tf-brand-copy-launch" : ""}`}>
        <p className={`tf-brand-name ${isLaunch ? "tf-brand-name-launch" : isCompact ? "tf-brand-name-compact" : ""}`}>
          TRADE<span>FUSION</span>
        </p>
        <p className={`tf-brand-subtitle ${isLaunch ? "tf-brand-subtitle-launch" : ""}`}>Trading Workspace</p>
      </div>
    </div>
  );
}
