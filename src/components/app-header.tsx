"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { truncateHash } from "@/lib/format";

const ROUTE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/nodes": "Nodes",
  "/vms": "Virtual Machines",
  "/status": "API Status",
};

function PageTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const viewHash = searchParams.get("view");

  let title = ROUTE_TITLES[normalized] ?? "Dashboard";
  if (viewHash) {
    if (normalized === "/nodes") {
      title = `Node: ${truncateHash(viewHash, 12)}`;
    } else if (normalized === "/vms") {
      title = `VM: ${truncateHash(viewHash, 12)}`;
    }
  }

  return <h1 className="text-lg font-bold">{title}</h1>;
}

function PageTitleFallback() {
  const pathname = usePathname();
  const normalized = pathname.replace(/\/$/, "") || "/";
  const title = ROUTE_TITLES[normalized] ?? "Dashboard";
  return <h1 className="text-lg font-bold">{title}</h1>;
}

type AppHeaderProps = {
  onMenuClick: () => void;
};

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-edge bg-surface px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Suspense fallback={<PageTitleFallback />}>
          <PageTitle />
        </Suspense>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
