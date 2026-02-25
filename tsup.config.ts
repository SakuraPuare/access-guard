import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { vite: 'src/vite.ts' },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['vite'],
})
