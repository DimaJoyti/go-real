import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/Components'),
      '@/pages': path.resolve(__dirname, './src/Pages'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/redux': path.resolve(__dirname, './src/redux'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
