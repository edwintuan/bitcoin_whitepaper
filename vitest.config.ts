import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

// Kept separate from vite.config.ts: the test runner ships its own bundler,
// and tests need neither the React refresh plugin nor Tailwind.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
