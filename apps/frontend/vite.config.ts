import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/mini-crm/',
  server: {
    port: 3000,
    proxy: {
      '/mini-crm/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mini-crm\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});