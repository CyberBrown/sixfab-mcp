# Handoff — 2026-06-03

## Current state
**sixfab-mcp is ported off Cloudflare Workers to a plain Node service and pushed
(`master` @ `f85213e`), but NOT yet deployed.** The old CF Worker at
`https://sixfab-mcp.solamp.workers.dev/mcp` is still live and still the URL the
claude.ai connector uses — nothing is broken, the migration just isn't finished.

What changed in code: `agents/mcp` `createMcpHandler` (Workers-only) was replaced
with the MCP SDK's stateless `StreamableHTTPServerTransport` behind a `node:http`
server (`src/server.ts`). All 22 tools + `SixfabClient` are untouched. Built with
esbuild → `dist/server.js`. Env comes from `process.env` / `.env` now. Auth is
still per-tool-call via `WRITE_PASSPHRASE`. Verified locally: health, initialize,
tools/list (22 tools), and a live `sixfab_list_assets` call all work.

This is half of a two-repo effort (`sixfab-mcp` + `ui-api-mcp`) to move both MCPs
off Cloudflare onto a **new snoochie LXC**, fronted by **CT 100's Caddy** at
`*.solamp.online`. The infra (LXC, Caddy vhosts, DNS) is not built yet.

## Next steps (resume here)
1. **Provision a new LXC on snoochie** (Proxmox host root in Pass: *"Snoochie
   Proxmox — root (current)"*; provision API token: *"Proxmox Helsinki —
   claude@pve!provision"*). Snoochie currently runs CTs 100–108; pick a free
   cluster-wide VMID. Put it on the internal `10.10.10.x` subnet. Install Node 22
   + Tailscale (reusable preauth key in Pass: *"Tailscale — autoinstall auth
   key"*).
2. **Deploy both services** as systemd units (sixfab on `:8792`, ui-api on
   `:8788` — matches their old dev ports). `git clone`, `npm ci && npm run
   build`, run `node dist/server.js` with env from `/etc/<svc>/env`.
3. **Generate ONE shared `WRITE_PASSPHRASE`** for both servers (user's decision),
   save to Proton Pass, set it in both services' env. (sixfab's *old* passphrase
   is in `~/projects/sixfab-mcp/.dev.vars` locally if needed for reference, but
   we're rotating to a fresh shared one at cutover.)
4. **Add Caddy vhosts on CT 100** (`10.10.10.100`, root in Pass: *"sandstorm-
   helsinki LXC 100 — root (updated)"*): `sixfab-mcp.solamp.online.conf` and
   `ui-api-mcp.solamp.online.conf`, each `reverse_proxy` to the new CT's
   `10.10.10.x:<port>`. Model on `/etc/caddy/vhosts/comfyui-mcp.solamp.online.conf`
   (but no Bearer gate needed — auth is the in-tool passphrase). `systemctl reload caddy`.
5. **Add DNS A records** at Hetzner: `sixfab-mcp` + `ui-api-mcp` →
   `65.21.205.247` on `solamp.online`. ⚠️ The legacy Hetzner DNS API token in Pass
   returns zero zones (see global CLAUDE.md) — likely need the new Hetzner Console
   token or do it in the web console.
6. **Verify** new HTTPS `/mcp` endpoints (initialize + an authed tool call).
7. **Hand off to user:** give them the two new URLs
   (`https://sixfab-mcp.solamp.online/mcp`, `https://ui-api-mcp.solamp.online/mcp`)
   + the shared passphrase to set in the claude.ai connectors. **Agent cannot edit
   claude.ai connectors.**
8. **After the user confirms the new connectors work**, delete the two CF Workers
   + workers.dev routes (`bunx wrangler delete` per repo, or CF dashboard). This is
   the only irreversible step — gate it on user confirmation.

## Decisions made this session
- **Auth: keep passphrase-in-tool-args** (not OAuth via mcp-oauth-proxy — that
  proxy is pre-alpha and overkill for two single-user tool servers).
- **Host: a separate new snoochie LXC** (not CT 100 itself).
- **Hostnames: `*.solamp.online`** (Hetzner DNS, already off Cloudflare).
- **Passphrase: generate one fresh shared passphrase** for both at cutover.
- **Port mechanism: MCP SDK stateless StreamableHTTPServerTransport**, not the
  `agents` library (which needs the Workers runtime / would force keeping CF).
- **esbuild single-file bundle** so the LXC needs no `node_modules` at runtime.

## Known debt / open questions
- `wrangler.toml` was deleted, so the repo can no longer redeploy the CF Worker.
  The deployed Worker still runs (CF keeps it until explicitly deleted) — fine
  during migration, but means "rollback = the live worker is still there", good.
- README is empty in this repo — consider a short one when convenient.

## In-flight remote state
- **CF Workers still live** (account `52b1c60ff2a24fb21c1ef9a429e63261`, subdomain
  `solamp`): `sixfab-mcp.solamp.workers.dev`, `ui-api-mcp.solamp.workers.dev`.
  These are still the active claude.ai connector endpoints. Do NOT delete until
  the user re-points connectors and confirms.
- No open PRs. Both repos pushed to default branch.
- **ui-api-mcp blocker:** its `api.ui.com` (UniFi Site Manager cloud) `UI_API_KEY`
  is NOT in Pass and cannot be read from the CF secret. User agreed to add it to
  Proton Pass (suggested title e.g. *"UniFi Site Manager — api.ui.com key"*). The
  existing *"UniFi UDM Pro — local Network API key"* in Pass is a DIFFERENT API
  (local controller `192.168.11.1/proxy/network/integration`) and 401s against
  api.ui.com — do not use it. See `~/projects/ui-api-mcp/HANDOFF.md`.
