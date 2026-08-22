import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { TradeFusionBrand } from "@/components/TradeFusionBrand";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { LockKeyhole, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import React, { type ReactNode, useEffect, useState } from "react";
import { getLaunchState, INTRO_DURATION_MS } from "@/lib/launchState";

type LaunchGateProps = {
  children: ReactNode;
  mode?: "workspace" | "public";
};

function LaunchBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,oklch(0.66_0.18_250_/_0.16),transparent_32%),radial-gradient(circle_at_15%_90%,oklch(0.58_0.13_240_/_0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(oklch(0.66_0.06_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.66_0.06_250)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[oklch(0.66_0.18_250_/_0.55)] to-transparent" />
    </>
  );
}

function IntroScreen({ reduceMotion, status }: { reduceMotion: boolean | null; status: string }) {
  return (
    <motion.main
      key="intro"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full overflow-hidden bg-[#050912] text-white"
      style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}
      aria-label="Trade Fusion loading"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,oklch(0.67_0.18_250_/_0.09),transparent_25%)]" />
      <div className="relative w-full px-6" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={reduceMotion ? undefined : { opacity: [0.9, 1, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="mb-6"
          >
            <TradeFusionBrand mode="launch" markSize="launch" />
          </motion.div>
          <div className="h-px w-24 overflow-hidden bg-white/[0.08]">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.35, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/3 bg-[oklch(0.68_0.18_250)]"
            />
          </div>
          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.28em] text-slate-600">{status}</p>
        </motion.div>
      </div>
    </motion.main>
  );
}

function SignInScreen({ checkingAuth, onSignIn }: { checkingAuth: boolean; onSignIn: () => void }) {
  return (
    <motion.main
      key="sign-in"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full overflow-hidden bg-[#080b0f] text-white"
      style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}
    >
      <LaunchBackground />
      <div className="absolute left-6 top-6 z-10"><TradeFusionBrand mode="compact" /></div>
      <div className="relative w-full px-6" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/60 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
          <TradeFusionBrand mode="compact" />
          <div className="mt-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/[0.22] bg-blue-400/[0.10] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-blue-200">
              <Sparkles className="h-3.5 w-3.5" /> Private workspace
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Welcome to Trade Fusion.</h1>
            <p className="mt-3 leading-6 text-slate-400">Log in or create your account to enter your private, cross-device trading workspace.</p>
          </div>
          <div className="mt-8 space-y-3 text-sm text-slate-400">
            <div className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-[oklch(0.70_0.16_250)]" /> Your trades remain linked to your account.</div>
            <div className="flex items-center gap-3"><LockKeyhole className="h-4 w-4 text-[oklch(0.70_0.16_250)]" /> Your journal stays separate from other traders.</div>
          </div>
          <Button
            onClick={onSignIn}
            disabled={checkingAuth}
            className="mt-9 h-11 w-full bg-[oklch(0.66_0.18_250)] font-semibold text-white hover:bg-[oklch(0.72_0.18_250)]"
          >
            {checkingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue to login or sign up"}
          </Button>
          <p className="mt-4 text-center text-xs leading-5 text-slate-500">After secure access, you will enter your Trade Fusion dashboard.</p>
        </section>
      </div>
    </motion.main>
  );
}

function DashboardLoadingScreen({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.main
      key="dashboard-loading"
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
      transition={{ duration: 0.34, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full overflow-hidden bg-[#050912] text-white"
      style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}
      aria-label="Opening Trade Fusion dashboard"
      data-testid="dashboard-opening-transition"
    >
      <LaunchBackground />
      <div className="relative flex flex-col items-center px-6 text-center">
        <TradeFusionBrand mode="launch" markSize="launch" />
        <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.28em] text-blue-200">Secure session confirmed</p>
        <h1 className="mt-3 text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">Opening your dashboard</h1>
        <div className="mt-6 h-px w-40 overflow-hidden bg-white/[0.10]">
          <motion.div
            initial={{ x: "-100%" }}
            animate={reduceMotion ? { x: "0%" } : { x: "100%" }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
            className="h-full w-1/2 bg-gradient-to-r from-blue-400 via-sky-300 to-emerald-300"
          />
        </div>
      </div>
    </motion.main>
  );
}

export default function LaunchGate({ children, mode = "workspace" }: LaunchGateProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);
  const { loading, isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();
  const [isOnboardingEntry] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem("trade-fusion:onboarding-entry") === "true";
    } catch {
      return false;
    }
  });
  const [isLoginReturn] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem("trade-fusion:login-return") === "true";
    } catch {
      return false;
    }
  });

  const beginLogin = () => {
    try {
      window.sessionStorage.setItem("trade-fusion:login-return", "true");
    } catch {
      // The OAuth flow remains functional where browser storage is unavailable.
    }
    startLogin();
  };

  useEffect(() => {
    if (!isOnboardingEntry) return;
    try {
      window.sessionStorage.removeItem("trade-fusion:onboarding-entry");
    } catch {
      // The launch gate remains usable where browser storage is unavailable.
    }
  }, [isOnboardingEntry]);

  useEffect(() => {
    if (!isLoginReturn) return;
    try {
      window.sessionStorage.removeItem("trade-fusion:login-return");
    } catch {
      // The in-memory login-return state safely remains available for this load.
    }
  }, [isLoginReturn]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroComplete(true), reduceMotion ? 0 : INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  useEffect(() => {
    if (mode !== "workspace" || !isLoginReturn || !introComplete || loading || !isAuthenticated) {
      setDashboardReady(false);
      return;
    }
    const timeout = window.setTimeout(() => setDashboardReady(true), reduceMotion ? 0 : 520);
    return () => window.clearTimeout(timeout);
  }, [introComplete, isAuthenticated, loading, mode, reduceMotion]);

  const state = mode === "public"
    ? (introComplete ? "app" : "intro")
    : getLaunchState(introComplete, loading, isAuthenticated);

  return (
    <AnimatePresence mode="wait">
      {state === "intro" && <IntroScreen reduceMotion={reduceMotion} status={isOnboardingEntry && mode === "workspace" ? "Preparing secure sign-in" : "Launching private workspace"} />}
      {state === "checking-auth" && <SignInScreen checkingAuth onSignIn={beginLogin} />}
      {state === "sign-in" && <SignInScreen checkingAuth={false} onSignIn={beginLogin} />}
      {state === "app" && mode === "workspace" && isLoginReturn && !dashboardReady && <DashboardLoadingScreen reduceMotion={reduceMotion} />}
      {state === "app" && (mode === "public" || !isLoginReturn || dashboardReady) && <motion.div key="app" initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>{children}</motion.div>}
    </AnimatePresence>
  );
}
