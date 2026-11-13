import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: [],
    manifest: {
      name: 'Smart Inventory Pro', short_name: 'Inventory Pro',
      description: 'Inventory, sales and restocking dashboard',
      theme_color: '#101827', background_color: '#f4f7fb',
      display: 'standalone', start_url: '/',
      icons: []
    },
    workbox: { navigateFallback: '/index.html', globPatterns: ['**/*.{js,css,html,svg,png,ico}'] }
  })],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } }
});
