import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, LockKeyhole, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { getLaunchState, INTRO_DURATION_MS } from "@/lib/launchState";

type LaunchGateProps = {
  children: ReactNode;
};

function BrandMark({ size = "regular" }: { size?: "regular" | "large" }) {
  const isLarge = size === "large";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative grid place-items-center overflow-hidden rounded-xl bg-[oklch(0.66_0.18_250)] shadow-[0_0_40px_oklch(0.66_0.18_250_/_0.30)] ${
          isLarge ? "h-12 w-12" : "h-9 w-9"
        }`}
      >
        <BarChart3 className={isLarge ? "h-6 w-6 text-slate-950" : "h-4 w-4 text-slate-950"} strokeWidth={2.5} />
        <span className="absolute inset-x-0 bottom-0 h-1/3 bg-slate-950/10" />
      </div>
      <div className="leading-none">
        <div className={`${isLarge ? "text-2xl" : "text-base"} font-bold tracking-[-0.04em] text-white`}>
          TRADE<span className="text-[oklch(0.70_0.16_250)]">FUSION</span>
        </div>
        <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.28em] text-slate-500">Trade Journal</div>
      </div>
    </div>
  );
}

function LaunchBackground() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,oklch(0.66_0.18_250_/_0.16),transparent_32%),radial-gradient(circle_at_15%_90%,oklch(0.58_0.13_240_/_0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(oklch(0.66_0.06_250)_1px,transparent_1px),linear-gradient(90deg,oklch(0.66_0.06_250)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-[oklch(0.66_0.18_250_/_0.55)] to-transparent" />
    </>
  );
}

function IntroScreen({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.main
      key="intro"
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="relative w-full overflow-hidden bg-[#080b0f] text-white"
      style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}
      aria-label="Trade Fusion loading"
    >
      <LaunchBackground />
      <div className="relative w-full px-6" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col items-center"
        >
          <motion.div
            animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-5"
          >
            <BrandMark size="large" />
          </motion.div>
          <div className="h-px w-40 overflow-hidden bg-white/10">
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
              className="h-full w-1/2 bg-[oklch(0.66_0.18_250)]"
            />
          </div>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">Calibrating your trade journal</p>
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
      <div className="relative w-full px-6" style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
        <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950/60 p-7 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-9">
        <BrandMark />
        <div className="mt-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/[0.22] bg-blue-400/[0.10] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-blue-200">
            <Sparkles className="h-3.5 w-3.5" /> Private workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white">Review. Refine. Repeat.</h1>
          <p className="mt-3 leading-6 text-slate-400">Sign in to open your private, cross-device trading journal and market calendar.</p>
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
          {checkingAuth ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in to Trade Fusion"}
        </Button>
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">Secure access is required before your journal loads.</p>
        </section>
      </div>
    </motion.main>
  );
}

export default function LaunchGate({ children }: LaunchGateProps) {
  const [introComplete, setIntroComplete] = useState(false);
  const { loading, isAuthenticated } = useAuth();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const timeout = window.setTimeout(() => setIntroComplete(true), reduceMotion ? 0 : INTRO_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [reduceMotion]);

  const state = getLaunchState(introComplete, loading, isAuthenticated);

  return (
    <AnimatePresence mode="wait">
      {state === "intro" && <IntroScreen reduceMotion={reduceMotion} />}
      {state === "checking-auth" && <SignInScreen checkingAuth onSignIn={startLogin} />}
      {state === "sign-in" && <SignInScreen checkingAuth={false} onSignIn={startLogin} />}
      {state === "app" && <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>{children}</motion.div>}
    </AnimatePresence>
  );
}
