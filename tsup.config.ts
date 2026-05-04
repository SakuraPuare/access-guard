import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { vite: 'src/vite.ts', electron: 'src/electron.ts', core: 'src/core/index.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['vite', 'electron'],
})
