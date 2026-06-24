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
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', 'release', '.erb', 'test/integration'],
    setupFiles: [],
    testTimeout: 10000,
    hookTimeout: 10000,
    silent: true,
    logHeapUsage: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage/unit',
      thresholds: {
        statements: 15,
        branches: 10,
        functions: 10,
        lines: 15,
      },
      exclude: [
        'node_modules/**',
        'release/**',
        '.erb/**',
        'test/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/routeTree.gen.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      src: path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
}))
