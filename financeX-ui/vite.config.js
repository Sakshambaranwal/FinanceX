import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa';

import fs from 'fs';

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost-cert.pem'),
    },
    host: true
  },
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My App',
        short_name: 'App',
        description: 'My Vite PWA App',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'image.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'image.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'image.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),],
})
