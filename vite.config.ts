import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    testTimeout: 30000
  },
  build: {
    minify: process.env.THEK_MINIFY === '1' ? 'terser' : false,
    cssMinify: process.env.THEK_MINIFY === '1' ? 'esbuild' : false,
    terserOptions:
      process.env.THEK_MINIFY === '1'
        ? {
            compress: { passes: 2 },
            format: { comments: false }
          }
        : undefined,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ThekDatePicker',
      fileName: (format) => {
        const isMin = process.env.THEK_MINIFY === '1';
        if (format === 'es') {
          return isMin ? 'thekdatepicker.min.js' : 'thekdatepicker.js';
        }
        return isMin ? 'thekdatepicker.umd.min.cjs' : 'thekdatepicker.umd.cjs';
      },
      formats: ['es', 'umd']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          return '[name][extname]';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
