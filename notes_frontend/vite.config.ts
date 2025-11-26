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
 * workspace host and permissive patterns for similar internal subdomains. This also
 * helps HMR/websocket to work through the proxy.
 */
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'

  // Workspace host reported by the user error
  const WORKSPACE_HOST = 'vscode-internal-10406-qa.qa01.cloud.kavia.ai'

  return {
    server: {
      host: '0.0.0.0',
      // Do not set port; Slidev will choose/manage it.

      // Allow the specific workspace host and a few permissive patterns for similar internal hosts.
      // Strings are treated as exact matches; patterns here cover common variants seen in CI/workspaces.
      // If your environment injects a different host, add it here.
      allowedHosts: [
        WORKSPACE_HOST,
        // common internal patterns (Vite supports strings, not regex; include a few typical base hosts)
        'localhost',
        '127.0.0.1',
        // fallback base domains for similar environments
        'qa01.cloud.kavia.ai',
        'cloud.kavia.ai',
      ],

      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      watch: {
        usePolling: true,
      },

      // Ensure HMR is not restrictive: omit explicit port/host so Vite/Slidev can infer via the request.
      // If needed in some proxies, you can set hmr.host to WORKSPACE_HOST, but leaving undefined avoids mismatches.
      hmr: {
        // host: WORKSPACE_HOST,
      },
    },
    // Define VITE_* access to avoid undefined during build when referenced
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(process.env.VITE_API_BASE || ''),
      'import.meta.env.VITE_BACKEND_URL': JSON.stringify(process.env.VITE_BACKEND_URL || ''),
      'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(process.env.VITE_FRONTEND_URL || ''),
      'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || ''),
      'import.meta.env.VITE_NODE_ENV': JSON.stringify(process.env.VITE_NODE_ENV || (isDev ? 'development' : 'production')),
    },
  }
})
