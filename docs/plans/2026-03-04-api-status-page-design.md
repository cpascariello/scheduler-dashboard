# API Status Page — Design

## Summary

A `/status` page that checks all 7 scheduler API endpoints on load and displays the results. Each row shows the endpoint path (clickable link to the raw API), a StatusDot indicator, and the HTTP response code. A "Recheck" button re-runs all checks. No polling — check on load only.

## Scope

Two changes:
1. Switch API prefix from `/v0` to `/v1` in `client.ts`
2. Add the status page + sidebar link + header title

## Endpoints

| Endpoint | Type |
|----------|------|
| `GET /api/v1/stats` | Independent |
| `GET /api/v1/nodes` | Independent |
| `GET /api/v1/vms` | Independent |
| `GET /api/v1/nodes/:hash` | Depends on `/nodes` returning data |
| `GET /api/v1/nodes/:hash/history` | Depends on `/nodes` returning data |
| `GET /api/v1/vms/:hash` | Depends on `/vms` returning data |
| `GET /api/v1/vms/:hash/history` | Depends on `/vms` returning data |

Detail endpoints use the first item from their respective list endpoint. If the list is empty, the detail row shows "skipped."

## Status mapping

- **200** → green dot (`healthy`)
- **404** → red dot (`error`)
- **5xx / network error** → red dot (`error`)
- **Pending** → grey dot (`unknown`), shown while checking

## Sidebar placement

Link at the bottom of the sidebar, separated from the main nav by a divider. Small signal/heartbeat icon. Added to `ROUTE_TITLES` in `app-header.tsx`.

## Decisions

- No polling — check on load only, with manual "Recheck" button
- No version dropdown — dashboard uses `/v1` only (per Olivier's guidance)
- Show HTTP response code alongside StatusDot for diagnostic value
- Endpoint paths are clickable links opening the raw API response
