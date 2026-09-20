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

// Shared proxy options — ensures Authorization and Cookie headers pass through correctly
const makeProxy = (target) => ({
  target,
  changeOrigin: true,
  // Serve index.html ONLY for browser page navigation/refresh, NEVER for API calls
  bypass: (req) => {
    // 1. Browser navigation / refresh in address bar (always sends Accept: text/html)
    const isHtmlNavigation =
      req.method === 'GET' &&
      req.headers.accept &&
      req.headers.accept.includes('text/html');

    if (isHtmlNavigation) {
      return '/index.html';
    }

    // 2. Pure React UI page routes (never proxy plural frontend paths to backend microservices)
    const cleanUrl = (req.url || '').split('?')[0];
    if (
      cleanUrl === '/expenses' ||
      cleanUrl === '/investments' ||
      cleanUrl === '/creditcards' ||
      cleanUrl === '/profile' ||
      cleanUrl === '/dashboard'
    ) {
      return '/index.html';
    }

    // All API calls (/login, /register, /user, /expense, /investment, /p2p, /creditcard) proceed to gateway
  },
  // Forward cookies and auth headers without modification
  configure: (proxy) => {
    proxy.on('proxyReq', (proxyReq, req) => {
      // Preserve Authorization header if present
      if (req.headers['authorization']) {
        proxyReq.setHeader('Authorization', req.headers['authorization']);
      }
      // Preserve Cookie header so the HttpOnly JWT cookie reaches the gateway
      if (req.headers['cookie']) {
        proxyReq.setHeader('Cookie', req.headers['cookie']);
      }
    });
    // Forward Set-Cookie from gateway back to the browser as-is
    proxy.on('proxyRes', (proxyRes) => {
      if (proxyRes.headers['set-cookie']) {
        const cookies = Array.isArray(proxyRes.headers['set-cookie'])
          ? proxyRes.headers['set-cookie']
          : [proxyRes.headers['set-cookie']];
        proxyRes.headers['set-cookie'] = cookies.map(cookie =>
          // Remove Secure flag in dev (plain HTTP development)
          cookie.replace(/;\s*Secure/gi, '')
        );
      }
    });
  }
});

const GATEWAY = process.env.VITE_GATEWAY_URL || (process.env.GATEWAY_PORT ? `http://127.0.0.1:${process.env.GATEWAY_PORT}` : 'http://127.0.0.1:8080');

const sharedProxyConfig = {
  '/login':      makeProxy(GATEWAY),
  '/register':   makeProxy(GATEWAY),
  '/auth':       makeProxy(GATEWAY),
  '/ping':       makeProxy(GATEWAY),
  '/user':       makeProxy(GATEWAY),
  '/admin':      makeProxy(GATEWAY),
  '/expense':    makeProxy(GATEWAY),
  '/investment': makeProxy(GATEWAY),
  '/p2p':        makeProxy(GATEWAY),
  '/creditcard': makeProxy(GATEWAY),
};

// https://vite.dev/config/
export default defineConfig({
  envDir: '..',
  server: {
    ...(httpsOptions ? { https: httpsOptions } : {}),
    host: true,
    allowedHosts: true,
    proxy: sharedProxyConfig
  },
  preview: {
    host: true,
    allowedHosts: true,
    proxy: sharedProxyConfig
  },
  plugins: [react(), VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FinanceX',
        short_name: 'FinanceX',
        description: 'FinanceX | Smart Wealth, Expense & Credit OS',
        theme_color: '#0b0f19',
        icons: [
          { src: 'logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: 'image.png', sizes: '192x192', type: 'image/png' },
          { src: 'image.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),],
})
