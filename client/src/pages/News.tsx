import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getCalendarCountry } from '@/lib/calendarFlags';
import { toEasternCalendarDisplay } from '@/lib/calendarTime';
import { trpc } from '@/lib/trpc';

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: 'high' | 'medium' | 'low' | 'holiday' | 'unknown';
  forecast?: string;
  previous?: string;
  actual?: string;
  sourceUrl?: string;
}

interface CalendarResponse {
  events: EconomicEvent[];
  sourceStatus: 'live' | 'unavailable';
  refreshedAt: string;
  message?: string;
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'border-red-400/20 bg-red-500/10 text-red-300';
    case 'medium':
      return 'border-amber-400/20 bg-amber-400/10 text-amber-200';
    case 'low':
      return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200';
    case 'holiday':
      return 'border-sky-400/20 bg-sky-400/10 text-sky-200';
    default:
      return 'border-slate-500/20 bg-slate-500/10 text-slate-300';
  }
};

const getImpactIcon = (impact: string) => {
  if (impact === 'high') {
    return <AlertCircle className="w-4 h-4" />;
  }
  return <TrendingUp className="w-4 h-4" />;
};

export default function News() {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const { data: calendar, isLoading, isFetching, refetch } = trpc.calendar.getEvents.useQuery();
  const response = calendar as CalendarResponse | undefined;
  const events = response?.events ?? [];

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      void refetch();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (response?.refreshedAt) {
      setLastRefresh(new Date(response.refreshedAt));
    }
  }, [response?.refreshedAt]);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.impact === filter);

  const handleRefresh = () => {
    void refetch();
  };

  const formatLastRefresh = () => {
    if (!lastRefresh) return 'not yet';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastRefresh.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-full bg-[#0b1117]">
      <div className="mx-auto w-full max-w-[1640px] px-5 py-7 lg:px-8 lg:py-9">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-[oklch(0.72_0.18_145_/_0.18)] bg-[oklch(0.72_0.18_145_/_0.09)]"><Calendar className="w-5 h-5 text-[oklch(0.72_0.18_145)]" /></div>
            <div><p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[oklch(0.72_0.18_145)]">Macro catalyst watch</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">Economic Calendar</h1></div>
          </div>
          <p className="text-slate-500 text-sm">
            Live economic events — U.S. Eastern Time (ET) — auto-refreshes every five minutes
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-3 flex-wrap items-center">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-[oklch(0.72_0.18_145)] text-slate-950 hover:bg-[oklch(0.78_0.18_145)]' : 'border-white/[0.09] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'}
          >
            All Events
          </Button>
          <Button
            onClick={() => setFilter('high')}
            variant={filter === 'high' ? 'default' : 'outline'}
            className={filter === 'high' ? 'bg-red-500 text-white hover:bg-red-400' : 'border-white/[0.09] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'}
          >
            High Impact
          </Button>
          <Button
            onClick={() => setFilter('medium')}
            variant={filter === 'medium' ? 'default' : 'outline'}
            className={filter === 'medium' ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' : 'border-white/[0.09] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'}
          >
            Medium Impact
          </Button>
          <Button
            onClick={() => setFilter('low')}
            variant={filter === 'low' ? 'default' : 'outline'}
            className={filter === 'low' ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'border-white/[0.09] bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white'}
          >
            Low Impact
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-400">
              Last refresh: {formatLastRefresh()}
            </span>
            <Button
              onClick={handleRefresh}
              disabled={isFetching}
              className="border border-white/[0.09] bg-white/[0.035] text-slate-300 hover:bg-white/[0.07] hover:text-white gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {isLoading && events.length === 0 ? (
            <Card className="border-white/[0.08] bg-[#111923] p-8 text-center">
              <p className="text-slate-400">Loading economic calendar...</p>
            </Card>
          ) : response?.sourceStatus === 'unavailable' ? (
            <Card className="border-amber-500/30 bg-[#111923] p-8 text-center">
              <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-3" />
              <p className="text-white font-medium">Live calendar temporarily unavailable</p>
              <p className="text-slate-400 mt-2 text-sm">
                {response.message ?? 'The ForexFactory source could not be reached. No substitute events are shown.'}
              </p>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="border-white/[0.08] bg-[#111923] p-8 text-center">
              <p className="text-slate-400">No live events found for the selected filter</p>
            </Card>
          ) : (
            filteredEvents.map(event => {
              const displayTime = toEasternCalendarDisplay(event.date, event.time);
              const country = getCalendarCountry(event.country);

              return <Card
                key={event.id}
                className="border-white/[0.08] bg-[#111923] p-6 shadow-[0_10px_22px_rgba(0,0,0,0.10)] transition-colors hover:border-white/[0.15]"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Date & Time */}
                  <div className="md:col-span-2">
                    <div className="text-sm text-slate-400">
                      {displayTime.dateLabel}
                    </div>
                    <div className="text-lg font-mono text-cyan-400 font-semibold">
                      {displayTime.timeLabel}
                    </div>
                  </div>

                  {/* Country & Event */}
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider mb-1">
                      <span
                        className="inline-flex h-6 w-7 items-center justify-center rounded bg-slate-700/80 text-base leading-none ring-1 ring-white/10"
                        role="img"
                        aria-label={`${country.label} flag`}
                      >
                        {country.flag}
                      </span>
                      <span className="font-semibold text-slate-300">{event.country}</span>
                      <span className="normal-case tracking-normal text-slate-500">{country.label}</span>
                    </div>
                    <div className="text-base text-white font-medium">
                      {event.event}
                    </div>
                  </div>

                  {/* Impact Badge */}
                  <div className="md:col-span-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getImpactColor(event.impact)}`}>
                      {getImpactIcon(event.impact)}
                      <span className="capitalize">{event.impact} Impact</span>
                    </div>
                  </div>

                  {/* Forecast & Previous */}
                  <div className="md:col-span-4">
                    <div className="grid grid-cols-2 gap-4">
                      {event.forecast && (
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Forecast
                          </div>
                          <div className="text-base font-mono text-slate-200">
                            {event.forecast}
                          </div>
                        </div>
                      )}
                      {event.previous && (
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                            Previous
                          </div>
                          <div className="text-base font-mono text-slate-400">
                            {event.previous}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            })
          )}
        </div>

        {/* Info Box */}
        <Card className="mt-8 border-white/[0.08] bg-[#111923] p-6">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">About Economic Calendar</h3>
              <p className="text-slate-400 text-sm">
                This calendar retrieves the structured ForexFactory weekly feed and checks for fresh data every five minutes. The source provides UTC timestamps; Trade Fusion Journal converts them to U.S. Eastern Time (ET) with daylight-saving adjustments. No mock calendar events are used: if the source is unavailable, the page says so.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
