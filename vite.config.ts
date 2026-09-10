import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  root: command === 'build' ? fileURLToPath(new URL('./src', import.meta.url)) : undefined,
  publicDir: command === 'build' ? fileURLToPath(new URL('./public', import.meta.url)) : undefined,
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        popup: fileURLToPath(new URL('./src/popup.html', import.meta.url)),
        options: fileURLToPath(new URL('./src/options.html', import.meta.url))
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: false
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['tests/**', 'e2e/**']
  }
}));
