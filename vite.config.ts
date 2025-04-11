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
      $edge: path.resolve(__dirname, 'netlify', 'edge'),
      $theme: path.resolve(__dirname, 'src', 'theme.ts'),
    },
  },
  plugins: [svelte()],
})
