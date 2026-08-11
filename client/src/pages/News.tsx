import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'holiday':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white font-display">Economic Calendar</h1>
          </div>
          <p className="text-slate-400 text-lg">
            Live economic events — U.S. Eastern Time (ET) — auto-refreshes every 5 minutes
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-3 flex-wrap items-center">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
          >
            All Events
          </Button>
          <Button
            onClick={() => setFilter('high')}
            variant={filter === 'high' ? 'default' : 'outline'}
            className={filter === 'high' ? 'bg-red-500 hover:bg-red-600' : ''}
          >
            High Impact
          </Button>
          <Button
            onClick={() => setFilter('medium')}
            variant={filter === 'medium' ? 'default' : 'outline'}
            className={filter === 'medium' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
          >
            Medium Impact
          </Button>
          <Button
            onClick={() => setFilter('low')}
            variant={filter === 'low' ? 'default' : 'outline'}
            className={filter === 'low' ? 'bg-green-500 hover:bg-green-600' : ''}
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
              className="bg-slate-700 hover:bg-slate-600 gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh Now'}
            </Button>
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {isLoading && events.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400">Loading economic calendar...</p>
            </Card>
          ) : response?.sourceStatus === 'unavailable' ? (
            <Card className="bg-slate-800 border-amber-500/40 p-8 text-center">
              <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-3" />
              <p className="text-white font-medium">Live calendar temporarily unavailable</p>
              <p className="text-slate-400 mt-2 text-sm">
                {response.message ?? 'The ForexFactory source could not be reached. No substitute events are shown.'}
              </p>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400">No live events found for the selected filter</p>
            </Card>
          ) : (
            filteredEvents.map(event => {
              const displayTime = toEasternCalendarDisplay(event.date, event.time);

              return <Card
                key={event.id}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all p-6"
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
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                      {event.country}
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
        <Card className="bg-slate-800 border-slate-700 p-6 mt-8">
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
