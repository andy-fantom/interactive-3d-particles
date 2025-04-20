import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  base: './',
  server: {
    host: true,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
});
