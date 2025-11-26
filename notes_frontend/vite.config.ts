import { defineConfig } from 'vite'

/**
 * Slidev uses its own Vite server. Keep this config minimal and non-conflicting.
 * - Do not force the port; let Slidev decide (defaults to 3030).
 * - Expose host to 0.0.0.0 so the container proxy can reach it.
 * - Keep permissive CORS headers only.
 *
 * Host blocking & HMR over proxy:
 * Vite can emit "Blocked request. This host (...) is not allowed." when proxied through
 * workspace gateways. We include:
 * - The exact workspace host (from env or known fallback).
 * - Safe base domains used by the workspace (qa01.cloud.kavia.ai, cloud.kavia.ai).
 * We also configure HMR to use the workspace host and wss so the websocket connects
 * through the proxy.
 */
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  // Try to derive the workspace host from env first, else fallback to the known running container URL.
  // Users can override with VITE_FRONTEND_URL to ensure correctness.
  const fromEnvUrl =
    process.env.VITE_FRONTEND_URL ||
    process.env.FRONTEND_URL ||
    process.env.PUBLIC_URL ||
    ''
  let derivedHost = ''
  try {
    if (fromEnvUrl) {
      const u = new URL(fromEnvUrl)
      derivedHost = u.hostname
    }
  } catch {
    // ignore parse errors
  }

  // Fallback to the host we see in the running container metadata for this workspace.
  // Work item indicates: https://vscode-internal-10406-qa.qa01.cloud.kavia.ai:3000
  const FALLBACK_HOST = 'vscode-internal-10406-qa.qa01.cloud.kavia.ai'

  // Prefer derived host if available; otherwise use fallback.
  const WORKSPACE_HOST = derivedHost || FALLBACK_HOST

  // Vite expects exact strings for allowedHosts, so enumerate likely values.
  const INTERNAL_ALLOWED = [
    WORKSPACE_HOST,
    'localhost',
    '127.0.0.1',
    // Common internal domains used by the workspace proxy.
    'qa01.cloud.kavia.ai',
    'cloud.kavia.ai',
  ]

  // Optional: allow alternate vscode-internal-* frontends in the same environment
  // by dynamically including common patterns we know about. Since allowedHosts must be exact,
  // we include a few variants that may appear depending on port allocation or region.
  const POSSIBLE_PREFIXES = [
    'vscode-internal-',
  ]
  const POSSIBLE_SUFFIXES = [
    '.qa01.cloud.kavia.ai',
    '.cloud.kavia.ai',
  ]
  for (const pre of POSSIBLE_PREFIXES) {
    for (const suf of POSSIBLE_SUFFIXES) {
      const candidate = `${pre}10406-qa${suf}`
      if (!INTERNAL_ALLOWED.includes(candidate)) INTERNAL_ALLOWED.push(candidate)
    }
  }

  // Compute HMR origin and clientPort only when we can infer a proxy https port.
  // In this workspace, pages are served over https with port present in URL (e.g., :3000 path-terminated by proxy).
  // Let Vite infer port; we just set host/protocol to guide the websocket URL.
  const hmrHost = WORKSPACE_HOST
  const hmrProtocol = 'wss'

  return {
    server: {
      host: '0.0.0.0',
      // Do not set port; Slidev will choose/manage it.

      // Explicitly allow known workspace hosts.
      allowedHosts: INTERNAL_ALLOWED,

      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      watch: {
        // Polling helps file change detection in containerized volumes
        usePolling: true,
      },

      // Help websocket/HMR route through the proxy by setting the public host.
      // Keep port undefined so Slidev/Vite infer the running dev port.
      hmr: {
        host: hmrHost,
        protocol: hmrProtocol,
        // If a platform injects a different public port for client websocket, allow overriding via env.
        // e.g. VITE_HMR_CLIENT_PORT=443
        ...(process.env.VITE_HMR_CLIENT_PORT
          ? { clientPort: Number(process.env.VITE_HMR_CLIENT_PORT) }
          : {}),
        // Allow forcing HMR origin if provided (rarely needed, but safe escape hatch).
        ...(process.env.VITE_HMR_ORIGIN ? { origin: process.env.VITE_HMR_ORIGIN } : {}),
      },
    },
    // Define VITE_* access to avoid undefined during build when referenced
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || ''),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || ''),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(process.env.VITE_FRONTEND_URL || ''),
      'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || ''),
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(
        process.env.VITE_NODE_ENV || (isDev ? 'development' : 'production'),
      ),
    },
  }
})
