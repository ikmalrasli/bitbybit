import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'BitByBit',
        short_name: 'BitByBit',
        description: 'BitByBit habit tracking app',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'icons/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: 'icons/apple-icon-120.png', 
            sizes: '120x120',
            type: 'image/png'
          },
          {
            src: 'icons/apple-icon-76.png',
            sizes: '76x76', 
            type: 'image/png'
          }
        ]
      }
    })
  ]
})