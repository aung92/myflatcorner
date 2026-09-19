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
        disable: process.env.NODE_ENV !== 'production',
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'MyFlat Management',
          short_name: 'MyFlat',
          description: 'A modern, real-time flat billing and tenant management app.',
          theme_color: '#3b82f6',
          background_color: '#f8fafc',
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
        devOptions: {
          enabled: false,
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
