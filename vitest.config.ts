import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['__tests__/setup.ts'],
    exclude: ['**/node_modules/**', '**/e2e/**', '**/tests/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
