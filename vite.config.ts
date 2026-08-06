/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Served from https://danshorstein.github.io/Number-block-music/ — base, PWA scope and
// start_url must all agree on this subpath or the deploy is a blank white screen.
const BASE = '/Number-block-music/'

export default defineConfig({
  base: BASE,
  build: {
    rollupOptions: {
      input: {
        // The kid's app, and the printable pack that carries it to the real piano (§8.4).
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        print: fileURLToPath(new URL('./print/index.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Music Blocks',
        short_name: 'Music Blocks',
        description: 'Learn the notes of the scale as counted, colored blocks.',
        theme_color: '#1b1136',
        background_color: '#1b1136',
        display: 'standalone',
        orientation: 'landscape',
        scope: BASE,
        start_url: BASE,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The piano is the app. Precache it so the first tap after install is instant
        // and §9's "no network calls after load" holds offline too.
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
