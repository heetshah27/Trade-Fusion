import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
}

// Mock economic calendar data — will be replaced with real API
const MOCK_EVENTS: EconomicEvent[] = [
  {
    id: '1',
    date: '2026-08-10',
    time: '13:30',
    country: 'US',
    event: 'Non-Farm Payroll',
    impact: 'high',
    forecast: '175K',
    previous: '206K',
  },
  {
    id: '2',
    date: '2026-08-10',
    time: '12:00',
    country: 'US',
    event: 'Unemployment Rate',
    impact: 'high',
    forecast: '4.0%',
    previous: '4.0%',
  },
  {
    id: '3',
    date: '2026-08-11',
    time: '14:00',
    country: 'EU',
    event: 'ECB Interest Rate Decision',
    impact: 'high',
    forecast: '3.75%',
    previous: '3.75%',
  },
  {
    id: '4',
    date: '2026-08-12',
    time: '08:30',
    country: 'UK',
    event: 'Retail Sales MoM',
    impact: 'medium',
    forecast: '0.5%',
    previous: '-0.3%',
  },
  {
    id: '5',
    date: '2026-08-13',
    time: '16:00',
    country: 'US',
    event: 'CPI YoY',
    impact: 'high',
    forecast: '2.8%',
    previous: '2.9%',
  },
  {
    id: '6',
    date: '2026-08-14',
    time: '10:00',
    country: 'JP',
    event: 'Industrial Production MoM',
    impact: 'medium',
    forecast: '1.2%',
    previous: '-0.5%',
  },
];

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-300';
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
  const [events, setEvents] = useState<EconomicEvent[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [loading, setLoading] = useState(false);

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.impact === filter);

  const handleRefresh = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
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
            Upcoming economic events and their market impact
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-3 flex-wrap">
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
          <Button
            onClick={handleRefresh}
            disabled={loading}
            className="ml-auto bg-slate-700 hover:bg-slate-600"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700 p-8 text-center">
              <p className="text-slate-400">No events found for the selected filter</p>
            </Card>
          ) : (
            filteredEvents.map(event => (
              <Card
                key={event.id}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all p-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Date & Time */}
                  <div className="md:col-span-2">
                    <div className="text-sm text-slate-400">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="text-lg font-mono text-cyan-400 font-semibold">
                      {event.time}
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
            ))
          )}
        </div>

        {/* Info Box */}
        <Card className="bg-slate-800 border-slate-700 p-6 mt-8">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-white font-semibold mb-2">About Economic Calendar</h3>
              <p className="text-slate-400 text-sm">
                High-impact events can cause significant market volatility. Use this calendar to plan your trades and manage risk accordingly. Times are displayed in your local timezone.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
