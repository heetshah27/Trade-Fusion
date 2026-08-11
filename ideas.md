# Trade Journal — Design Ideas

## Three Approaches

### 1. Trading Terminal
Dark sidebar, crisp data tables, monospaced numbers, green/red P&L highlights — feels like a Bloomberg terminal but approachable.
**Probability:** 0.07

### 2. Ledger Notebook
Off-white parchment background, serif headings, ink-line dividers — like a hand-written accounting ledger brought digital.
**Probability:** 0.04

### 3. Minimal Spreadsheet
Pure white, thin borders, no decoration — mimics Excel/Google Sheets as closely as possible.
**Probability:** 0.02

---

## Chosen Approach: Trading Terminal

**Design Movement:** Professional financial dashboard — Bloomberg-meets-modern-SaaS

**Core Principles:**
- Data density without clutter: every pixel earns its place
- Color as signal: green = profit, red = loss, grey = neutral — never decorative
- Monospaced numerics for instant scanability
- Structured hierarchy: summary stats → journal table → entry form

**Color Philosophy:**
- Background: deep slate `oklch(0.14 0.01 240)` — serious, focused
- Surface: slightly lighter slate `oklch(0.18 0.01 240)` for cards/panels
- Profit green: `oklch(0.72 0.18 145)` — vivid but not garish
- Loss red: `oklch(0.65 0.22 25)` — clear warning without alarm
- Accent blue: `oklch(0.62 0.18 240)` — primary actions
- Text: near-white `oklch(0.92 0.005 240)`

**Layout Paradigm — Dashboard Refresh:**
- A persistent left navigation rail establishes a proper workspace: **Journal** and **Market Calendar** are distinct views, not just header links.
- A compact utility bar holds workspace context, search/filter controls, export, and the primary **Log Trade** action.
- The main pane uses layered metric modules, a performance snapshot, and a dense journal ledger rather than treating the table as the entire product.
- The visual reference is modern trader-workspace density: dark surfaces, clear KPI hierarchy, rounded but restrained panels, and direct task-focused navigation. Trade Fusion branding remains original.

**Signature Elements:**
- Row-level color wash: profit rows glow faintly green, loss rows glow faintly red
- Monospaced font (JetBrains Mono) for all numbers
- Thin horizontal rules between rows, no vertical borders
- Left-rail active state: a narrow profit-green indicator and softly illuminated nav surface
- Dashboard metric panels: clear value, compact comparison label, and only signal-based color

**Interaction Philosophy:**
- Click any row to expand/edit inline
- Instant recalculation of totals on every keystroke
- Smooth color transitions when P&L crosses zero

**Animation:**
- Row entrance: fade-in + slight translateY(4px) over 150ms ease-out
- P&L color transition: 200ms ease when value changes sign
- Button press: scale(0.97) 160ms

**Typography System:**
- Display/headings: "Space Grotesk" — geometric, modern
- Body: "Inter" — clean, readable
- Numbers: "JetBrains Mono" — monospaced, precise

**Brand Essence:** The trader's second brain — fast, precise, honest.
Personality: Sharp, Reliable, Focused.

**Brand Voice:** Headlines are terse and data-forward. CTAs are action verbs. No fluff.
Example lines: "Every trade. Every day." / "Log it. Learn from it."

**Wordmark & Logo:** A stylized candlestick chart icon — single green body, red wick — as a compact square mark.

**Signature Brand Color:** Profit green `oklch(0.72 0.18 145)`

## Style Decisions

## Premium Product Theme Reference

Reference reviewed: <https://www.tradefxbook.com/>.

The reference uses a deep navy product environment, a blue-led action hierarchy, generous rounded card surfaces, high-contrast performance figures, concise navigation, and a polished app-preview feel. Trade Fusion uses these **general visual principles only**: it retains its own name, workspace architecture, copy, iconography, data model, and profit/loss semantics. In Trade Fusion, blue signals workspace actions and navigation; green and red remain reserved for positive and negative market outcomes.
