import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const port = process.env.PORT || 8100;
const backendTarget = process.env.BACKEND_URL || process.env.VITE_API_URL || 'http://localhost:5004';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8100,
    host: true,
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
      },
    },
  }
});
