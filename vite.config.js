import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Désactiver les warnings inutiles en production
      devTarget: 'browser',
      fastRefresh: true,
    }),
  ],
  // Optimiser pour éviter les warnings inutiles
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  server: {
    // Réduire les logs inutiles en développement
    host: true,
    port: 5174,
  },
})
