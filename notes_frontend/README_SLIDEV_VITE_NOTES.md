# Slidev + Vite configuration notes

This project uses `@slidev/cli`, which runs its own Vite server. A local `vite.config.ts` is supported, but:
- Do not force a specific `server.port` — Slidev manages the port (default 3030) and conflicts can break HMR or dev startup.
- Keep `server.host = '0.0.0.0'` so the container proxy can access the server.
- Avoid `allowedHosts` as it can block websocket connections in containerized proxies.
- Minimal headers (CORS) are okay.

We also define `import.meta.env.VITE_*` keys to safe empty strings to prevent build-time "undefined" issues when components read them. Provide real values via environment variables if needed.
