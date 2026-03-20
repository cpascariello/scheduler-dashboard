# Dashboard Marketing Polish — Design Spec

Three targeted enhancements to make the dashboard more appealing to prospective node operators and people evaluating Aleph Cloud vs competitors (Akash, Flux, Render Network), without compromising its utility as an ops tool.

**Design philosophy:** No signature hue. Premium through craft quality — typography precision, motion choreography, and data visualization. Semantic colors (green/red/amber) stay pure for status. Brand identity comes from how things move and feel.

**Research context:** Analyzed RunPod, Vercel, Railway, DigitalOcean, Cloudflare, Datadog, Grafana, and Linear. Key finding: every premium dashboard has a visual signature identifiable in a blurred screenshot. Ours is the credits flow particle animation and the glassmorphism stat cards. These enhancements amplify that identity.

---

## 1. Typography & Motion System

### 1A. Monospace for technical data

`Source Code Pro` is already loaded via Google Fonts (`layout.tsx` line 68). Define `--font-mono: 'Source Code Pro', ui-monospace, monospace` in `globals.css` to override Tailwind's default `font-mono` stack.

**Three-tier typography hierarchy:**

| Tier | Font | Usage |
|------|------|-------|
| Headings | Rigid Square (Typekit) | Page titles, section headers, stat card numbers |
| Body | Titillium Web (Typekit) | Labels, descriptions, UI text, buttons, navigation |
| Data | Source Code Pro (Google Fonts) | Hashes, timestamps, numeric values, API paths, ALEPH amounts |

**Where monospace applies:**
- Hashes — `CopyableText` instances, table cells, detail views, wallet addresses
- Timestamps — tables, detail panels, activity timeline
- Numbers — stat card hero numbers (with `tabular-nums`), table counts, response times, ALEPH amounts
- API paths — status page (already monospace)
- **Not applied to:** labels, descriptions, UI text, buttons, navigation

**Implementation:**
- Add `--font-mono` variable in `globals.css`
- Tailwind's `font-mono` utility will resolve to Source Code Pro
- Audit existing `font-mono` usage (status page already uses it) — extend to tables, detail views, stat numbers
- Stat card hero numbers in `stats-bar.tsx` get `font-mono tabular-nums`

### 1B. Motion choreography

First-load entrance animations only. No animation on routine data updates, filter changes, or polling refreshes.

**Motion inventory:**

| Animation | Where | Duration | Details |
|-----------|-------|----------|---------|
| Slot-roll numbers | Overview stat card numbers, credits total, network health stats | ~800ms | Billboard/departure-board effect. Each digit sits in a masked container (`overflow: hidden`). On first mount, digits translate from bottom to top into view — only visible inside the container, clipped outside. Stagger per digit (left to right, ~50ms apart) for a rolling cascade. Uses `requestAnimationFrame` with ease-out. Only triggers once — subsequent polling updates show final value instantly. Handles integers and floats (credits counter has decimals). |
| Staggered entrance | Overview stat cards + content cards | 400ms each, 60ms stagger | Fade + translateY(8px → 0). CSS `animation-delay` via inline `style`. Uses shared easing. |
| Shared easing | All entrance animations | — | `--ease-spring: cubic-bezier(0.16, 1, 0.3, 1)` CSS custom property. Spring-like deceleration. |
| Reduced motion | All animations | — | `@media (prefers-reduced-motion: reduce)` disables entrance animations. Slot-roll shows final value immediately (no translate). |

**Existing animations preserved as-is:**
- Donut ring draw (stroke-dashoffset, 1.2s) — already has good timing
- Credit flow particles — already animated
- Status page fade-in — already staggered
- Poll ring on sidebar — already animated

**New files:**
- `src/hooks/use-slot-roll.ts` — `useSlotRoll(target: number, opts?: { duration?: number, decimals?: number })` returns an array of `{ digit: string, offset: number }` entries (one per character including commas/periods). Each `offset` animates from 100% → 0% (translateY) on mount, staggered ~50ms per digit left-to-right. Checks `matchMedia('(prefers-reduced-motion: reduce)')` — if true, returns all offsets at 0 immediately.
- `src/components/slot-roll-number.tsx` — `SlotRollNumber` component. Renders each digit in an `overflow-hidden` container with `translateY(offset%)`. Non-digit characters (commas, periods, ℵ prefix) appear without animation. Accepts `className` for font/size styling.

**Modified files:**
- `src/app/globals.css` — add `--font-mono`, `--ease-spring`, `@keyframes card-entrance`, reduced-motion media query
- `src/components/stats-bar.tsx` — apply `card-entrance` animation with staggered delays, use `SlotRollNumber` for hero numbers, add `font-mono` to numbers

---

## 2. Network Health Page

Reframe the existing API Status page as a "Network Health" showcase. Same data, same endpoint checks, no new API calls. Marketing-grade presentation.

### Layout changes

**Add: Hero banner (top of page)**
- Centered layout with status pill: "All Systems Operational" (green dot + green text when all healthy) or "N endpoints degraded" (red dot + red text when failures)
- Page title "Network Health" (replaces "API Status")
- Subtitle: "Real-time status of Aleph Cloud infrastructure"
- Subtle radial glow behind the banner (white at ~2% opacity)

**Add: Quick stats bar (below hero)**
- Four metrics in a centered row: Endpoints healthy (e.g. "11/11" in green), Avg Latency (computed from endpoint results), Active Nodes, Running VMs
- Node/VM counts from `useOverviewStats()` — already cached from the overview page, no extra API call
- Avg latency computed from the `latencyMs` values already measured per endpoint
- Numbers in monospace (Source Code Pro), labels in body font
- Slot-roll animation on first load (reuses `SlotRollNumber` from Enhancement 1)

**Modify: Endpoint sections**
- Remove the large `SummaryRing` donut per section (redundant with hero banner stats)
- Keep the compact section header with title + "N/N healthy" count
- Endpoint rows stay the same (StatusDot, path, label, HTTP code, latency)
- Staggered fade-in on endpoint rows (already exists)

**Add: Footer bar**
- Last-checked timestamp + recheck button moved to a clean footer
- "Auto-refreshes every 60s" label

**Sidebar rename:**
- "API Status" → "Network Health" in the utility overflow menu (`app-sidebar.tsx`)

### Data sources

| Metric | Source | Extra API call? |
|--------|--------|-----------------|
| Endpoints healthy | Computed from probe results (already done) | No |
| Avg latency | Computed from `latencyMs` values (already measured) | No |
| Active nodes | `useOverviewStats()` → `totalNodes` | No (cached) |
| Running VMs | `useOverviewStats()` → `totalVMs` | No (cached) |

**Modified files:**
- `src/app/status/page.tsx` — restructure with hero banner, stats bar, simplified sections, footer
- `src/components/app-sidebar.tsx` — rename "API Status" → "Network Health"

---

## 3. Credits Flow Showcase Polish

The particle flow diagram is already the most distinctive visual element in the dashboard. Add framing to make it screenshot-ready and shareable.

### Additions

**Total ALEPH counter (above the flow diagram card):**
- Hero number: `ℵ 142,847.38` — large, monospace, heading weight
- ℵ prefix (Hebrew aleph character) as currency symbol, muted color (`text-muted-foreground`)
- Integer part in white, decimal part in muted color
- Subtitle: "in the last 24 hours" / "7 days" / "30 days" — updates dynamically from the existing tab selection
- Label above: "Total ALEPH Distributed" — uppercase, small, wide letter-spacing
- Slot-roll animation on first load (reuses `SlotRollNumber`). Handles decimal formatting for ALEPH amounts.
- Value comes from `summary.totalAleph` (already computed in `DistributionSummary`)

**"Powered by Aleph Cloud" watermark (below the flow diagram card):**
- Very low opacity text (`text-foreground/10` or similar)
- Uppercase, wide letter-spacing, small font size
- Self-attributing for screenshots without being distracting

**Flow diagram unchanged:**
- Particle animation, bezier paths, hover interaction, gradient strokes — all stay exactly as-is
- No changes to `credit-flow-diagram.tsx`

**Modified files:**
- `src/app/credits/page.tsx` — add total counter section above `CreditFlowDiagram`, watermark below

---

## Out of scope

- No brand color changes (lime accent usage stays as-is)
- No changes to nodes/VMs/issues/wallet pages (beyond monospace font propagation via `font-mono`)
- No new API calls or backend changes
- No historical data or uptime tracking
- No changes to the flow diagram visualization itself
- No mobile-specific adaptations (these enhancements work at all breakpoints as-is)
