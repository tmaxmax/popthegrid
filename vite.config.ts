/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  resolve: {
    alias: {
      $util: path.resolve(__dirname, 'src', 'util'),
      $components: path.resolve(__dirname, 'src', 'components'),
      $db: path.resolve(__dirname, 'src', 'db'),
      $game: path.resolve(__dirname, 'src', 'game'),
      $share: path.resolve(__dirname, 'src', 'share'),
      $edge: path.resolve(__dirname, 'netlify', 'edge'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup-vitest.js'],
  },
  plugins: [svelte()],
})
