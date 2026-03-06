import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replace "budget-homes-site" with your actual repo name
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { port: 5173 },
  build: { outDir: 'dist' }
});
