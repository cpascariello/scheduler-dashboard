# Overview Page Redesign

Visual redesign of the Overview page for a more vibrant, spacious, premium feel. Branch-only — not merged to main without explicit approval.

## Scope

Modify 6 files: `globals.css`, `page.tsx`, `stats-bar.tsx`, `node-health-summary.tsx`, `vm-allocation-summary.tsx`, `top-nodes-card.tsx`, `latest-vms-card.tsx`.

No data/hook changes, no new DS components, no sidebar/header changes, no other pages affected.

## Design

### Stats Section
- Each stat in its own card with `p-6 rounded-2xl`
- Large numbers: `text-4xl font-heading` (rigid-square italic)
- Colored left border matching status semantics (green/amber/red/neutral)
- Subtitle explaining each metric
- Status-tinted background at ~5% opacity
- Grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- Info tooltip on hover for each stat

### Content Cards
- Padding: `p-8`
- Titles: `text-2xl font-heading` with gradient underline accent
- Radial gradient background (purple-950 to transparent)
- SVG noise texture overlay at low opacity
- Hover glow shadow
- Info icon with tooltip on each card title
- Gap between cards: `gap-8`

### Layout
- Page title: `text-4xl font-heading` with subtitle
- Section spacing: `mt-12` between stats and cards
- Card grid gap: `gap-8`

### Colors
- Green (`success-500`) for healthy states
- Amber (`warning-400`) for orphaned/unschedulable
- Red (`error-400`) for missing/critical
- Lime (`#d2fd00`) for CTA buttons sparingly
- Purple primary for accents/gradients

### Tooltips
- Using existing DS Tooltip components
- Stat cards: hover for metric explanation
- Card headers: info icon with description
