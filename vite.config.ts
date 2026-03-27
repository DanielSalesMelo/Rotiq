import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  base: '',
  plugins: [react(), tsconfigPaths()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, 'server/shared'),
    },
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
