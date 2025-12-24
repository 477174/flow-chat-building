import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production, etc.)
  const env = loadEnv(mode, process.cwd(), '')

  // API base URL from environment or default
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8003'

  // Base path for deployment (e.g., '/flow-builder' when behind nginx proxy)
  const basePath = env.VITE_BASE_PATH || '/'

  return {
    plugins: [react(), tailwindcss()],
    base: basePath,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      allowedHosts: ['tunnel-atila.videoai.com.br'],
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    // Handle SPA routing - serve index.html for /flows/* paths
    appType: 'spa',
  }
})
