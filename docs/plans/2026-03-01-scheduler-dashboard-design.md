# Scheduler Dashboard — Design Document

Date: 2026-03-01

## Purpose

Internal operations dashboard for monitoring the Aleph Cloud scheduler. Visualizes node health, VM scheduling (allocation vs observation), and real-time events. Internal audience first, with future external access in mind.

## Architecture

### Stack

- **Next.js 16** — App Router, `output: "export"` for IPFS static hosting
- **React 19** + **TanStack Query** — Client-side data fetching with polling
- **Tailwind 4** + **@aleph-front/ds** — Design system components and tokens
- **pnpm** — Package manager (aligned with DS monorepo)
- **TypeScript** — Strict mode, ESM only
- **Recharts** — Data visualization (charts)

### Constraints

- **IPFS hosting**: Fully static export, no server runtime, no API routes
- **API URL flexibility**: Configurable via build-time env var + runtime query parameter override
- **DS-first**: All reusable components live in `@aleph-front/ds`, not locally

### Data Flow

```
Scheduler REST API (polling)
       ↓
  API Client (typed fetch wrappers, configurable base URL)
       ↓
  React Query hooks (useNodes, useVMs, useEvents, useOverviewStats)
       ↓  refetchInterval: 10-30s
  Page components (Overview, Nodes, VMs)
       ↓
  DS components (@aleph-front/ds/*)
```

### Project Structure

```
scheduler-dashboard/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── layout.tsx          # Shell: sidebar + header + main
│   │   ├── page.tsx            # Overview dashboard
│   │   ├── nodes/page.tsx      # Node list & detail
│   │   └── vms/page.tsx        # VM list & detail
│   ├── api/                    # API client + types (NOT Next API routes)
│   │   ├── client.ts           # Base fetch wrapper, configurable base URL
│   │   ├── types.ts            # Event types matching scheduler schema
│   │   └── mock.ts             # Mock data for scaffolding
│   ├── hooks/                  # React Query hooks
│   └── components/             # Dashboard-specific compositions only
├── docs/                       # Project documentation
├── CLAUDE.md                   # Project guide
└── next.config.ts              # output: "export", transpilePackages
```

## Views

### Overview (`/`)

- **Stats bar** — Total nodes, healthy/unhealthy count, total VMs, scheduled vs observed, unschedulable count
- **Node health breakdown** — Visual summary of node statuses
- **VM allocation summary** — Scheduled vs observed vs orphaned vs missing
- **Recent events feed** — Last ~20 events, filterable by category (node/VM/registry)

### Nodes (`/nodes`)

- **Node list table** — Sortable/filterable: node hash, address, status, resources, VM count, last seen
- **Status filter** — healthy, degraded, offline, all
- **Node detail panel** — Expand/side panel: full info, resources, VMs on node, recent events

### VMs (`/vms`)

- **VM list table** — Sortable/filterable: VM hash, type, node, scheduled/observed status, discrepancy indicator
- **Status filter** — all, scheduled, unschedulable, orphaned, missing
- **VM detail panel** — Full VM info, scheduling history, allocation vs observation state

### Shared Layout

- **Sidebar** — Fixed left nav (Overview, Nodes, VMs), collapsible, Aleph Cloud branding
- **Header** — Page title, polling status (last refreshed), API URL config
- **Theme toggle** — Light/dark via DS theme switching

## DS Components Needed

New components to build in `@aleph-front/ds`, referencing `front-aleph-cloud-page`:

| Component | Reference | Notes |
|-----------|-----------|-------|
| Table | `common/Table` | Sortable columns, alternating rows, row click, selection. CVA variants |
| Badge | `CountBadge` + `Tag` | Status + count badges. CVA color variants |
| Card | `Card1`, `Card2`, `EntityCard` | Stat cards, content panels |
| Sidebar | `RouterSidebar` | Collapsible, route-aware active state |
| Tooltip | `ResponsiveTooltip` | Radix UI wrapper, mobile-responsive |
| Skeleton | `Skeleton` | Animated loading placeholder |
| StatusDot | `NodeStatus` / `ColorDot` | Colored circle mapped to semantic colors |

### Dashboard-Local Components

- `NodeHealthSummary`, `VMDiscrepancyBanner`, `EventFeed`, `StatsBar`
- Chart components (Recharts)
- Scheduler-specific data formatting

## Data Layer

### API Client Functions

```
getNodes()          → Node[]
getNode(hash)       → NodeDetail
getVMs()            → VM[]
getVM(hash)         → VMDetail
getEvents(filters?) → Event[]
getOverviewStats()  → OverviewStats
```

### Core Types

```
NodeStatus: "healthy" | "degraded" | "offline" | "unknown"
VMStatus: "scheduled" | "observed" | "orphaned" | "missing" | "unschedulable"

Node: { hash, address, status, resources: ResourceSnapshot, vmCount, lastSeen }
VM: { hash, type, assignedNode, scheduledStatus, observedStatus, requirements }
Event: { type, timestamp, payload } — union over all event categories
```

### React Query Hooks

- `useNodes(filters?)` — 30s polling
- `useNode(hash)` — 15s polling
- `useVMs(filters?)` — 30s polling
- `useVM(hash)` — 15s polling
- `useEvents(filters?)` — 10s polling
- `useOverviewStats()` — 30s polling

### Mock Data

`src/api/mock.ts` with `NEXT_PUBLIC_USE_MOCKS` env flag:
- ~15 nodes (varied health/resources)
- ~40 VMs (mix of statuses)
- ~50 recent events (all types)

## Configuration

| Config | Source | Default |
|--------|--------|---------|
| API base URL | `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |
| API URL override | `?api=` query param (runtime) | — |
| Mock mode | `NEXT_PUBLIC_USE_MOCKS` | `true` |

## Error Handling

- **API errors**: React Query retry + inline error with retry button. Stale data stays visible.
- **Offline**: Polling pauses/resumes automatically. Connection status banner.
- **Loading**: Skeleton states on first load; background updates silently.

## Build & Deployment

```bash
pnpm build     # next build → static export to out/
```

- `output: "export"`, `images: { unoptimized: true }`
- Relative asset paths for IPFS gateway compatibility
- All routes pre-rendered as static HTML with client-side hydration

## Testing

- **Unit tests**: Vitest + Testing Library for hooks and component behavior
- **Mock data tests**: Type-check mock data matches schema
- **DS component tests**: Live in the DS repo
