import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorPackages = [
  'react',
  'react-dom',
  'react-router-dom',
  'zustand',
]

const uiPackages = [
  '@radix-ui/react-dialog',
  '@radix-ui/react-dropdown-menu',
  '@dnd-kit/core',
]

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (vendorPackages.some((pkg) => id.includes(pkg))) {
              return 'vendor'
            }
            if (uiPackages.some((pkg) => id.includes(pkg))) {
              return 'ui'
            }
          }
        },
      },
    },
  },
})
