import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/content/index.ts', import.meta.url)),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'content.js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
