import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, Loader2 } from "lucide-react";
import { getCalendarCountry } from "@/lib/calendarFlags";
import { toEasternCalendarDisplay } from "@/lib/calendarTime";
import { formatRiskCountdown, nextHighImpactToday, type CalendarRiskEvent } from "@/lib/calendarRisk";

type CalendarResponse = {
  events: CalendarRiskEvent[];
  sourceStatus: "live" | "stale" | "unavailable";
};

export function CalendarRiskRibbon({
  calendar,
  isLoading,
  isError = false,
  error,
  onOpenCalendar,
  onRetry,
}: {
  calendar?: CalendarResponse;
  isLoading: boolean;
  isError?: boolean;
  error?: unknown;
  onOpenCalendar: () => void;
  onRetry?: () => void;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timeout = window.setTimeout(() => setNow(new Date()), 30_000);
    return () => window.clearTimeout(timeout);
  }, [now]);

  const next = useMemo(() => nextHighImpactToday(calendar?.events ?? [], now), [calendar?.events, now]);
  const country = next ? getCalendarCountry(next.event.country) : null;
  const display = next ? toEasternCalendarDisplay(next.event.date, next.event.time) : null;

  return (
    <section data-testid="dashboard-calendar-risk" className="mb-5 overflow-hidden rounded-2xl border border-amber-300/15 bg-[linear-gradient(105deg,rgba(120,53,15,.17),rgba(10,17,31,.94)_42%,rgba(16,33,64,.8))] shadow-[0_16px_34px_rgba(0,0,0,.18)]">
      <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-amber-300/20 bg-amber-400/[.08]">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-amber-200" /> : <AlertTriangle className="h-4 w-4 text-amber-200" />}
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[9px] uppercase tracking-[.18em] text-amber-100/75">Calendar risk · Today</p>
            {isLoading ? <p className="mt-1 text-sm text-slate-400">Checking source-backed macro events…</p> : isError ? <p role="alert" className="mt-1 text-sm text-amber-100">Live calendar risk is unavailable. {error instanceof Error ? error.message : "Please retry."}</p> : next && country && display ? <p className="mt-1 truncate text-sm font-medium text-white"><span aria-label={`${country.label} flag`} role="img" className="mr-1.5">{country.flag}</span>{next.event.event} <span className="font-mono text-xs font-normal text-slate-400">· {next.event.country} · {display.timeLabel} ET</span></p> : <p className="mt-1 text-sm text-slate-300">{calendar?.sourceStatus === "unavailable" ? "Live calendar is temporarily unavailable." : calendar?.sourceStatus === "stale" ? "Calendar coverage is awaiting the next source update." : "No high-impact events remain today."}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 self-end sm:self-auto">
          {next ? <div className="rounded-lg border border-amber-300/15 bg-black/15 px-2.5 py-1.5 text-right"><p className="font-mono text-[8px] uppercase tracking-[.14em] text-amber-100/60">Risk window</p><p className="mt-0.5 font-mono text-xs font-semibold text-amber-100">In {formatRiskCountdown(next.timestamp, now)}</p></div> : <CalendarClock className="h-4 w-4 text-slate-500" />}
          {isError && onRetry ? <button type="button" onClick={onRetry} className="tf-press inline-flex items-center gap-1.5 text-xs font-medium text-amber-100 hover:text-white">Try again <ArrowRight className="h-3.5 w-3.5" /></button> : <button type="button" onClick={onOpenCalendar} className="tf-press inline-flex items-center gap-1.5 text-xs font-medium text-amber-100 hover:text-white">View calendar <ArrowRight className="h-3.5 w-3.5" /></button>}
        </div>
      </div>
    </section>
  );
}
