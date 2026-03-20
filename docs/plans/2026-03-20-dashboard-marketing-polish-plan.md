# Dashboard Marketing Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add typography layering, entrance animations, and visual polish to make the dashboard more appealing to prospective operators evaluating Aleph Cloud.

**Architecture:** Three independent enhancements: (1) monospace font variable + slot-roll number animation component + staggered card entrances, (2) Network Health page reframe of the existing status page, (3) total ALEPH counter + watermark on the credits page. All changes are client-side, no new API calls.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS 4, @aleph-front/ds, React Query

**Spec:** `docs/plans/2026-03-20-dashboard-marketing-polish-design.md`

---

## File Structure

### New files
| File | Responsibility |
|------|---------------|
| `src/hooks/use-slot-roll.ts` | Hook: animates digits from bottom-to-top with stagger. Returns array of `{ char, offset }`. Respects `prefers-reduced-motion`. |
| `src/components/slot-roll-number.tsx` | Component: renders each digit in an `overflow-hidden` container with `translateY`. Non-digit chars (commas, `.`, `ℵ`) appear without animation. |
| `src/hooks/use-slot-roll.test.ts` | Unit tests for the hook. |

### Modified files
| File | Changes |
|------|---------|
| `src/app/globals.css` | Add `--font-mono`, `--ease-spring`, `@keyframes card-entrance`, reduced-motion media query |
| `src/components/stats-bar.tsx` | Use `SlotRollNumber` for hero numbers, add `card-entrance` with stagger |
| `src/app/status/page.tsx` | Restructure: hero banner, quick stats bar, simplified sections, footer. Rename to "Network Health" |
| `src/components/app-sidebar.tsx` | Rename "API Status" → "Network Health" |
| `src/app/credits/page.tsx` | Add total ALEPH counter above flow diagram, watermark below |
| `src/changelog.ts` | Bump version, add changelog entry |
| `docs/ARCHITECTURE.md` | Document new patterns |
| `docs/DECISIONS.md` | Log design decisions |

---

### Task 1: Font variable and CSS foundations

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add `--font-mono` variable**

In `globals.css`, after the `html` block (line 13), add the font-mono override so Tailwind's `font-mono` utility resolves to Source Code Pro (already loaded in `layout.tsx` line 68):

```css
.font-mono, [class*="font-mono"] {
  font-family: 'Source Code Pro', ui-monospace, SFMono-Regular, monospace;
}
```

Actually, the cleaner Tailwind 4 approach is to set the theme variable. Add inside the `@theme` layer or directly on `:root`:

```css
:root {
  --font-mono: 'Source Code Pro', ui-monospace, SFMono-Regular, monospace;
}
```

Check if there's already a `@theme` block in globals.css — if not, the `:root` approach works.

- [ ] **Step 2: Add motion CSS variables and keyframes**

Append to `globals.css` after the existing keyframes (after line 101):

```css
:root {
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes card-entrance {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card-entrance {
    animation: none !important;
    opacity: 1 !important;
  }
}
```

- [ ] **Step 3: Verify the font variable works**

Run: `pnpm dev` and check in the browser that any element with `font-mono` class uses Source Code Pro (inspect in DevTools). The status page endpoint paths (`/health`, `/api/v1/nodes`) already use `font-mono` — they should now show in Source Code Pro.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: add font-mono variable and motion CSS foundations"
```

---

### Task 2: Slot-roll number hook

**Files:**
- Create: `src/hooks/use-slot-roll.ts`
- Create: `src/hooks/use-slot-roll.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// src/hooks/use-slot-roll.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSlotRoll } from "@/hooks/use-slot-roll";

// Mock matchMedia to simulate no reduced-motion preference
beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: false }));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSlotRoll", () => {
  it("returns formatted digits for an integer", () => {
    const { result } = renderHook(() => useSlotRoll(847));
    // Should have entries for '8', '4', '7'
    expect(result.current.map((d) => d.char)).toEqual(["8", "4", "7"]);
  });

  it("formats with commas for large numbers", () => {
    const { result } = renderHook(() =>
      useSlotRoll(142847, { formatted: true }),
    );
    expect(result.current.map((d) => d.char)).toEqual([
      "1", "4", "2", ",", "8", "4", "7",
    ]);
  });

  it("handles decimals", () => {
    const { result } = renderHook(() =>
      useSlotRoll(142847.38, { decimals: 2, formatted: true }),
    );
    const chars = result.current.map((d) => d.char);
    expect(chars).toEqual([
      "1", "4", "2", ",", "8", "4", "7", ".", "3", "8",
    ]);
  });

  it("non-digit characters have offset 0 (no animation)", () => {
    const { result } = renderHook(() =>
      useSlotRoll(1234, { formatted: true }),
    );
    const comma = result.current.find((d) => d.char === ",");
    expect(comma?.offset).toBe(0);
  });

  it("returns offset 0 immediately when reduced motion preferred", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    const { result } = renderHook(() => useSlotRoll(847));
    // All offsets should be 0 (no animation)
    expect(result.current.every((d) => d.offset === 0)).toBe(true);
  });

  it("returns offset 0 for value 0", () => {
    const { result } = renderHook(() => useSlotRoll(0));
    expect(result.current).toEqual([{ char: "0", offset: 0 }]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- src/hooks/use-slot-roll.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Implement the hook**

```typescript
// src/hooks/use-slot-roll.ts
import { useEffect, useRef, useState } from "react";

export type SlotDigit = {
  char: string;
  offset: number;
};

type SlotRollOptions = {
  duration?: number;
  decimals?: number;
  formatted?: boolean;
};

function formatNumber(
  value: number,
  decimals: number,
  formatted: boolean,
): string {
  if (formatted) {
    return decimals > 0
      ? value.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : value.toLocaleString("en-US");
  }
  return decimals > 0 ? value.toFixed(decimals) : String(value);
}

export function useSlotRoll(
  target: number,
  options?: SlotRollOptions,
): SlotDigit[] {
  const {
    duration = 800,
    decimals = 0,
    formatted = false,
  } = options ?? {};

  const chars = formatNumber(target, decimals, formatted).split("");
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  const staggerMs = digitCount > 0 ? Math.min(50, duration / (digitCount * 2)) : 0;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const hasAnimated = useRef(false);
  const [offsets, setOffsets] = useState<number[]>(() =>
    chars.map((c) => {
      if (reducedMotion || !/\d/.test(c)) return 0;
      return 100;
    }),
  );

  useEffect(() => {
    if (hasAnimated.current || reducedMotion) return;
    hasAnimated.current = true;

    let digitIdx = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < chars.length; i++) {
      if (!/\d/.test(chars[i]!)) continue;
      const idx = i;
      const delay = digitIdx * staggerMs;
      digitIdx++;

      const timer = setTimeout(() => {
        const start = performance.now();
        function tick() {
          const elapsed = performance.now() - start;
          const t = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
          const offset = 100 * (1 - eased);
          setOffsets((prev) => {
            const next = [...prev];
            next[idx] = offset;
            return next;
          });
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, delay);
      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- animate once on mount

  return chars.map((char, i) => ({
    char,
    offset: offsets[i] ?? 0,
  }));
}
```

- [ ] **Step 4: Run tests**

Run: `pnpm test -- src/hooks/use-slot-roll.test.ts`
Expected: all 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-slot-roll.ts src/hooks/use-slot-roll.test.ts
git commit -m "feat: add useSlotRoll hook for billboard number animation"
```

---

### Task 3: SlotRollNumber component

**Files:**
- Create: `src/components/slot-roll-number.tsx`

- [ ] **Step 1: Create the component**

```tsx
// src/components/slot-roll-number.tsx
"use client";

import { useSlotRoll } from "@/hooks/use-slot-roll";
import type { SlotDigit } from "@/hooks/use-slot-roll";

type SlotRollNumberProps = {
  value: number;
  decimals?: number;
  formatted?: boolean;
  duration?: number;
  className?: string;
  /** Optional prefix rendered before the number (e.g. "ℵ") */
  prefix?: React.ReactNode;
  /** Optional className for the decimal portion */
  decimalClassName?: string;
};

function Digit({ char, offset }: SlotDigit) {
  const isDigit = /\d/.test(char);

  if (!isDigit) {
    return <span>{char}</span>;
  }

  return (
    <span
      className="inline-block overflow-hidden"
      style={{ lineHeight: 1 }}
    >
      <span
        className="inline-block"
        style={{
          transform: `translateY(${offset}%)`,
          transition: offset === 0 ? "none" : undefined,
        }}
      >
        {char}
      </span>
    </span>
  );
}

export function SlotRollNumber({
  value,
  decimals = 0,
  formatted = true,
  duration,
  className,
  prefix,
  decimalClassName,
}: SlotRollNumberProps) {
  const digits = useSlotRoll(value, { decimals, formatted, duration });

  // Find the decimal point index to split styling
  const dotIndex = digits.findIndex((d) => d.char === ".");

  return (
    <span className={className}>
      {prefix}
      {digits.map((d, i) => {
        const inDecimal =
          decimalClassName && dotIndex >= 0 && i >= dotIndex;
        return (
          <span key={i} className={inDecimal ? decimalClassName : undefined}>
            <Digit {...d} />
          </span>
        );
      })}
    </span>
  );
}
```

- [ ] **Step 2: Verify it renders**

Temporarily import in the overview page or use `pnpm dev` with React DevTools. Verify digits roll up from below on first load.

- [ ] **Step 3: Commit**

```bash
git add src/components/slot-roll-number.tsx
git commit -m "feat: add SlotRollNumber component with billboard animation"
```

---

### Task 4: Stats bar — slot-roll numbers and staggered entrance

**Files:**
- Modify: `src/components/stats-bar.tsx`

- [ ] **Step 1: Import SlotRollNumber**

Add import at top of `stats-bar.tsx` (after line 4):

```typescript
import { SlotRollNumber } from "@/components/slot-roll-number";
```

- [ ] **Step 2: Replace plain number with SlotRollNumber in StatCard**

In `StatCard` (lines 126–135), replace the value rendering block:

```tsx
// BEFORE (lines 126-135):
      {isLoading ? (
        <Skeleton className="mt-3 h-11 w-24" />
      ) : (
        <p
          className="mt-3 font-heading text-4xl font-extrabold tabular-nums tracking-tight"
          {...(color ? { style: { color } } : {})}
        >
          {value ?? 0}
        </p>
      )}
```

```tsx
// AFTER:
      {isLoading ? (
        <Skeleton className="mt-3 h-11 w-24" />
      ) : (
        <p
          className="mt-3 font-heading font-mono text-4xl font-extrabold tabular-nums tracking-tight"
          {...(color ? { style: { color } } : {})}
        >
          <SlotRollNumber value={value ?? 0} formatted />
        </p>
      )}
```

Note: added `font-mono` to the className for monospace numbers.

- [ ] **Step 3: Add staggered entrance animation to stat cards**

In `StatsBar` component (line 204), add a counter to track card index for stagger delay. The simplest approach: wrap each `<Stat>` with a style that applies the `card-entrance` animation class.

In `Stat` component (lines 143-166), add the entrance animation. Modify the wrapper to include:

```tsx
function Stat(props: StatProps & { index?: number }) {
  const { href, className, index = 0, ...cardProps } = props;

  const entranceStyle: React.CSSProperties = {
    animationName: "card-entrance",
    animationDuration: "400ms",
    animationTimingFunction: "var(--ease-spring)",
    animationFillMode: "both",
    animationDelay: `${index * 60}ms`,
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {href ? (
            <Link
              href={href}
              className={`card-entrance block ${className ?? ""}`}
              style={entranceStyle}
            >
              <StatCard {...cardProps} />
            </Link>
          ) : (
            <div
              className={`card-entrance ${className ?? ""}`}
              style={entranceStyle}
            >
              <StatCard {...cardProps} />
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          {props.subtitle}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

Then in `StatsBar`, pass `index` to each `<Stat>`. The cards are at indices 0-7 (8 stat cards total). Add `index={N}` to each `<Stat>` in order:

- Total Nodes: `index={0}`
- Healthy: `index={1}`
- Total VMs: `index={2}`
- Dispatched: `index={3}`
- Unreachable: `index={4}`
- Removed: `index={5}`
- Missing: `index={6}`
- Unschedulable: `index={7}`

- [ ] **Step 4: Verify in browser**

Run: `pnpm dev`, navigate to overview page. Verify:
1. Numbers roll up from below (billboard effect)
2. Cards fade+slide in with staggered timing
3. After initial animation, polling updates show final values instantly (no re-animation)

- [ ] **Step 5: Run checks**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/components/stats-bar.tsx
git commit -m "feat: slot-roll numbers and staggered entrance on overview stats"
```

---

### Task 5: Network Health page

**Files:**
- Modify: `src/app/status/page.tsx`
- Modify: `src/components/app-sidebar.tsx`

- [ ] **Step 1: Add `useOverviewStats` import to status page**

At the top of `status/page.tsx`, add:

```typescript
import { useOverviewStats } from "@/hooks/use-overview-stats";
import { SlotRollNumber } from "@/components/slot-roll-number";
```

- [ ] **Step 2: Add hero banner component**

Add a new component above `StatusPage` in the same file:

```tsx
function HeroBanner({
  allResolved,
  allHealthy,
  degradedCount,
}: {
  allResolved: boolean;
  allHealthy: boolean;
  degradedCount: number;
}) {
  const isHealthy = allResolved && allHealthy;
  const statusColor = isHealthy
    ? "var(--color-success-500)"
    : "var(--color-error-500)";
  const statusText = !allResolved
    ? "Checking endpoints\u2026"
    : isHealthy
      ? "All Systems Operational"
      : `${degradedCount} endpoint${degradedCount === 1 ? "" : "s"} degraded`;

  return (
    <div className="mb-8 text-center">
      <div className="relative inline-block">
        {/* Subtle glow */}
        <div
          className="absolute -top-8 left-1/2 h-20 w-60 -translate-x-1/2 rounded-full opacity-100"
          style={{
            background: `radial-gradient(ellipse, ${isHealthy ? "rgba(74,222,128,0.04)" : "rgba(248,113,113,0.04)"}, transparent 70%)`,
          }}
        />
        <div
          className="relative inline-flex items-center gap-2.5 rounded-full border px-5 py-2"
          style={{
            backgroundColor: isHealthy
              ? "rgba(74,222,128,0.06)"
              : "rgba(248,113,113,0.06)",
            borderColor: isHealthy
              ? "rgba(74,222,128,0.12)"
              : "rgba(248,113,113,0.12)",
          }}
        >
          <span
            className="size-2 rounded-full"
            style={{
              backgroundColor: allResolved ? statusColor : "var(--color-neutral-400)",
              boxShadow: allResolved
                ? `0 0 8px ${isHealthy ? "rgba(74,222,128,0.4)" : "rgba(248,113,113,0.4)"}`
                : "none",
            }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: allResolved ? statusColor : "var(--color-muted-foreground)" }}
          >
            {statusText}
          </span>
        </div>
      </div>
      <h1 className="mt-6 text-4xl">Network Health</h1>
      <p className="mt-2 text-base text-muted-foreground">
        Real-time status of Aleph Cloud infrastructure
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Add quick stats bar component**

Add below `HeroBanner`:

```tsx
function QuickStatsBar({
  endpointsHealthy,
  endpointsTotal,
  avgLatencyMs,
  totalNodes,
  totalVMs,
  isStatsLoading,
}: {
  endpointsHealthy: number;
  endpointsTotal: number;
  avgLatencyMs: number | null;
  totalNodes: number | undefined;
  totalVMs: number | undefined;
  isStatsLoading: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap justify-center gap-x-12 gap-y-4 border-y border-foreground/[0.04] py-5">
      <div className="text-center">
        <p className="font-heading font-mono text-2xl font-extrabold tabular-nums" style={{ color: "var(--color-success-500)" }}>
          <SlotRollNumber value={endpointsHealthy} />/{endpointsTotal}
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
          Endpoints
        </p>
      </div>
      {avgLatencyMs !== null && (
        <div className="text-center">
          <p className="font-heading font-mono text-2xl font-extrabold tabular-nums">
            <SlotRollNumber value={avgLatencyMs} />
            <span className="ml-0.5 text-sm font-normal text-muted-foreground/60">ms</span>
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Avg Latency
          </p>
        </div>
      )}
      {!isStatsLoading && totalNodes !== undefined && (
        <div className="text-center">
          <p className="font-heading font-mono text-2xl font-extrabold tabular-nums">
            <SlotRollNumber value={totalNodes} formatted />
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Active Nodes
          </p>
        </div>
      )}
      {!isStatsLoading && totalVMs !== undefined && (
        <div className="text-center">
          <p className="font-heading font-mono text-2xl font-extrabold tabular-nums">
            <SlotRollNumber value={totalVMs} formatted />
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Running VMs
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Simplify StatusSection — remove SummaryRing**

Replace the `SummaryRing` component entirely (lines 157-207 — delete it). In `StatusSection`, replace the header to use a simple text count instead of the donut ring:

```tsx
function StatusSection({
  title,
  baseUrl,
  results,
}: {
  title: string;
  baseUrl: string;
  results: EndpointResult[];
}) {
  const healthyCount = results.filter((r) => r.status === "healthy").length;
  const totalCount = results.length;

  return (
    <section className="stat-card border border-edge bg-surface/80 backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-edge px-5 py-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {healthyCount}/{totalCount} healthy
        </span>
      </div>
      <ul className="divide-y divide-edge/50">
        {results.map((r, i) => (
          <EndpointRow key={r.path} result={r} baseUrl={baseUrl} index={i} />
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 5: Restructure StatusPage**

Replace the `StatusPage` component's return statement. Add `useOverviewStats` call and compute avg latency:

```tsx
export default function StatusPage() {
  // ... existing state and hooks stay ...
  const { data: stats, isLoading: statsLoading } = useOverviewStats();

  // ... existing runChecks callback stays ...

  // Compute avg latency from resolved results
  const allResults = [...schedulerResults, ...alephResults];
  const totalHealthy = allResults.filter((r) => r.status === "healthy").length;
  const totalEndpoints = allResults.length;
  const allResolved = allResults.every((r) => r.status !== "pending");
  const allHealthy = allResolved && totalHealthy === totalEndpoints;
  const degradedCount = totalEndpoints - totalHealthy;

  const resolvedLatencies = allResults
    .filter((r) => r.latencyMs !== null)
    .map((r) => r.latencyMs!);
  const avgLatencyMs =
    resolvedLatencies.length > 0
      ? Math.round(
          resolvedLatencies.reduce((a, b) => a + b, 0) /
            resolvedLatencies.length,
        )
      : null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <HeroBanner
        allResolved={allResolved}
        allHealthy={allHealthy}
        degradedCount={degradedCount}
      />

      <QuickStatsBar
        endpointsHealthy={totalHealthy}
        endpointsTotal={totalEndpoints}
        avgLatencyMs={avgLatencyMs}
        totalNodes={stats?.totalNodes}
        totalVMs={stats?.totalVMs}
        isStatsLoading={statsLoading}
      />

      <div className="space-y-6">
        <StatusSection
          title="Scheduler API"
          baseUrl={schedulerBase}
          results={schedulerResults}
        />
        <StatusSection
          title="Aleph API"
          baseUrl={alephBase}
          results={alephResults}
        />
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-center gap-3 border-t border-foreground/[0.04] pt-4">
        <span className="text-xs text-muted-foreground/60">
          Auto-refreshes every 60s
        </span>
        {lastChecked && (
          <>
            <span className="text-muted-foreground/30">·</span>
            <span className="font-mono text-xs tabular-nums text-muted-foreground/60">
              {lastChecked.toLocaleTimeString()}
            </span>
          </>
        )}
        <Button
          variant="text"
          size="xs"
          className="shrink-0"
          iconLeft={<Pulse className={checking ? "animate-pulse" : ""} />}
          onClick={runChecks}
          disabled={checking}
        >
          {checking ? "Checking" : "Recheck"}
        </Button>
      </div>
    </div>
  );
}
```

Remove the old header block (the `flex items-start justify-between` div with the h1 and subtitle).

- [ ] **Step 6: Rename sidebar entry**

In `src/components/app-sidebar.tsx`, find `"API Status"` (line 206) and replace with `"Network Health"`. There are two occurrences in the file — one in the link label and the utility check logic — only rename the label text.

- [ ] **Step 7: Verify in browser**

Run: `pnpm dev`, navigate to `/status`. Verify:
1. Hero banner shows "All Systems Operational" (or degraded state)
2. Quick stats show endpoint count, avg latency, node/VM counts
3. Endpoint sections display without the large donut ring
4. Footer shows auto-refresh info + recheck button
5. Sidebar "More" menu shows "Network Health" instead of "API Status"

- [ ] **Step 8: Run checks**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 9: Commit**

```bash
git add src/app/status/page.tsx src/components/app-sidebar.tsx
git commit -m "feat: reframe status page as Network Health with hero banner and stats"
```

---

### Task 6: Credits flow showcase — total counter and watermark

**Files:**
- Modify: `src/app/credits/page.tsx`

- [ ] **Step 1: Import SlotRollNumber**

Add import at top of `credits/page.tsx`:

```typescript
import { SlotRollNumber } from "@/components/slot-roll-number";
```

- [ ] **Step 2: Add the range label map**

Add after the `RANGE_SECONDS` constant (after line 19):

```typescript
const RANGE_LABELS: Record<Range, string> = {
  "24h": "in the last 24 hours",
  "7d": "in the last 7 days",
  "30d": "in the last 30 days",
};
```

- [ ] **Step 3: Add total ALEPH counter above flow diagram**

In `CreditsContent`, replace the flow diagram section (lines 78-85):

```tsx
// BEFORE:
      {/* Flow diagram */}
      <div className="mt-12">
        {isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-lg" />
        ) : summary ? (
          <CreditFlowDiagram summary={summary} />
        ) : null}
      </div>
```

```tsx
// AFTER:
      {/* Total ALEPH counter */}
      {!isLoading && summary && summary.totalAleph > 0 && (
        <div className="mt-12 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Total ALEPH Distributed
          </p>
          <p className="mt-2 font-heading text-5xl font-extrabold tracking-tight">
            <SlotRollNumber
              value={summary.totalAleph}
              decimals={2}
              className="font-mono tabular-nums"
              prefix={
                <span className="mr-1 text-3xl text-muted-foreground/50">
                  ℵ
                </span>
              }
              decimalClassName="text-3xl text-muted-foreground/50"
            />
          </p>
          <p className="mt-1 text-xs text-muted-foreground/50">
            {RANGE_LABELS[range]}
          </p>
        </div>
      )}

      {/* Flow diagram */}
      <div className="mt-8">
        {isLoading ? (
          <Skeleton className="h-[420px] w-full rounded-lg" />
        ) : summary ? (
          <CreditFlowDiagram summary={summary} />
        ) : null}
      </div>
```

Note: changed `mt-12` on the flow diagram to `mt-8` since the counter provides spacing above.

- [ ] **Step 4: Add watermark below flow diagram**

After the flow diagram `div` and before the recipient table section, add:

```tsx
      {/* Watermark */}
      {!isLoading && summary && (
        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.3em] text-foreground/10">
          Powered by Aleph Cloud
        </p>
      )}
```

- [ ] **Step 5: Verify in browser**

Run: `pnpm dev`, navigate to `/credits`. Verify:
1. Total ALEPH counter appears above the flow diagram with billboard roll animation
2. ℵ prefix renders in muted color
3. Decimal portion is visually smaller/muted
4. "in the last 7 days" subtitle updates when switching tabs
5. "Powered by Aleph Cloud" watermark is barely visible below the flow diagram
6. Watermark and counter don't appear during loading state

- [ ] **Step 6: Run checks**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/app/credits/page.tsx
git commit -m "feat: add total ALEPH counter and watermark to credits page"
```

---

### Task 7: Update docs and version

- [ ] **Step 1: Update ARCHITECTURE.md**

Add a new pattern section for the typography and motion system. Document the three-tier font hierarchy and the slot-roll animation component.

- [ ] **Step 2: Update DECISIONS.md**

Log decision:
- **Decision #57:** Typography & Motion — chose three-tier font hierarchy (Rigid Square / Titillium Web / Source Code Pro) and slot-roll billboard animation over simple count-up. Chose "premium through craft" over signature brand color.

- [ ] **Step 3: Update BACKLOG.md**

No backlog items to complete or add for this feature.

- [ ] **Step 4: Update CLAUDE.md**

Update the Current Features list:
- Add: "Three-tier typography (Rigid Square headings, Titillium Web body, Source Code Pro data), slot-roll billboard number animation on overview stats and credits total, staggered card entrance animations"
- Update status page entry: "API status page" → "Network Health page: hero banner with operational status pill, quick stats bar (endpoints/latency/nodes/VMs), endpoint sections, auto-refresh footer"
- Update credits page entry: add "total ALEPH distributed counter with ℵ prefix and billboard animation, 'Powered by Aleph Cloud' watermark"

- [ ] **Step 5: Update changelog.ts**

Bump `CURRENT_VERSION` to `"0.7.0"` and add a new entry at the top of the `CHANGELOG` array:

```typescript
{
  version: "0.7.0",
  date: "2026-03-20",
  changes: [
    {
      type: "ui",
      text: "Three-tier typography: Source Code Pro for hashes, timestamps, and numbers",
    },
    {
      type: "ui",
      text: "Billboard slot-roll animation on overview stat card numbers and credits total",
    },
    {
      type: "ui",
      text: "Staggered card entrance animations on overview page",
    },
    {
      type: "feature",
      text: "Network Health page: hero status banner, quick stats bar, streamlined endpoint sections",
    },
    {
      type: "ui",
      text: "Credits page: total ALEPH distributed counter with ℵ prefix, powered-by watermark",
    },
  ],
},
```

- [ ] **Step 6: Run final checks**

Run: `pnpm check`
Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add docs/ src/changelog.ts CLAUDE.md
git commit -m "docs: update architecture, decisions, and changelog for marketing polish"
```
