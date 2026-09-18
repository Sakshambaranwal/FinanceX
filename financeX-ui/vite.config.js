import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { VitePWA } from 'vite-plugin-pwa';

import fs from 'fs';

const httpsOptions = fs.existsSync('./localhost-key.pem') && fs.existsSync('./localhost-cert.pem')
  ? {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost-cert.pem'),
    }
  : undefined;

// https://vite.dev/config/
export default defineConfig({
  server: {
    ...(httpsOptions ? { https: httpsOptions } : {}),
    host: true,
    allowedHosts: true,
    proxy: {
      '/login': 'http://127.0.0.1:8080',
      '/register': 'http://127.0.0.1:8080',
      '/ping': 'http://127.0.0.1:8080',
      '/user': 'http://127.0.0.1:8080',
      '/admin': 'http://127.0.0.1:8080',
      '/expense': 'http://127.0.0.1:8080',
      '/investment': 'http://127.0.0.1:8080',
      '/p2p': 'http://127.0.0.1:8080',
      '/creditcard': 'http://127.0.0.1:8080',
    }
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
