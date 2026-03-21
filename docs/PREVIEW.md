# Multi-Branch Preview

Preview multiple feature branches side by side before deciding which to merge.

## Quick Start

```bash
# Start previewing the current branch (auto-detected)
pnpm preview start

# Or specify a branch explicitly
pnpm preview start feature/credits-v2

# Open the dashboard — lists all active previews with links
open http://localhost:3000

# See what's running
pnpm preview list

# Done comparing — stop everything
pnpm preview stop-all
```

## Commands

| Command | What it does |
|---------|-------------|
| `pnpm preview start [branch]` | Creates a worktree, starts a dev server (defaults to current branch) |
| `pnpm preview stop [branch]` | Stops the server, removes the worktree (defaults to current branch) |
| `pnpm preview stop-all` | Stops all servers and the dashboard |
| `pnpm preview list` | Shows active previews (branch, port, uptime) |
| `pnpm preview dashboard` | Starts just the dashboard (auto-started by `start`) |

## Ports

- **3000** — Dashboard (auto-refreshes every 5s)
- **3001+** — Preview dev servers (assigned sequentially)

If you normally run `pnpm dev` on port 3000, stop it first or use `pnpm preview start main` instead.

## Workflow

```
1. Work on feature branch → commit as you go
2. Implementation done → pnpm check passes
3. pnpm preview start                  ← preview current branch
4. Open localhost:3000                  ← compare branches
5. Happy with it → tell Claude to push + PR
6. pnpm preview stop-all               ← clean up
```

## How It Works

Each preview runs in a **git worktree** (isolated copy of the repo at `/tmp/previews/<branch>`). Node modules are hard-linked from the main repo (instant, no extra disk space). Env files (`.env.local`) are copied automatically.

State is tracked in `.previews.json` (gitignored). Stale entries (crashed servers) are auto-cleaned on every command.

## Tips

- You can preview the branch you're currently on — it uses detached HEAD mode
- Dev servers have full HMR — if you commit changes to a branch, the preview updates
- Logs are at `/tmp/previews/<branch>.log` if a server fails to start
- Worktrees are in `/tmp/` so they're cleaned up on reboot
