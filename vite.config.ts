/// <reference types="vitest" />
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      $util: path.resolve(__dirname, 'src', 'util'),
      $components: path.resolve(__dirname, 'src', 'components'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup-vitest.js'],
  },
})
