import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /Jolly-Icecream/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/Jolly-Icecream/' : '/',
  server: { port: 5173 }
}));
