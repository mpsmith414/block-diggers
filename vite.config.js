import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/block-diggers/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        diag: resolve(import.meta.dirname, 'diag.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
