# Slidev + Vite configuration notes

This project uses `@slidev/cli`, which runs its own Vite server. A local `vite.config.ts` is supported, but:
- Do not force a specific `server.port` — Slidev manages the port (default 3030) and conflicts can break HMR or dev startup.
- Keep `server.host = '0.0.0.0'` so the container proxy can access the server.
- Prefer not to set `allowedHosts` broadly. However, in container workspaces where Vite shows
  “Blocked request. This host is not allowed.”, we explicitly add:
  - the current workspace host (e.g. `vscode-internal-10406-qa.qa01.cloud.kavia.ai`), and
  - safe base domains (`qa01.cloud.kavia.ai`, `cloud.kavia.ai`)
  as exact strings in `server.allowedHosts`. Our config enumerates these hosts.
- Minimal headers (CORS) are okay.
- To improve HMR/websocket over proxies, we set `server.hmr.host` to the workspace host and use `wss`.
  Let the port be inferred by Vite/Slidev.

Environment overrides (optional):
- VITE_FRONTEND_URL: Full URL of the public dev origin (e.g. `https://vscode-internal-10406-qa.qa01.cloud.kavia.ai:3000`). If set, the host will be derived from it.
- VITE_HMR_CLIENT_PORT: Force HMR clientPort when the proxy requires a specific port (default inferred).
- VITE_HMR_ORIGIN: Set a full HMR origin if necessary (rare).

Validation:
1) Install deps: `npm ci` (or `npm install`).
2) Run dev: `npm run dev`.
3) Open the workspace preview URL shown by the orchestrator. The error
   “Blocked request. This host is not allowed.” should be gone and HMR should connect (green WebSocket icon in devtools).

We also define `import.meta.env.VITE_*` keys to safe empty strings to prevent build-time "undefined" issues when components read them. Provide real values via environment variables if needed.
