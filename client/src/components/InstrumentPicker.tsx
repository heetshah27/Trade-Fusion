import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InstrumentBadge } from "@/components/InstrumentBadge";
import {
  INSTRUMENT_PICKER_GROUPS,
  INSTRUMENT_PICKER_OPTIONS,
  filterInstrumentPickerOptions,
  getInstrumentProfile,
  type InstrumentCategory,
  type InstrumentPickerOption,
} from "@/lib/tradeInstruments";

type Props = {
  symbol: string;
  category?: string;
  onSelect: (instrument: Pick<InstrumentPickerOption, "symbol" | "category">) => void;
};

export function InstrumentPicker({ symbol, category, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<(typeof INSTRUMENT_PICKER_GROUPS)[number]>("All");
  const selected = INSTRUMENT_PICKER_OPTIONS.find((instrument) => instrument.symbol === symbol.toUpperCase());
  const profile = getInstrumentProfile(symbol, category);
  const filtered = useMemo(() => {
    return filterInstrumentPickerOptions(query).filter((instrument) => {
      const matchesGroup = group === "All" || instrument.group === group;
      return matchesGroup;
    });
  }, [group, query]);

  function choose(instrument: InstrumentPickerOption) {
    onSelect({ symbol: instrument.symbol, category: instrument.category });
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="instrument-picker-panel"
        onClick={() => setOpen((current) => !current)}
        className="h-10 w-full justify-between border-border bg-input px-3 font-mono text-sm hover:border-primary/50"
      >
        <span className="flex min-w-0 items-center gap-2">
          {symbol ? <InstrumentBadge symbol={symbol} category={profile.category} size="sm" /> : <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-dashed border-slate-600 text-[10px] text-slate-500">+</span>}
          <span className="truncate text-left">{selected ? `${selected.symbol} · ${selected.name}` : symbol ? `${symbol.toUpperCase()} · Custom instrument` : "Choose an instrument"}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <section
          id="instrument-picker-panel"
          role="dialog"
          aria-label="Visual instrument picker"
          className="absolute z-50 mt-2 w-full min-w-[19rem] rounded-xl border border-slate-700/90 bg-[#0b1423] p-3 shadow-2xl shadow-black/45"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
            <Input autoFocus aria-label="Search instruments" placeholder="Search gold, xau, Bitcoin, NASDAQ…" value={query} onChange={(event) => setQuery(event.target.value)} className="h-9 border-0 bg-transparent px-0 text-sm focus-visible:ring-0" />
            <Button type="button" variant="ghost" size="icon" aria-label="Close instrument picker" onClick={() => setOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white"><X className="h-4 w-4" /></Button>
          </div>
          <div role="tablist" aria-label="Instrument categories" className="mt-3 flex gap-1 overflow-x-auto pb-1">
            {INSTRUMENT_PICKER_GROUPS.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={group === item} onClick={() => setGroup(item)} className={`shrink-0 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors ${group === item ? "bg-primary/20 text-primary" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"}`}>{item}</button>
            ))}
          </div>
          <div role="listbox" aria-label="Available instruments" className="mt-3 grid max-h-64 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
            {filtered.map((instrument) => {
              const active = instrument.symbol === symbol.toUpperCase();
              return <button key={instrument.symbol} type="button" role="option" aria-selected={active} onClick={() => choose(instrument)} className={`flex min-w-0 items-center gap-2 rounded-lg border p-2 text-left transition-all ${active ? "border-primary/60 bg-primary/10" : "border-transparent hover:border-slate-700 hover:bg-slate-800/85"}`}>
                <InstrumentBadge symbol={instrument.symbol} category={instrument.category} size="sm" />
                <span className="min-w-0 flex-1"><span className="block font-mono text-xs font-semibold text-slate-100">{instrument.symbol}</span><span className="block truncate text-[10px] text-slate-500">{instrument.name}</span></span>
                {active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
              </button>;
            })}
          </div>
          {!filtered.length && <p className="py-5 text-center text-xs text-slate-500">No listed instrument matches. Use the custom symbol field below.</p>}
          <p className="mt-3 border-t border-slate-800 pt-2 text-[10px] leading-4 text-slate-500">Selection fills the symbol and market category. You can still enter any custom symbol below.</p>
        </section>
      )}
    </div>
  );
}
