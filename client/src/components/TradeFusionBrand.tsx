import React from "react";

type MarkSize = "small" | "regular" | "large" | "launch";
type BrandMode = "full" | "compact" | "launch";

const sizeClasses: Record<MarkSize, string> = {
  small: "tf-monogram-small",
  regular: "",
  large: "tf-monogram-large",
  launch: "tf-monogram-launch",
};

export function TradeFusionMark({ size = "regular", className = "" }: { size?: MarkSize; className?: string }) {
  return (
    <div className={`tf-monogram ${sizeClasses[size]} ${className}`.trim()} aria-label="Trade Fusion TF monogram" role="img" data-testid="trade-fusion-mark">
      <span className="tf-monogram-t">T</span>
      <span className="tf-monogram-f">F</span>
      <span className="tf-monogram-up" />
      <span className="tf-monogram-down" />
    </div>
  );
}

export function TradeFusionBrand({ mode = "full", markSize = "regular", className = "" }: { mode?: BrandMode; markSize?: MarkSize; className?: string }) {
  const isLaunch = mode === "launch";
  const isCompact = mode === "compact";

  return (
    <div className={`flex items-center gap-2.5 ${isLaunch ? "flex-col gap-3" : ""} ${className}`.trim()} aria-label="Trade Fusion" data-testid="trade-fusion-brand">
      <TradeFusionMark size={markSize} />
      <div className={`leading-none ${isLaunch ? "text-center" : ""}`}>
        <p className={`${isLaunch ? "text-xl sm:text-2xl" : isCompact ? "text-sm" : "text-base"} font-bold tracking-[-0.045em] text-white`}>
          TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span>
        </p>
        <p className={`mt-1 font-mono ${isLaunch ? "text-[9px] tracking-[0.32em]" : "text-[8px] tracking-[0.27em]"} uppercase text-slate-400`}>Trading Workspace</p>
      </div>
    </div>
  );
}
