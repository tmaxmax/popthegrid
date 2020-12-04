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
      PORT: process.env.PORT,
    }),
    watch &&
      serve({
        port: 8080,
        contentBase: 'public',
      }),
    watch &&
      livereload({
        watch: 'public',
        usePolling: true,
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
