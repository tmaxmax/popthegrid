import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      $util: path.resolve(__dirname, 'src', 'util'),
      $components: path.resolve(__dirname, 'src', 'components'),
      $db: path.resolve(__dirname, 'src', 'db'),
      $game: path.resolve(__dirname, 'src', 'game'),
      $share: path.resolve(__dirname, 'src', 'share'),
      $theme: path.resolve(__dirname, 'src', 'theme.ts'),
      $rand: path.resolve(__dirname, 'src', 'rand.ts'),
    },
  },
  publicDir: false,
  build: {
    manifest: true,
    rollupOptions: {
      input: path.resolve(__dirname, process.env.ENTRYPOINT!),
    },
  },
  server: {
    cors: {
      origin: process.env.URL,
    },
  },
  plugins: [svelte()],
})
