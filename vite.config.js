import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Firebase Hosting serves from the root domain '/'
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3000,
    open: false
  }
});
