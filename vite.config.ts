import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'kill-vite-client',
        resolveId(id) {
          if (id === '/@vite/client' || id.includes('vite/dist/client')) {
            return 'virtual:kill-vite-client';
          }
        },
        load(id) {
          if (id === 'virtual:kill-vite-client') {
            return 'export const createHotContext = () => ({ accept: () => {}, prune: () => {}, dispose: () => {}, decline: () => {}, invalidate: () => {}, on: () => {}, send: () => {} }); export const injectQuery = (i) => i; console.log("Vite Client Suppressed.");';
          }
        },
        transformIndexHtml(html) {
          return html.replace(/<script type="module" src="\/@vite\/client"><\/script>/g, '');
        }
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'আমার ফ্ল্যাট - Flat Manager',
          short_name: 'আমার ফ্ল্যাট',
          description: 'সম্পূর্ণ ফ্ল্যাট ও ভাড়াটিয়া ব্যবস্থাপনা ড্যাশবোর্ড',
          theme_color: '#0f0f1e',
          background_color: '#0f0f1e',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: false,
      watch: null,
      ws: false as const,
      middlewareMode: true,
    },
  };
});
