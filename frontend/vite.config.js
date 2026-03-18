/**
 * Vite configuration for Krishi-Trace AI frontend.
 *
 * Build output goes to `dist/` (Vercel reads this via `outputDirectory` in vercel.json).
 *
 * Dev proxy:
 *   All `/api/*` requests are forwarded to the local backend (http://localhost:5000)
 *   so you don't need CORS headers during development.
 *
 * Production:
 *   The proxy is NOT active. The frontend uses the `VITE_API_URL` environment
 *   variable (set in Vercel dashboard or `.env.local`) to reach the deployed backend.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Output directory — must match `outputDirectory` in frontend/vercel.json
    outDir: 'dist',
    // Generate source maps for easier debugging in production
    sourcemap: false,
    // Warn if a chunk exceeds 1 MB
    chunkSizeWarningLimit: 1000,
  },

  server: {
    port: 5173,
    // Dev-only proxy: forwards /api/* to the local Express server
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
