import { defineConfig } from 'vite'

/**
 * Slidev uses its own Vite server. Keep this config minimal and non-conflicting.
 * - Do not force the port; let Slidev decide (defaults to 3030).
 * - Expose host to 0.0.0.0 so the container proxy can reach it.
 * - Keep permissive CORS headers only.
 *
 * Host blocking fix:
 * Vite can emit "Blocked request. This host (...) is not allowed." when proxied through
 * workspace gateways. To resolve, declare server.allowedHosts to include the exact
 * workspace host and several common internal hosts. This also helps HMR/websocket
 * to work through the proxy.
 */
export default defineConfig(({ command }) => {
  const isDev = command === 'serve'

  // Exact workspace host reported in the error/screenshot
  const WORKSPACE_HOST = 'vscode-internal-10406-qa.qa01.cloud.kavia.ai'

  // We can’t use wildcards here (Vite expects exact strings), so enumerate safe bases
  // that commonly appear in the workspace/proxy flow.
  const INTERNAL_ALLOWED = [
    WORKSPACE_HOST,
    'localhost',
    '127.0.0.1',
    // Common internal domains used by the workspace proxy. Including base domains
    // allows the proxy to pass Host headers for sub-resources like HMR/websocket upgrades.
    'qa01.cloud.kavia.ai',
    'cloud.kavia.ai',
  ]

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
        host: WORKSPACE_HOST,
        protocol: 'wss',
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
