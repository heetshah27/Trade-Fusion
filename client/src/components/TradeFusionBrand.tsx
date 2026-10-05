import React from "react";

type MarkSize = "small" | "regular" | "large" | "launch";
type BrandMode = "full" | "compact" | "launch";

const sizeClasses: Record<MarkSize, string> = {
  small: "tf-monogram-small",
  regular: "",
  large: "tf-monogram-large",
  launch: "tf-monogram-launch",
};
const NEW_MARK_SRC = "/manus-storage/trade-fusion-new-mark_e24848eb.png";

export function TradeFusionMark({ size = "regular", className = "" }: { size?: MarkSize; className?: string }) {
  return (
    <div className={`tf-monogram ${sizeClasses[size]} ${className}`.trim()} aria-label="Trade Fusion new trading emblem" role="img" data-testid="trade-fusion-mark">
      <img src={NEW_MARK_SRC} alt="" className="tf-new-logo-mark" />
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
