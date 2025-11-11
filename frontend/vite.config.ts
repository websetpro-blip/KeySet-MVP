import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const normalizePath = (id: string) => id.replace(/\\/g, '/')

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = normalizePath(id)
          if (normalized.includes('node_modules')) {
            if (normalized.includes('react')) {
              return 'vendor-react'
            }
            return 'vendor'
          }
          if (normalized.includes('/modules/data/')) {
            return 'tab-data'
          }
          if (normalized.includes('/modules/data/components/Modals/WordstatModal')) {
            return 'modal-wordstat'
          }
        },
      },
    },
  },
})
