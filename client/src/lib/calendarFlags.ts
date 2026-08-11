export type CalendarCountry = {
  flag: string;
  label: string;
};

const CALENDAR_COUNTRIES: Record<string, CalendarCountry> = {
  AED: { flag: "🇦🇪", label: "United Arab Emirates" },
  ARS: { flag: "🇦🇷", label: "Argentina" },
  AUD: { flag: "🇦🇺", label: "Australia" },
  BRL: { flag: "🇧🇷", label: "Brazil" },
  CAD: { flag: "🇨🇦", label: "Canada" },
  CHF: { flag: "🇨🇭", label: "Switzerland" },
  CLP: { flag: "🇨🇱", label: "Chile" },
  CNY: { flag: "🇨🇳", label: "China" },
  COP: { flag: "🇨🇴", label: "Colombia" },
  DKK: { flag: "🇩🇰", label: "Denmark" },
  EUR: { flag: "🇪🇺", label: "European Union" },
  GBP: { flag: "🇬🇧", label: "United Kingdom" },
  HKD: { flag: "🇭🇰", label: "Hong Kong" },
  IDR: { flag: "🇮🇩", label: "Indonesia" },
  ILS: { flag: "🇮🇱", label: "Israel" },
  INR: { flag: "🇮🇳", label: "India" },
  JPY: { flag: "🇯🇵", label: "Japan" },
  KRW: { flag: "🇰🇷", label: "South Korea" },
  MXN: { flag: "🇲🇽", label: "Mexico" },
  MYR: { flag: "🇲🇾", label: "Malaysia" },
  NOK: { flag: "🇳🇴", label: "Norway" },
  NZD: { flag: "🇳🇿", label: "New Zealand" },
  PHP: { flag: "🇵🇭", label: "Philippines" },
  PLN: { flag: "🇵🇱", label: "Poland" },
  RUB: { flag: "🇷🇺", label: "Russia" },
  SAR: { flag: "🇸🇦", label: "Saudi Arabia" },
  SEK: { flag: "🇸🇪", label: "Sweden" },
  SGD: { flag: "🇸🇬", label: "Singapore" },
  THB: { flag: "🇹🇭", label: "Thailand" },
  TRY: { flag: "🇹🇷", label: "Türkiye" },
  TWD: { flag: "🇹🇼", label: "Taiwan" },
  USD: { flag: "🇺🇸", label: "United States" },
  ZAR: { flag: "🇿🇦", label: "South Africa" },
};

const UNKNOWN_COUNTRY: CalendarCountry = {
  flag: "🌐",
  label: "International",
};

export function getCalendarCountry(code: string): CalendarCountry {
  return CALENDAR_COUNTRIES[code.trim().toUpperCase()] ?? UNKNOWN_COUNTRY;
}
