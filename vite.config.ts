import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      // dots-editor uses "ELK" as external, map to actual elkjs module
      'ELK': 'elkjs/lib/elk.bundled.js'
    }
  },
  optimizeDeps: {
    include: ['elkjs/lib/elk.bundled.js']
  }
})
