import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/apps': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/schema': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/data': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/workflows': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/tasks': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    }
  }
})
