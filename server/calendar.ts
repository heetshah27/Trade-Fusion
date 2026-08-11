import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: "high" | "medium" | "low";
  forecast?: string;
  previous?: string;
  actual?: string;
}

// Fallback mock data in case scraping fails
const FALLBACK_EVENTS: EconomicEvent[] = [
  {
    id: "1",
    date: new Date().toISOString().split("T")[0],
    time: "13:30",
    country: "US",
    event: "Non-Farm Payroll",
    impact: "high",
    forecast: "175K",
    previous: "206K",
  },
  {
    id: "2",
    date: new Date().toISOString().split("T")[0],
    time: "12:00",
    country: "US",
    event: "Unemployment Rate",
    impact: "high",
    forecast: "4.0%",
    previous: "4.0%",
  },
  {
    id: "3",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "14:00",
    country: "EU",
    event: "ECB Interest Rate Decision",
    impact: "high",
    forecast: "3.75%",
    previous: "3.75%",
  },
  {
    id: "4",
    date: new Date(Date.now() + 172800000).toISOString().split("T")[0],
    time: "08:30",
    country: "UK",
    event: "Retail Sales MoM",
    impact: "medium",
    forecast: "0.5%",
    previous: "-0.3%",
  },
  {
    id: "5",
    date: new Date(Date.now() + 259200000).toISOString().split("T")[0],
    time: "16:00",
    country: "US",
    event: "CPI YoY",
    impact: "high",
    forecast: "2.8%",
    previous: "2.9%",
  },
];

async function scrapeForexFactory(): Promise<EconomicEvent[]> {
  try {
    const response = await fetch("https://www.forexfactory.com/calendar.php", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.warn("ForexFactory request failed, using fallback data");
      return FALLBACK_EVENTS;
    }

    const html = await response.text();

    // Parse the HTML to extract calendar events
    // This is a simplified parser — ForexFactory HTML structure may vary
    const events: EconomicEvent[] = [];
    let eventId = 0;

    // Look for event rows in the calendar table
    const eventPattern =
      /<tr[^>]*class="[^"]*calendar__row[^"]*"[^>]*>[\s\S]*?<\/tr>/g;
    const matches = html.match(eventPattern) || [];

    matches.slice(0, 20).forEach((row) => {
      try {
        // Extract date
        const dateMatch = row.match(
          /<td[^>]*class="[^"]*calendar__date[^"]*"[^>]*>([^<]+)<\/td>/
        );
        const date = dateMatch ? dateMatch[1].trim() : "";

        // Extract time
        const timeMatch = row.match(
          /<td[^>]*class="[^"]*calendar__time[^"]*"[^>]*>([^<]+)<\/td>/
        );
        const time = timeMatch ? timeMatch[1].trim() : "";

        // Extract country
        const countryMatch = row.match(
          /<td[^>]*class="[^"]*calendar__country[^"]*"[^>]*>([A-Z]{2})<\/td>/
        );
        const country = countryMatch ? countryMatch[1].trim() : "";

        // Extract event name
        const eventMatch = row.match(
          /<td[^>]*class="[^"]*calendar__event[^"]*"[^>]*>([^<]+)<\/td>/
        );
        const event = eventMatch ? eventMatch[1].trim() : "";

        // Extract impact (red=high, orange=medium, yellow=low)
        const impactMatch = row.match(
          /class="[^"]*calendar__impact[^"]*"[^>]*style="[^"]*background-color:\s*([^;]+)/
        );
        let impact: "high" | "medium" | "low" = "low";
        if (impactMatch) {
          const color = impactMatch[1].toLowerCase();
          if (color.includes("red")) impact = "high";
          else if (color.includes("orange")) impact = "medium";
          else impact = "low";
        }

        // Extract forecast
        const forecastMatch = row.match(
          /<td[^>]*class="[^"]*calendar__forecast[^"]*"[^>]*>([^<]+)<\/td>/
        );
        const forecast = forecastMatch ? forecastMatch[1].trim() : undefined;

        // Extract previous
        const previousMatch = row.match(
          /<td[^>]*class="[^"]*calendar__previous[^"]*"[^>]*>([^<]+)<\/td>/
        );
        const previous = previousMatch ? previousMatch[1].trim() : undefined;

        if (event && country && time) {
          events.push({
            id: String(eventId++),
            date: date || new Date().toISOString().split("T")[0],
            time,
            country,
            event,
            impact,
            forecast,
            previous,
          });
        }
      } catch (e) {
        // Skip malformed rows
      }
    });

    // Return scraped events or fallback if parsing failed
    return events.length > 0 ? events : FALLBACK_EVENTS;
  } catch (error) {
    console.error("ForexFactory scraping error:", error);
    // Return fallback data on any error
    return FALLBACK_EVENTS;
  }
}

export const calendarRouter = router({
  getEvents: publicProcedure.query(async () => {
    const events = await scrapeForexFactory();
    return events;
  }),
});
