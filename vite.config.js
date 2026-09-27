import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

// Dev only: POST a canvas data URL to /__shot?name=x to save .shots/x.png.
const screenshots = () => ({
  name: 'dev-screenshots',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use('/__shot', (req, res) => {
      const name = new URL(req.url, 'http://x').searchParams.get('name') || 'shot';
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        const dir = resolve(import.meta.dirname, '.shots');
        mkdirSync(dir, { recursive: true });
        const file = resolve(dir, `${name.replace(/[^\w-]/g, '_')}.png`);
        writeFileSync(file, Buffer.from(body.replace(/^data:image\/png;base64,/, ''), 'base64'));
        res.end(file);
      });
    });
  },
});

export default defineConfig({
  base: '/block-diggers/',
  plugins: [screenshots()],
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
