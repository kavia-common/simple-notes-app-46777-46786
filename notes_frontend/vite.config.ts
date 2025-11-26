import { defineConfig } from 'vite'

/**
 * Slidev uses its own Vite server. Keep this config minimal and non-conflicting.
 * - Do not force the port; let Slidev decide (defaults to 3030).
 * - Expose host to 0.0.0.0 so the container proxy can reach it.
 * - Keep permissive CORS headers only.
 * - Avoid allowedHosts which can block HMR/websocket in some environments.
 */
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  return {
    server: {
      host: '0.0.0.0',
      // Do not set port; Slidev will choose/manage it.
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      watch: {
        usePolling: true,
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
