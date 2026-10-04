import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { getCalendarCountry } from "@/lib/calendarFlags";
import { sourceEasternTimestamp } from "@/lib/calendarRisk";
import { toEasternCalendarDisplay } from "@/lib/calendarTime";
import { trpc } from "@/lib/trpc";

type HighImpactEvent = {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: string;
};

type CalendarResponse = {
  events: HighImpactEvent[];
  sourceStatus: "live" | "stale" | "unavailable";
};

function upcomingHighImpactEvents(events: HighImpactEvent[], now = Date.now()) {
  return events
    .filter(event => event.impact === "high")
    .map(event => ({ event, timestamp: sourceEasternTimestamp(event.date, event.time) }))
    .filter((item): item is { event: HighImpactEvent; timestamp: number } => item.timestamp !== null && item.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 3);
}

export function HighImpactNewsAlert({ userKey, onOpenCalendar, enabled = true }: { userKey: string; onOpenCalendar: () => void; enabled?: boolean }) {
  const shownForUser = useRef<string | null>(null);
  const { data } = trpc.calendar.getEvents.useQuery(undefined, {
    enabled,
    staleTime: 4 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const response = data as CalendarResponse | undefined;
    if (!enabled || !response || response.sourceStatus === "unavailable" || shownForUser.current === userKey) return;

    const upcoming = upcomingHighImpactEvents(response.events);
    if (upcoming.length === 0) return;
    shownForUser.current = userKey;

    const summary = upcoming.map(({ event }) => {
      const display = toEasternCalendarDisplay(event.date, event.time);
      const country = getCalendarCountry(event.country);
      return `${country.flag} ${display.dateLabel} ${display.timeLabel} ET · ${event.event}`;
    }).join("\n");

    toast.warning(`High-impact news ahead · ${upcoming.length} event${upcoming.length === 1 ? "" : "s"}`, {
      description: summary,
      duration: 12_000,
      action: {
        label: "View calendar",
        onClick: onOpenCalendar,
      },
    });
  }, [data, enabled, onOpenCalendar, userKey]);

  return null;
}

export function getUpcomingHighImpactEventsForTest(events: HighImpactEvent[], now = Date.now()) {
  return upcomingHighImpactEvents(events, now);
}
