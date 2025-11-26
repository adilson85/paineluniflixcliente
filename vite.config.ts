import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3050,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Garante que o Vite carregue as variáveis de ambiente
  envPrefix: 'VITE_',
});
