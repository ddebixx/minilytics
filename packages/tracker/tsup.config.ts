import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: true,
  },
  {
    entry: {
      react: 'src/react.tsx',
    },
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    minify: true,
    external: ['react'],
    banner: {
      js: '"use client";',
    },
  },
])
