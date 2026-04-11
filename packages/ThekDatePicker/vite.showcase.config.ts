import { defineConfig } from 'vite';
import { resolve } from 'path';

const showcaseBase = process.env.SHOWCASE_BASE || '/';

export default defineConfig({
  base: showcaseBase,
  root: resolve(__dirname, 'showcase'),
  build: {
    outDir: resolve(__dirname, 'showcase-dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
