import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {VitePWA} from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'icons/favicon-32.png',
          'icons/apple-touch-icon.png',
        ],
        manifest: {
          name: 'NTPB — Noël pour les tout-petits de Batcha',
          short_name: 'NTPB Batcha',
          description:
            'Application officielle de gestion des campagnes de bienfaisance de Noël à Batcha : éditions, dons, promesses, KPIs et rapports officiels.',
          lang: 'fr',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#f9f9ff',
          theme_color: '#1b6d24',
          icons: [
            {src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png'},
            {src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png'},
            {
              src: 'icons/icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // Pré-cache de toute l'interface : l'app s'ouvre hors-ligne et la
          // navigation locale fonctionne, même si les données nécessitent
          // une connexion Supabase.
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
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
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
