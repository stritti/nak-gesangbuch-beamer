import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Lade Umgebungsvariablen
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'NAK Gesangbuch Beamer',
        short_name: 'NAK Beamer',
        description: 'Beamer-App für NAK-Gesangbuch',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true
  },
  // Stelle Umgebungsvariablen für die App bereit
  define: {
    'process.env.SONGS_DATA_PATH': JSON.stringify(env.VITE_SONGS_DATA_PATH || '/data')
  }
  };
});
