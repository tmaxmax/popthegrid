/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA as pwa } from 'vite-plugin-pwa'

export default defineConfig({
  resolve: {
    alias: {
      $util: path.resolve(__dirname, 'src', 'util'),
      $components: path.resolve(__dirname, 'src', 'components'),
      $db: path.resolve(__dirname, 'src', 'db'),
      $game: path.resolve(__dirname, 'src', 'game'),
      $share: path.resolve(__dirname, 'src', 'share'),
      $edge: path.resolve(__dirname, 'netlify', 'edge'),
      $theme: path.resolve(__dirname, 'src', 'theme.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup-vitest.js'],
  },
  plugins: [
    svelte(),
    pwa({
      base: '/',
      strategies: 'injectManifest',
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      filename: 'sw.ts',
      srcDir: 'src',
      includeAssets: ['icons/*'],
      manifest: {
        name: 'Pop the grid!',
        short_name: 'Pop the grid!',
        description: 'Pop all the squares in the grid. Will you make it?',
        icons: [
          {
            src: '/icons/android-icon-36x36.png',
            sizes: '36x36',
            type: 'image/png',
          },
          {
            src: '/icons/android-icon-48x48.png',
            sizes: '48x48',
            type: 'image/png',
          },
          {
            src: '/icons/android-icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: '/icons/android-icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/android-icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/android-icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/splash.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        background_color: '#000f1e',
        theme_color: '#000f1e',
        display: 'fullscreen',
        start_url: '.',
        prefer_related_applications: false,
        id: '/',
      },
    }),
  ],
})
