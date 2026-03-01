# Scheduler Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a static-exportable operations dashboard for monitoring Aleph Cloud scheduler nodes and VMs, with mock data for initial scaffolding.

**Architecture:** Next.js 16 App Router with `output: "export"` for IPFS hosting. All data fetching client-side via TanStack Query with polling. Reusable UI components live in `@aleph-front/ds`; dashboard-specific compositions stay local. Mock data layer swappable via env flag.

**Tech Stack:** Next.js 16, React 19, TanStack Query, Tailwind 4, @aleph-front/ds, Recharts, TypeScript (strict), pnpm, Vitest

**Design doc:** `docs/plans/2026-03-01-scheduler-dashboard-design.md`

---

## Phase 1: Project Bootstrap

### Task 1: Initialize git and copy template docs

**Files:**
- Create: `.gitignore`
- Create: `CLAUDE.md` (from template, customized)
- Create: `docs/ARCHITECTURE.md` (from template)
- Create: `docs/DECISIONS.md` (from template)
- Create: `docs/BACKLOG.md` (from template)
- Create: `.claude/settings.local.json` (from template)

**Step 1: Initialize git repo**

```bash
cd /Users/dio/Library/CloudStorage/Dropbox/Claudio/repos/scheduler-dashboard
git init
```

**Step 2: Create .gitignore**

```gitignore
# dependencies
node_modules/
.pnpm-store/

# build
.next/
out/

# env
.env
.env.local
.env.*.local

# editor
.vscode/
.idea/
*.swp
*.swo

# os
.DS_Store
Thumbs.db

# template
.template-version

# debug
npm-debug.log*
```

**Step 3: Copy template docs**

Copy these files verbatim from `/Users/dio/repos/claude-project-template/`:
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/BACKLOG.md`
- `.claude/settings.local.json`

**Step 4: Customize CLAUDE.md**

Copy `CLAUDE.md` from template and fill in the project section:

```markdown
## Project: Scheduler Dashboard

Operations dashboard for monitoring the Aleph Cloud scheduler — node health, VM scheduling, and real-time events. Hosted as static export on IPFS.

### Tech Stack

- **Framework:** Next.js 16 (App Router, static export)
- **Language:** TypeScript (strict, ESM only)
- **Styling:** Tailwind CSS 4 + @aleph-front/ds
- **Database:** None (client-side only, REST API polling)
- **Deployment:** IPFS (static export)

### Commands

```bash
pnpm dev          # Dev server (Turbopack)
pnpm build        # Static export to out/
pnpm test         # Vitest
pnpm lint         # oxlint
pnpm typecheck    # tsc --noEmit
pnpm check        # lint + typecheck + test
```

### Key Directories

```
src/
├── app/           # Next.js App Router pages
├── api/           # API client, types, mock data
├── hooks/         # React Query hooks
└── components/    # Dashboard-specific compositions
```

### Component Policy

**All reusable UI components must be created in `@aleph-front/ds` (../aleph-cloud-ds) and imported here.** No generic components (Table, Badge, Card, etc.) should be created locally. Dashboard-specific compositions that combine DS components with domain logic live in `src/components/`.

### Current Features

- (none yet)
```

**Step 5: Commit**

```bash
git add .gitignore CLAUDE.md docs/ .claude/
git commit -m "chore: bootstrap project from claude-project-template"
```

---

### Task 2: Initialize Next.js project with dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

**Step 1: Create package.json**

```json
{
  "name": "@aleph-front/scheduler-dashboard",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "lint": "oxlint --import-plugin src/",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "check": "pnpm lint && pnpm typecheck && pnpm test"
  },
  "dependencies": {
    "@aleph-front/ds": "file:../aleph-cloud-ds/packages/ds",
    "@tanstack/react-query": "5.75.5",
    "next": "16.1.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "2.15.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.2.1",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/react": "19.2.14",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "5.1.4",
    "jsdom": "28.1.0",
    "oxlint": "1.50.0",
    "tailwindcss": "4.2.1",
    "typescript": "5.9.3",
    "vitest": "4.0.18"
  }
}
```

> **Note on @aleph-front/ds:** Using `file:` protocol to link to the local DS package. This mirrors how the DS preview app uses `workspace:*`. When the DS is published to npm, replace with the version number.

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["@testing-library/jest-dom"]
  },
  "include": ["src/**/*", "next-env.d.ts", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  transpilePackages: ["@aleph-front/ds"],
};

export default config;
```

**Step 4: Create postcss.config.mjs**

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

**Step 5: Create vitest.config.ts**

```typescript
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
  },
});
```

**Step 6: Create src/test-setup.ts**

```typescript
import "@testing-library/jest-dom/vitest";
```

**Step 7: Create src/app/globals.css**

```css
@import "tailwindcss";
@import "@aleph-front/ds/styles/tokens.css";

@source "../**/*.{ts,tsx}";
@source "../../node_modules/@aleph-front/ds/src/**/*.{ts,tsx}";

@custom-variant dark (&:where(.theme-dark, .theme-dark *));

html {
  font-family: var(--font-sans);
  background-color: var(--background);
  color: var(--foreground);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 800;
  font-style: italic;
}
```

**Step 8: Create src/app/layout.tsx**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scheduler Dashboard",
  description: "Aleph Cloud scheduler operations dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://use.typekit.net/acb7qvn.css" />
        <link
          href="https://fonts.googleapis.com/css2?family=Titillium+Web:ital,wght@0,400;0,700;1,400&family=Source+Code+Pro:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

**Step 9: Create src/app/page.tsx**

```tsx
export default function OverviewPage() {
  return (
    <main className="p-8">
      <h1 className="text-3xl">Scheduler Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Overview coming soon.</p>
    </main>
  );
}
```

**Step 10: Install dependencies**

```bash
pnpm install
```

**Step 11: Verify dev server starts**

```bash
pnpm dev
# Visit http://localhost:3000, verify page renders with Aleph styling
# Ctrl+C to stop
```

**Step 12: Verify static export works**

```bash
pnpm build
# Verify out/ directory is created with static HTML
```

**Step 13: Commit**

```bash
git add -A
git commit -m "chore: initialize Next.js 16 with DS integration and static export"
```

---

## Phase 2: Data Layer

### Task 3: Define API types

**Files:**
- Create: `src/api/types.ts`

**Step 1: Create types matching Olivier's event schema**

```typescript
export type NodeStatus = "healthy" | "degraded" | "offline" | "unknown";

export type VMStatus =
  | "scheduled"
  | "observed"
  | "orphaned"
  | "missing"
  | "unschedulable";

export type ResourceSnapshot = {
  cpu: number;
  memory: number;
  disk: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
};

export type Node = {
  hash: string;
  address: string;
  status: NodeStatus;
  resources: ResourceSnapshot;
  vmCount: number;
  lastSeen: string;
};

export type NodeDetail = Node & {
  stakedAmount: number;
  vms: VMSummary[];
  recentEvents: SchedulerEvent[];
};

export type VMSummary = {
  hash: string;
  type: string;
  scheduledStatus: VMStatus;
};

export type VM = {
  hash: string;
  type: string;
  assignedNode: string | null;
  scheduledStatus: VMStatus;
  observedStatus: VMStatus | null;
  requirements: ResourceSnapshot;
};

export type VMDetail = VM & {
  schedulingHistory: SchedulerEvent[];
  recentEvents: SchedulerEvent[];
};

export type EventCategory = "registry" | "node" | "vm";

export type SchedulerEvent = {
  id: string;
  type: string;
  category: EventCategory;
  timestamp: string;
  payload: Record<string, unknown>;
};

export type OverviewStats = {
  totalNodes: number;
  healthyNodes: number;
  degradedNodes: number;
  offlineNodes: number;
  totalVMs: number;
  scheduledVMs: number;
  observedVMs: number;
  orphanedVMs: number;
  missingVMs: number;
  unschedulableVMs: number;
};

export type EventFilters = {
  category?: EventCategory;
  limit?: number;
};

export type NodeFilters = {
  status?: NodeStatus;
};

export type VMFilters = {
  status?: VMStatus;
};
```

**Step 2: Commit**

```bash
git add src/api/types.ts
git commit -m "feat: define scheduler API types"
```

---

### Task 4: Create mock data

**Files:**
- Create: `src/api/mock.ts`

**Step 1: Write mock data**

Create realistic mock data with:
- 15 nodes: 9 healthy, 3 degraded, 2 offline, 1 unknown
- 40 VMs: 25 scheduled+observed (normal), 5 scheduled-only, 3 orphaned, 4 missing, 3 unschedulable
- 50 recent events across all event types from the schema

Use deterministic data (no `Math.random()` at import time) so static export is consistent. Use truncated-but-realistic hex hashes (e.g., `"a1b2c3d4e5f6"`).

Generate `OverviewStats` by counting from the arrays rather than hardcoding, to stay consistent.

**Step 2: Commit**

```bash
git add src/api/mock.ts
git commit -m "feat: add mock data for scheduler entities"
```

---

### Task 5: Create API client

**Files:**
- Create: `src/api/client.ts`

**Step 1: Write API client with mock fallback**

```typescript
import type {
  EventFilters,
  Node,
  NodeDetail,
  NodeFilters,
  OverviewStats,
  SchedulerEvent,
  VM,
  VMDetail,
  VMFilters,
} from "@/api/types";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("api");
    if (override) return override;
  }
  return (
    process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:8000"
  );
}

function useMocks(): boolean {
  return process.env["NEXT_PUBLIC_USE_MOCKS"] === "true";
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`);
  if (!res.ok) {
    throw new Error(
      `API error: ${res.status} ${res.statusText} for ${path}`,
    );
  }
  return res.json() as Promise<T>;
}

export async function getNodes(
  filters?: NodeFilters,
): Promise<Node[]> {
  if (useMocks()) {
    const { mockNodes } = await import("@/api/mock");
    const nodes = mockNodes;
    if (filters?.status) {
      return nodes.filter((n) => n.status === filters.status);
    }
    return nodes;
  }
  const params = filters?.status
    ? `?status=${filters.status}`
    : "";
  return fetchApi<Node[]>(`/nodes${params}`);
}

export async function getNode(hash: string): Promise<NodeDetail> {
  if (useMocks()) {
    const { getMockNodeDetail } = await import("@/api/mock");
    return getMockNodeDetail(hash);
  }
  return fetchApi<NodeDetail>(`/nodes/${hash}`);
}

export async function getVMs(filters?: VMFilters): Promise<VM[]> {
  if (useMocks()) {
    const { mockVMs } = await import("@/api/mock");
    const vms = mockVMs;
    if (filters?.status) {
      return vms.filter(
        (v) =>
          v.scheduledStatus === filters.status ||
          v.observedStatus === filters.status,
      );
    }
    return vms;
  }
  const params = filters?.status
    ? `?status=${filters.status}`
    : "";
  return fetchApi<VM[]>(`/vms${params}`);
}

export async function getVM(hash: string): Promise<VMDetail> {
  if (useMocks()) {
    const { getMockVMDetail } = await import("@/api/mock");
    return getMockVMDetail(hash);
  }
  return fetchApi<VMDetail>(`/vms/${hash}`);
}

export async function getEvents(
  filters?: EventFilters,
): Promise<SchedulerEvent[]> {
  if (useMocks()) {
    const { mockEvents } = await import("@/api/mock");
    let events = mockEvents;
    if (filters?.category) {
      events = events.filter(
        (e) => e.category === filters.category,
      );
    }
    if (filters?.limit) {
      events = events.slice(0, filters.limit);
    }
    return events;
  }
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return fetchApi<SchedulerEvent[]>(
    `/events${qs ? `?${qs}` : ""}`,
  );
}

export async function getOverviewStats(): Promise<OverviewStats> {
  if (useMocks()) {
    const { mockOverviewStats } = await import("@/api/mock");
    return mockOverviewStats;
  }
  return fetchApi<OverviewStats>("/stats");
}
```

**Step 2: Commit**

```bash
git add src/api/client.ts
git commit -m "feat: add API client with mock fallback and URL override"
```

---

### Task 6: Create React Query hooks

**Files:**
- Create: `src/hooks/use-nodes.ts`
- Create: `src/hooks/use-vms.ts`
- Create: `src/hooks/use-events.ts`
- Create: `src/hooks/use-overview-stats.ts`

**Step 1: Write useNodes hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getNode, getNodes } from "@/api/client";
import type { NodeFilters } from "@/api/types";

export function useNodes(filters?: NodeFilters) {
  return useQuery({
    queryKey: ["nodes", filters],
    queryFn: () => getNodes(filters),
    refetchInterval: 30_000,
  });
}

export function useNode(hash: string) {
  return useQuery({
    queryKey: ["node", hash],
    queryFn: () => getNode(hash),
    refetchInterval: 15_000,
    enabled: hash.length > 0,
  });
}
```

**Step 2: Write useVMs hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getVM, getVMs } from "@/api/client";
import type { VMFilters } from "@/api/types";

export function useVMs(filters?: VMFilters) {
  return useQuery({
    queryKey: ["vms", filters],
    queryFn: () => getVMs(filters),
    refetchInterval: 30_000,
  });
}

export function useVM(hash: string) {
  return useQuery({
    queryKey: ["vm", hash],
    queryFn: () => getVM(hash),
    refetchInterval: 15_000,
    enabled: hash.length > 0,
  });
}
```

**Step 3: Write useEvents hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getEvents } from "@/api/client";
import type { EventFilters } from "@/api/types";

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: ["events", filters],
    queryFn: () => getEvents(filters),
    refetchInterval: 10_000,
  });
}
```

**Step 4: Write useOverviewStats hook**

```typescript
import { useQuery } from "@tanstack/react-query";
import { getOverviewStats } from "@/api/client";

export function useOverviewStats() {
  return useQuery({
    queryKey: ["overview-stats"],
    queryFn: getOverviewStats,
    refetchInterval: 30_000,
  });
}
```

**Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React Query hooks for scheduler data"
```

---

### Task 7: Set up React Query provider

**Files:**
- Create: `src/app/providers.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create providers wrapper**

```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10_000,
            retry: 2,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Step 2: Wrap layout with Providers**

Update `src/app/layout.tsx` body to:

```tsx
<body className="min-h-screen bg-background text-foreground">
  <Providers>{children}</Providers>
</body>
```

Import `Providers` from `@/app/providers`.

**Step 3: Commit**

```bash
git add src/app/providers.tsx src/app/layout.tsx
git commit -m "feat: add React Query provider"
```

---

### Task 8: Create .env.local for mock mode

**Files:**
- Create: `.env.local`
- Create: `.env.example`

**Step 1: Create .env files**

`.env.local`:
```
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`.env.example`:
```
NEXT_PUBLIC_USE_MOCKS=true
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Step 2: Verify .env.local is gitignored** (it is — `.env.*.local` pattern)

**Step 3: Commit .env.example only**

```bash
git add .env.example
git commit -m "chore: add .env.example with mock mode defaults"
```

---

## Phase 3: DS Components (in aleph-cloud-ds repo)

> All tasks in this phase are executed in `/Users/dio/repos/aleph-cloud-ds/`.
> Each component follows the DS patterns: CVA variants, forwardRef, cn() utility, Radix UI where applicable, colocated tests, subpath export.

### Task 9: Build Badge component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/badge/badge.tsx`
- Create: `packages/ds/src/components/badge/badge.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("renders as a span by default", () => {
    render(<Badge>Test</Badge>);
    const badge = screen.getByText("Test");
    expect(badge.tagName).toBe("SPAN");
  });

  it("merges custom className", () => {
    render(<Badge className="custom">Test</Badge>);
    expect(screen.getByText("Test").className).toContain("custom");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/dio/repos/aleph-cloud-ds
pnpm --filter @aleph-front/ds test -- --run src/components/badge/badge.test.tsx
```

Expected: FAIL — module not found.

**Step 3: Write implementation**

CVA variants:
- `variant`: `default`, `success`, `warning`, `error`, `info`
- `size`: `sm`, `md`

Map `variant` to semantic token colors. Use pill shape (rounded-full). Keep it simple — no icons or dismiss, just a colored label.

**Step 4: Run test to verify it passes**

```bash
pnpm --filter @aleph-front/ds test -- --run src/components/badge/badge.test.tsx
```

**Step 5: Add subpath export to packages/ds/package.json**

Add to `"exports"`:
```json
"./badge": "./src/components/badge/badge.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/badge/ packages/ds/package.json
git commit -m "feat(ds): add Badge component with status variants"
```

---

### Task 10: Build StatusDot component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/status-dot/status-dot.tsx`
- Create: `packages/ds/src/components/status-dot/status-dot.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

Test: renders a span, applies correct aria-label, merges className.

**Step 2: Run test — expect FAIL**

**Step 3: Write implementation**

A small colored circle indicator. CVA variants for `status`: `healthy` (success-500), `degraded` (warning-500), `error` (error-500), `offline` (neutral-400), `unknown` (neutral-300). Sizes: `sm` (8px), `md` (12px). Includes a subtle pulse animation on `healthy` status.

Reference: `NodeStatus` + `ColorDot` from `front-aleph-cloud-page`.

**Step 4: Run test — expect PASS**

**Step 5: Add subpath export**

```json
"./status-dot": "./src/components/status-dot/status-dot.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/status-dot/ packages/ds/package.json
git commit -m "feat(ds): add StatusDot component with health status variants"
```

---

### Task 11: Build Card component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/card/card.tsx`
- Create: `packages/ds/src/components/card/card.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

Test: renders children, renders title when provided, applies padding variant, merges className.

**Step 2: Run test — expect FAIL**

**Step 3: Write implementation**

A content container with DS tokens. CVA variants:
- `variant`: `default` (card bg + border), `ghost` (transparent, no border)
- `padding`: `sm`, `md`, `lg`

Includes optional `title` prop rendered as a heading. Uses `bg-card text-card-foreground border border-edge rounded-2xl`.

Reference: `Card1`, `Card2` from `front-aleph-cloud-page` (but simplified — no NoisyContainer grain texture, that's a DS enhancement for later).

**Step 4: Run test — expect PASS**

**Step 5: Add subpath export**

```json
"./card": "./src/components/card/card.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/card/ packages/ds/package.json
git commit -m "feat(ds): add Card component"
```

---

### Task 12: Build Skeleton component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/ui/skeleton.tsx`
- Create: `packages/ds/src/components/ui/skeleton.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

Test: renders a div with aria-hidden, applies width/height via style or className, merges className.

**Step 2: Run test — expect FAIL**

**Step 3: Write implementation**

Simple animated placeholder. A `div` with `animate-pulse bg-muted rounded-md`. Accepts `className` for sizing. No width/height props — sizing via Tailwind classes from the consumer (`className="h-4 w-32"`).

Reference: `Skeleton` from `front-aleph-cloud-page`.

**Step 4: Run test — expect PASS**

**Step 5: Add subpath export**

```json
"./ui/skeleton": "./src/components/ui/skeleton.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/ui/skeleton.tsx packages/ds/src/components/ui/skeleton.test.tsx packages/ds/package.json
git commit -m "feat(ds): add Skeleton loading placeholder"
```

---

### Task 13: Build Tooltip component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/tooltip/tooltip.tsx`
- Create: `packages/ds/src/components/tooltip/tooltip.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

Test: renders trigger, shows content on hover (using userEvent), hides by default.

**Step 2: Run test — expect FAIL**

**Step 3: Write implementation**

Wrap Radix UI Tooltip primitives (`TooltipProvider`, `Tooltip`, `TooltipTrigger`, `TooltipContent`) with DS styling. Export all four as named exports for composability.

`TooltipContent` styling: `bg-neutral-900 text-white text-sm rounded-lg px-3 py-1.5 shadow-brand-sm` with Radix animation attributes.

Reference: `ResponsiveTooltip` from `front-aleph-cloud-page` (but skip mobile fullscreen overlay — add later if needed).

**Step 4: Run test — expect PASS**

**Step 5: Add subpath export**

```json
"./tooltip": "./src/components/tooltip/tooltip.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/tooltip/ packages/ds/package.json
git commit -m "feat(ds): add Tooltip component wrapping Radix UI"
```

---

### Task 14: Build Table component in DS

**Files (in aleph-cloud-ds):**
- Create: `packages/ds/src/components/table/table.tsx`
- Create: `packages/ds/src/components/table/table.test.tsx`
- Modify: `packages/ds/package.json` (add export)

**Step 1: Write failing test**

Test:
- Renders table with correct number of rows
- Renders column headers
- Calls onRowClick when a row is clicked
- Applies alternating row colors

**Step 2: Run test — expect FAIL**

**Step 3: Write implementation**

A typed, generic table component. Props:

```typescript
type Column<T> = {
  header: string;
  accessor: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
};
```

Styling: `border-collapse`, alternating rows via `even:bg-muted/30`, hover highlight `hover:bg-muted/50`, clickable rows with `cursor-pointer`. Header row `bg-muted/50 text-muted-foreground text-sm font-semibold uppercase tracking-wide`. Cells with `px-4 py-3`.

Sorting: managed internally via `useState` when `sortable` is true on a column. Sort indicator (chevron) in header.

Reference: `Table` from `front-aleph-cloud-page` (alternating rows, hover, clickable rows).

**Step 4: Run test — expect PASS**

**Step 5: Add subpath export**

```json
"./table": "./src/components/table/table.tsx"
```

**Step 6: Commit**

```bash
git add packages/ds/src/components/table/ packages/ds/package.json
git commit -m "feat(ds): add Table component with sorting and row click"
```

---

### Task 15: Add preview pages for new DS components

**Files (in aleph-cloud-ds):**
- Create: `apps/preview/src/app/components/badge/page.tsx`
- Create: `apps/preview/src/app/components/status-dot/page.tsx`
- Create: `apps/preview/src/app/components/card/page.tsx`
- Create: `apps/preview/src/app/components/skeleton/page.tsx`
- Create: `apps/preview/src/app/components/tooltip/page.tsx`
- Create: `apps/preview/src/app/components/table/page.tsx`
- Modify: `apps/preview/src/components/sidebar.tsx` (add nav links)

**Step 1: Create preview pages**

Each page shows all variants, sizes, and states. Use `DemoSection` wrapper from existing preview pages.

**Step 2: Add sidebar links**

Add entries for Badge, StatusDot, Card, Skeleton, Tooltip, Table to the sidebar navigation.

**Step 3: Verify preview app runs**

```bash
cd /Users/dio/repos/aleph-cloud-ds
pnpm dev
# Visit preview pages, verify components render correctly
```

**Step 4: Commit**

```bash
git add apps/preview/
git commit -m "feat(preview): add preview pages for new components"
```

---

### Task 16: Run full DS check and update DS docs

**Step 1: Run full check**

```bash
cd /Users/dio/repos/aleph-cloud-ds
pnpm check
```

Fix any lint, type, or test errors.

**Step 2: Update DS DESIGN-SYSTEM.md**

Add documentation sections for Badge, StatusDot, Card, Skeleton, Tooltip, Table with props tables, variants, and usage examples.

**Step 3: Update DS ARCHITECTURE.md**

Add the new component files to the project structure section.

**Step 4: Commit**

```bash
git add docs/ packages/ apps/
git commit -m "docs: document new DS components (Badge, StatusDot, Card, Skeleton, Tooltip, Table)"
```

---

## Phase 4: Dashboard Layout & Pages (back in scheduler-dashboard repo)

> All tasks from here are in `/Users/dio/Library/CloudStorage/Dropbox/Claudio/repos/scheduler-dashboard/`

### Task 17: Build app shell (sidebar + header + layout)

**Files:**
- Create: `src/components/app-sidebar.tsx`
- Create: `src/components/app-header.tsx`
- Modify: `src/app/layout.tsx`
- Create: `src/app/nodes/page.tsx`
- Create: `src/app/vms/page.tsx`

**Step 1: Build AppSidebar**

Client component. Uses Next.js `usePathname()` to highlight active link. Links: Overview (`/`), Nodes (`/nodes`), VMs (`/vms`). Collapsible state via internal `useState`. Aleph Cloud branding at top.

Style with DS tokens: `bg-card border-r border-edge`, active link `bg-primary-600/10 text-primary-600`.

**Step 2: Build AppHeader**

Client component. Shows page title (derived from route), last-refreshed timestamp (from React Query), theme toggle button.

**Step 3: Update layout.tsx**

Wrap children in the shell layout: sidebar on left, header on top of main content area, main scrollable content.

**Step 4: Create placeholder pages**

`nodes/page.tsx` and `vms/page.tsx` with simple headings.

**Step 5: Verify navigation works**

```bash
pnpm dev
# Click through sidebar links, verify routing works
```

**Step 6: Commit**

```bash
git add src/
git commit -m "feat: add app shell with sidebar, header, and routing"
```

---

### Task 18: Build Overview page

**Files:**
- Create: `src/components/stats-bar.tsx`
- Create: `src/components/node-health-summary.tsx`
- Create: `src/components/vm-allocation-summary.tsx`
- Create: `src/components/event-feed.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Build StatsBar**

Horizontal row of stat cards using DS `Card` component. Shows: total nodes, healthy/unhealthy split, total VMs, scheduled vs observed, unschedulable count. Uses `useOverviewStats()` hook. Skeleton loading states.

**Step 2: Build NodeHealthSummary**

Card showing node health distribution. Could be a simple bar chart (Recharts) or colored segments. Uses `useNodes()` hook to count by status.

**Step 3: Build VMAllocationSummary**

Card showing VM status distribution: scheduled, observed, orphaned, missing, unschedulable. Uses `useVMs()` hook.

**Step 4: Build EventFeed**

Chronological list of recent events. Each event shows: timestamp, event type badge (using DS Badge), brief payload summary. Uses `useEvents({ limit: 20 })`. Category filter buttons at top.

**Step 5: Compose Overview page**

Wire all components into the page layout: StatsBar at top, NodeHealthSummary + VMAllocationSummary side by side, EventFeed below.

**Step 6: Verify with mock data**

```bash
pnpm dev
# Verify overview page renders with mock data
```

**Step 7: Commit**

```bash
git add src/
git commit -m "feat: build Overview page with stats, health summary, and event feed"
```

---

### Task 19: Build Nodes page

**Files:**
- Create: `src/components/node-table.tsx`
- Create: `src/components/node-detail-panel.tsx`
- Modify: `src/app/nodes/page.tsx`

**Step 1: Build NodeTable**

Client component wrapping DS `Table`. Columns: hash (truncated, with Tooltip for full hash), address, status (StatusDot + label), CPU/RAM/disk usage bars, VM count, last seen (relative time). Uses `useNodes()` hook. Status filter buttons at top.

**Step 2: Build NodeDetailPanel**

Side panel or expandable row showing full node info. Uses `useNode(hash)` for detail data. Shows: full hash, address, staked amount, resource snapshot, list of VMs running on node, recent events.

**Step 3: Wire into Nodes page**

```tsx
"use client";

export default function NodesPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  // ... NodeTable + NodeDetailPanel
}
```

**Step 4: Verify**

```bash
pnpm dev
# Navigate to /nodes, verify table renders, click a row to see detail
```

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: build Nodes page with table and detail panel"
```

---

### Task 20: Build VMs page

**Files:**
- Create: `src/components/vm-table.tsx`
- Create: `src/components/vm-detail-panel.tsx`
- Modify: `src/app/vms/page.tsx`

**Step 1: Build VMTable**

Client component wrapping DS `Table`. Columns: hash (truncated + Tooltip), type, assigned node (truncated), scheduled status (Badge), observed status (Badge), discrepancy indicator (highlight if orphaned or missing). Uses `useVMs()` hook. Status filter buttons.

**Step 2: Build VMDetailPanel**

Full VM info, scheduling history, allocation vs observation comparison.

**Step 3: Wire into VMs page**

Same pattern as Nodes page: table + selected detail.

**Step 4: Verify**

```bash
pnpm dev
# Navigate to /vms, verify table renders, click a row to see detail
```

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: build VMs page with table and detail panel"
```

---

## Phase 5: Polish & Verify

### Task 21: Add theme toggle

**Files:**
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/components/app-header.tsx`

**Step 1: Build ThemeToggle**

Client component. Toggles `theme-dark` class on `document.documentElement`. Persists preference to `localStorage`. Uses sun/moon icon (inline SVG, no icon library dependency).

**Step 2: Add to header**

Place in the AppHeader, right-aligned.

**Step 3: Verify both themes**

```bash
pnpm dev
# Toggle theme, verify all pages look correct in both light and dark
```

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: add theme toggle with localStorage persistence"
```

---

### Task 22: Final verification

**Step 1: Run full check**

```bash
pnpm check
```

Fix any lint, type, or test errors.

**Step 2: Verify static export**

```bash
pnpm build
```

Verify `out/` directory contains:
- `index.html` (overview)
- `nodes/index.html`
- `vms/index.html`
- Static assets

**Step 3: Test static export locally**

```bash
npx serve out
# Open http://localhost:3000, navigate all pages, verify everything works
```

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build and lint issues for static export"
```

---

### Task 23: Update docs

- [ ] `docs/ARCHITECTURE.md` — Fill in stack table, project structure, document patterns (API client, React Query hooks, mock data layer, app shell layout)
- [ ] `docs/DECISIONS.md` — Log key decisions: static export for IPFS, React Query over server components, mock data approach, DS-first component policy, file: protocol for DS linking
- [ ] `docs/BACKLOG.md` — Add deferred items: Sidebar component in DS, real API integration, WebSocket migration, E2E tests, npm publishing of DS
- [ ] `CLAUDE.md` — Update Current Features list

**Commit:**

```bash
git add docs/ CLAUDE.md
git commit -m "docs: update project documentation after initial scaffolding"
```
