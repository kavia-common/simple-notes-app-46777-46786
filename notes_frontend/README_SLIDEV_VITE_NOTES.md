# Slidev + Vite configuration notes

This project uses `@slidev/cli`, which runs its own Vite server. A local `vite.config.ts` is supported, but:
- Do not force a specific `server.port` — Slidev manages the port (default 3030) and conflicts can break HMR or dev startup.
- Keep `server.host = '0.0.0.0'` so the container proxy can access the server.
- Prefer not to set `allowedHosts` broadly. However, in container workspaces where Vite shows
  “Blocked request. This host is not allowed.”, explicitly add the current workspace host and
  safe base domains (e.g., `vscode-internal-*.cloud.kavia.ai`, `*.cloud.kavia.ai`) as exact
  strings in `server.allowedHosts`. Our config enumerates these hosts.
- Minimal headers (CORS) are okay.
- To improve HMR/websocket over proxies, set `server.hmr.host` to the workspace host and let the
  port be inferred.

We also define `import.meta.env.VITE_*` keys to safe empty strings to prevent build-time "undefined" issues when components read them. Provide real values via environment variables if needed.
