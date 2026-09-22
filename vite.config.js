import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use base '/sudoku-lens/' for GitHub Pages in production, '/' for local dev
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/sudoku-lens/' : '/',
  server: {
    port: 3000,
    open: false
  }
}));
