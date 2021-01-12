import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'
import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import serve from 'rollup-plugin-serve'
import postcss from 'rollup-plugin-postcss'
import postcssPresetEnv from 'postcss-preset-env'
import cssnano from 'cssnano'
import eslint from '@rollup/plugin-eslint'
import injectProcessEnv from '@tmaxmax/rollup-plugin-inject-process-env'
import fs from 'fs'

export default ({ watch }) => ({
  input: './src/index.ts',
  output: {
    sourcemap: true,
    format: 'iife',
    file: './public/build/bundle.js',
    name: 'grid',
  },
  plugins: [
    postcss({
      extract: true,
      plugins: [postcssPresetEnv(), cssnano()],
    }),
    eslint(),
    resolve({
      next: true,
      main: true,
      browser: true,
    }),
    commonjs(),
    typescript(),
    injectProcessEnv({
      NODE_ENV: process.env.NODE_ENV,
      DEBUG: process.env.DEBUG,
    }),
    watch &&
      serve({
        port: 80,
        contentBase: 'public',
      }),
    watch &&
      livereload({
        watch: 'public',
        https: {
          key: fs.readFileSync('./nginx/certs/key.pem'),
          cert: fs.readFileSync('./nginx/certs/crt.pem'),
        }
      }),
    !watch && terser(),
  ],
  watch: {
    clearScreen: false,
    chokidar: {
      usePolling: true,
    },
  },
})
