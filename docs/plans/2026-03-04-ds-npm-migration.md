# DS npm Migration Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `file:` protocol link to `@aleph-front/ds` with the published npm package.

**Architecture:** The DS publishes raw `.tsx` source (no build step), so `transpilePackages`, the `@ac/*` path alias, and the Tailwind `@source` directive all stay. The migration touches only the dependency specifier in `package.json`, then verifies everything still works. Documentation updates reflect the new reality.

**Tech Stack:** pnpm, Next.js 16, Tailwind CSS 4, Vitest

---

### Task 1: Update dependency specifier

**Files:**
- Modify: `package.json:15`

**Step 1: Replace the file: link with a pinned npm version**

In `package.json`, change:
```json
"@aleph-front/ds": "file:../aleph-cloud-ds/packages/ds",
```
to:
```json
"@aleph-front/ds": "0.0.3",
```

**Step 2: Install and verify lockfile**

Run: `pnpm install`
Expected: Clean install, lockfile updates from `file:` resolution to npm registry resolution.

**Step 3: Verify the installed package has the expected structure**

Run: `ls node_modules/@aleph-front/ds/src/components/`
Expected: Directories for `badge/`, `card/`, `table/`, `tooltip/`, `status-dot/`, `ui/`, etc.

Run: `ls node_modules/@aleph-front/ds/src/styles/tokens.css`
Expected: File exists.

**Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: migrate @aleph-front/ds from file: link to npm"
```

---

### Task 2: Verify build and tests

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — all DS subpath imports resolve, `@ac/*` alias still works.

**Step 2: Run tests**

Run: `pnpm test`
Expected: PASS — vitest `@ac` alias points to same `node_modules/@aleph-front/ds/src`.

**Step 3: Run full build**

Run: `pnpm build`
Expected: Static export succeeds to `out/`. Tailwind scans DS source via `@source` directive, tokens import resolves.

**Step 4: Run lint**

Run: `pnpm lint`
Expected: PASS.

If anything fails, debug before proceeding. The config files (`next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `globals.css`) should need zero changes since the DS still publishes raw source at the same internal paths.

---

### Task 3: Update documentation

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/DECISIONS.md`
- Modify: `docs/BACKLOG.md`
- Modify: `CLAUDE.md`

**Step 1: Update ARCHITECTURE.md**

In the DS Component Policy pattern, change:
```
DS is linked via `file:` protocol.
```
to:
```
DS is installed from npm (pinned version).
```

**Step 2: Log decision in DECISIONS.md**

Add Decision #13:
```markdown
## Decision #13 - 2026-03-04
**Context:** `@aleph-front/ds` is now published on npm; the `file:` link required the DS repo cloned locally
**Decision:** Migrate from `file:../aleph-cloud-ds/packages/ds` to pinned npm version (`0.0.3`)
**Rationale:** npm dependency removes the requirement to have the DS repo cloned adjacent to the dashboard. CI/CD can install without local filesystem access. Version pinning (exact, no `^`) ensures reproducible builds. The DS still publishes raw `.tsx` source, so `transpilePackages`, `@ac/*` alias, and Tailwind `@source` directive remain unchanged.
**Alternatives considered:** Using `^0.0.x` range (risky with 0.x semver — patch versions can break), publishing pre-compiled output (more work in DS, no benefit yet since only one consumer).
```

**Step 3: Move backlog item to Completed**

Move "DS npm publishing" from Open Items to the Completed section:
```markdown
- ✅ 2026-03-04 - DS npm publishing — migrated from `file:` link to npm `0.0.3`
```

**Step 4: Update CLAUDE.md**

In the `@aleph-front/ds` integration line, change:
```
`@aleph-front/ds` integration via `file:` link and `transpilePackages`
```
to:
```
`@aleph-front/ds` integration via npm (pinned version) and `transpilePackages`
```

In the DS Component Lifecycle section, remove or update any references to the DS being a local `file:` dependency.

**Step 5: Commit**

```bash
git add docs/ARCHITECTURE.md docs/DECISIONS.md docs/BACKLOG.md CLAUDE.md
git commit -m "docs: update for DS npm migration"
```
