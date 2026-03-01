import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'renderer',
  plugins: [react()],
  build: {
    outDir: '../renderer/dist',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('pdfjs-dist')) return 'pdfjs-vendor';
            if (id.includes('react')) return 'react-vendor';
            return 'vendor';
          }
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
