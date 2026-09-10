import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/background/index.ts', import.meta.url)),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'background.js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
