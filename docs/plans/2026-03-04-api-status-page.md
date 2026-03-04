# API Status Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an API status page that checks all scheduler endpoints and shows their health, plus switch the dashboard from `/api/v0` to `/api/v1`.

**Architecture:** A `/status` route with a client component that fires fetch requests to all 7 endpoints on mount, renders results as a list with StatusDot + HTTP code. The base URL and API prefix come from the existing `client.ts` infrastructure. Sidebar gets a bottom-separated link.

**Tech Stack:** Next.js App Router, React (useState/useCallback), DS StatusDot component, Tailwind CSS

---

### Task 1: Switch API prefix from v0 to v1

**Files:**
- Modify: `src/api/client.ts` (lines with `/api/v0/`)
- Modify: `src/api/client.test.ts` (lines with `/api/v0/`)

**Step 1: Replace all `/api/v0/` with `/api/v1/` in client.ts**

Find and replace all 9 occurrences of `/api/v0/` with `/api/v1/` in `src/api/client.ts`.

**Step 2: Replace all `/api/v0/` with `/api/v1/` in client.test.ts**

Find and replace all occurrences of `/api/v0/` with `/api/v1/` in `src/api/client.test.ts`.

**Step 3: Verify the integration tests pass against v1**

Run: `NEXT_PUBLIC_API_URL=https://rust-scheduler.aleph.im RUN_API_TESTS=true pnpm test src/api/client.test.ts`
Expected: All 12 tests PASS (v1 endpoints are live)

**Step 4: Verify the build still works**

Run: `pnpm typecheck`
Expected: No errors

**Step 5: Commit**

```bash
git add src/api/client.ts src/api/client.test.ts
git commit -m "fix: switch API prefix from v0 to v1

Per Olivier's guidance — v0/nodes has a bug, v1 is the stable version."
```

---

### Task 2: Add sidebar link and header title for status page

**Files:**
- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/components/app-header.tsx`

**Step 1: Add "API Status" to ROUTE_TITLES in app-header.tsx**

Add `"/status": "API Status"` to the `ROUTE_TITLES` record in `src/components/app-header.tsx`.

**Step 2: Add status link to sidebar bottom in app-sidebar.tsx**

In `src/components/app-sidebar.tsx`, add a link below the main `<nav>` and above the footer `<div>`. It should be separated by a `border-t border-edge` divider. Use a signal/heartbeat icon (SVG). Style it the same as nav items but in its own section.

```tsx
{/* Bottom utility link */}
<div className="border-t border-edge px-3 py-4">
  <Link
    href="/status"
    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
      pathname === "/status"
        ? "bg-primary-600/10 text-primary-400 font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-muted"
    }`}
    style={{ transitionDuration: "var(--duration-fast)" }}
  >
    <svg
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.807-3.808-9.98 0-13.788m13.788 0c3.808 3.807 3.808 9.98 0 13.788M12 12h.008v.008H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
    API Status
  </Link>
</div>
```

Place this between the `<nav className="flex-1 ...">` and the footer `<div className="border-t border-edge px-5 py-3">`.

**Step 3: Verify build**

Run: `pnpm typecheck`
Expected: No errors (page doesn't exist yet, but link and title are valid)

**Step 4: Commit**

```bash
git add src/components/app-sidebar.tsx src/components/app-header.tsx
git commit -m "feat: add sidebar link and header title for API status page"
```

---

### Task 3: Create the status page

**Files:**
- Create: `src/app/status/page.tsx`

**Step 1: Create the status page component**

Create `src/app/status/page.tsx` with the following structure:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusDot } from "@aleph-front/ds/src/components/StatusDot";

type EndpointStatus = {
  path: string;
  label: string;
  status: "pending" | "healthy" | "error" | "skipped";
  httpCode: number | null;
};

type EndpointDef = {
  path: string;
  label: string;
  dependsOn?: string; // key into results to get :hash
};

const API_PREFIX = "/api/v1";

const ENDPOINTS: EndpointDef[] = [
  { path: "/stats", label: "Stats" },
  { path: "/nodes", label: "Nodes (list)" },
  { path: "/vms", label: "VMs (list)" },
  {
    path: "/nodes/:hash",
    label: "Node detail",
    dependsOn: "nodes",
  },
  {
    path: "/nodes/:hash/history",
    label: "Node history",
    dependsOn: "nodes",
  },
  {
    path: "/vms/:hash",
    label: "VM detail",
    dependsOn: "vms",
  },
  {
    path: "/vms/:hash/history",
    label: "VM history",
    dependsOn: "vms",
  },
];

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const override = params.get("api");
    if (override) return override;
  }
  return (
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081"
  );
}

function unwrapFirstHash(
  data: unknown,
  key: "nodes" | "vms",
): string | null {
  const hashField = key === "nodes" ? "node_hash" : "vm_hash";
  let arr: unknown[];
  if (Array.isArray(data)) {
    arr = data;
  } else if (
    data &&
    typeof data === "object" &&
    key in data
  ) {
    arr = (data as Record<string, unknown[]>)[key];
  } else {
    return null;
  }
  const first = arr[0];
  if (first && typeof first === "object" && hashField in first) {
    return (first as Record<string, string>)[hashField];
  }
  return null;
}

export default function StatusPage() {
  const [results, setResults] = useState<EndpointStatus[]>(
    ENDPOINTS.map((e) => ({
      path: `${API_PREFIX}${e.path}`,
      label: e.label,
      status: "pending",
      httpCode: null,
    })),
  );
  const [checking, setChecking] = useState(false);

  const runChecks = useCallback(async () => {
    setChecking(true);
    const baseUrl = getBaseUrl();
    const newResults: EndpointStatus[] = [];
    const listData: Record<string, unknown> = {};

    // Phase 1: independent endpoints (stats, nodes list, vms list)
    const independent = ENDPOINTS.filter((e) => !e.dependsOn);
    const indResults = await Promise.allSettled(
      independent.map(async (ep) => {
        const url = `${baseUrl}${API_PREFIX}${ep.path}`;
        const res = await fetch(url);
        const data = res.ok ? await res.json() : null;
        if (ep.path === "/nodes") listData.nodes = data;
        if (ep.path === "/vms") listData.vms = data;
        return {
          path: `${API_PREFIX}${ep.path}`,
          label: ep.label,
          status: (res.ok ? "healthy" : "error") as
            | "healthy"
            | "error",
          httpCode: res.status,
        };
      }),
    );
    for (const r of indResults) {
      newResults.push(
        r.status === "fulfilled"
          ? r.value
          : {
              path: "",
              label: "",
              status: "error",
              httpCode: null,
            },
      );
    }

    // Phase 2: dependent endpoints (detail + history)
    const dependent = ENDPOINTS.filter((e) => e.dependsOn);
    const depResults = await Promise.allSettled(
      dependent.map(async (ep) => {
        const hash = unwrapFirstHash(
          listData[ep.dependsOn!],
          ep.dependsOn as "nodes" | "vms",
        );
        if (!hash) {
          return {
            path: `${API_PREFIX}${ep.path}`,
            label: ep.label,
            status: "skipped" as const,
            httpCode: null,
          };
        }
        const resolvedPath = ep.path.replace(":hash", hash);
        const url = `${baseUrl}${API_PREFIX}${resolvedPath}`;
        const res = await fetch(url);
        return {
          path: `${API_PREFIX}${ep.path}`,
          label: ep.label,
          status: (res.ok ? "healthy" : "error") as
            | "healthy"
            | "error",
          httpCode: res.status,
        };
      }),
    );
    for (const r of depResults) {
      newResults.push(
        r.status === "fulfilled"
          ? r.value
          : {
              path: "",
              label: "",
              status: "error",
              httpCode: null,
            },
      );
    }

    setResults(newResults);
    setChecking(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const baseUrl = getBaseUrl();

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Checking endpoints at{" "}
          <code className="text-xs">{baseUrl}</code>
        </p>
        <button
          type="button"
          onClick={runChecks}
          disabled={checking}
          className="rounded-lg bg-primary-600/10 px-3 py-1.5 text-sm font-medium text-primary-400 transition-colors hover:bg-primary-600/20 disabled:opacity-50"
        >
          {checking ? "Checking…" : "Recheck"}
        </button>
      </div>

      <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface">
        {results.map((ep) => (
          <li
            key={ep.path}
            className="flex items-center gap-3 px-4 py-3"
          >
            <StatusDot
              status={
                ep.status === "pending"
                  ? "unknown"
                  : ep.status === "skipped"
                    ? "offline"
                    : ep.status
              }
            />
            <div className="flex-1 min-w-0">
              <a
                href={`${baseUrl}${ep.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-foreground hover:text-primary-400 transition-colors"
              >
                {ep.path}
              </a>
              <p className="text-xs text-muted-foreground">
                {ep.label}
              </p>
            </div>
            <span
              className={`text-xs font-mono ${
                ep.status === "healthy"
                  ? "text-success-400"
                  : ep.status === "error"
                    ? "text-error-400"
                    : "text-muted-foreground"
              }`}
            >
              {ep.status === "skipped"
                ? "skipped"
                : ep.status === "pending"
                  ? "…"
                  : ep.httpCode}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm typecheck && pnpm build`
Expected: No errors, `/status` route included in static export

**Step 3: Smoke test in dev**

Run: `pnpm dev`, navigate to `/status`. Verify:
- All 7 endpoints listed
- StatusDots show green/red/grey as appropriate
- HTTP codes displayed
- Clicking endpoint path opens raw API in new tab
- "Recheck" button re-runs checks
- Sidebar link highlights when on `/status`

**Step 4: Commit**

```bash
git add src/app/status/page.tsx
git commit -m "feat: add API status page with endpoint health checks"
```

---

### Task 4: Update integration tests for v1

**Files:**
- Modify: `src/api/client.test.ts`

Already done in Task 1. Verify all tests pass:

Run: `NEXT_PUBLIC_API_URL=https://rust-scheduler.aleph.im RUN_API_TESTS=true pnpm test src/api/client.test.ts`
Expected: All 12 tests PASS

---

### Task 5: Update docs

- [ ] ARCHITECTURE.md — add status page to project structure, add "API Status Page" pattern
- [ ] DECISIONS.md — log decision to switch from v0 to v1, and decision to not add version dropdown
- [ ] BACKLOG.md — move "Verify real API integration end-to-end" to Completed (status page addresses this)
- [ ] CLAUDE.md — add "API Status" to Current Features list
