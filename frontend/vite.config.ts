import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/material/styles',
      '@emotion/react',
      '@emotion/styled'
    ]
  },
  server: {
    watch: {
      usePolling: true
    }
  }
}) 