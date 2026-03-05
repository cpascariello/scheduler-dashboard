# Dedicated Node & VM Detail Views

**Date:** 2026-03-05
**Status:** Approved
**Context:** Feedback from Olivier suggesting dedicated pages for VMs/nodes to surface full history from `/vms/{hash}/history` and `/nodes/{hash}/history` endpoints.

## URL & Navigation

- **List view:** `/nodes`, `/vms` (unchanged)
- **Panel peek:** `/nodes?selected=hash`, `/vms?selected=hash` (unchanged)
- **Detail view:** `/nodes?view=hash`, `/vms?view=hash` (new)

Page components check `view` param first (detail view), then `selected` (list + panel), then neither (list only).

Side panels gain a "View details" link navigating from `?selected=hash` to `?view=hash`. Detail views get a back link ("← Nodes" / "← Virtual Machines") returning to the list.

`AppHeader` title extends to show entity-specific titles for `?view=` routes (e.g., "Node: abc12...f3" or node name).

## Node Detail View

Full-width layout, sections top to bottom:

1. **Header:** Back link + StatusDot + name/hash + status badge + staked badge
2. **Metadata grid:** Full hash (copyable), address, owner, IPv6 support, discovered at, last updated
3. **Resources:** CPU/Memory/Disk ResourceBars + placeholder area for future resource charts
4. **VMs:** Table of VMs on this node (hash, type, status) — each links to `/vms?view=hash`
5. **History:** Full table of all events — columns: Action, VM hash (cross-linked), Reason, Timestamp. Sorted newest-first.

## VM Detail View

Full-width layout:

1. **Header:** Back link + hash + type badge + status badge + payment status badge
2. **Metadata grid:** Full hash (copyable), type, payment type, allocated at, last observed at, last updated
3. **Allocated Node:** Node hash linked to `/nodes?view=hash` with status badge, or "Not allocated"
4. **Observed Nodes:** List of node hashes, each linked to `/nodes?view=hash`
5. **Requirements:** vCPUs, Memory, Disk
6. **History:** Full table of all events — columns: Action, Node hash (cross-linked), Reason, Timestamp. Sorted newest-first.

## Data Changes

Extend API types and transforms to surface currently-dropped fields:

- `Node`: add `owner`, `supportsIpv6`, `discoveredAt`
- `VM`: add `allocatedAt`, `lastObservedAt`, `paymentType`

No new API endpoints needed. History endpoints are already wired up.

## Components

**New:**
- `src/components/node-detail-view.tsx`
- `src/components/vm-detail-view.tsx`

**Modified:**
- `src/app/nodes/page.tsx` — `?view=` branch
- `src/app/vms/page.tsx` — `?view=` branch
- `src/components/node-detail-panel.tsx` — "View details" link
- `src/components/vm-detail-panel.tsx` — "View details" link
- `src/components/app-header.tsx` — dynamic title for detail views
- `src/api/client.ts` — extend transforms
- `src/api/types.ts` — extend types

## Out of Scope

- Resource usage charts (backend endpoint doesn't exist yet — layout placeholder only)
- Timeline visualization or grouped-by-day history
- Breadcrumb component (back link is sufficient)
- Changes to the Overview page
