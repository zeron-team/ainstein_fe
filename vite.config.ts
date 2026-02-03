import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: '0.0.0.0', // Bind to all interfaces
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: '144.217.241.183',
      clientPort: 5173,
    },
    allowedHosts: ['all'],
    cors: true,
  },
})