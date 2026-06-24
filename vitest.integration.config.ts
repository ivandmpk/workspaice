import path from 'node:path'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => ({
  test: {
    globals: true,
    environment: 'node',
    env: {
      ...loadEnv(mode, process.cwd(), ''),
      NODE_ENV: 'test',
    },
    include: ['test/integration/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release', '.erb', 'test/integration/model-provider'],
    setupFiles: [],
    testTimeout: 300000,
    hookTimeout: 300000,
    silent: true,
    logHeapUsage: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      src: path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
}))
