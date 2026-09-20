import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/onnxruntime-web/dist/*.{wasm,mjs}',
          dest: 'wasm',
        },
      ],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'models/*.onnx', 'wasm/*.wasm'],
      manifest: {
        name: 'OcularScreen Research Instrument',
        short_name: 'OcularScreen',
        description: 'Edge client-side anterior-segment screening research prototype',
        theme_color: '#020617',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 35 * 1024 * 1024, // 35 MB to comfortably accommodate the 5.44 MB ONNX model and WASM binaries
        globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,onnx,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.onnx') || url.pathname.endsWith('.wasm'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-model-wasm-cache-v3',
              expiration: {
                maxEntries: 15,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year offline cache
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['onnxruntime-web'],
  },
});
