import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — чтобы сборку можно было выложить на GitHub Pages / любой статический хостинг
export default defineConfig({
  plugins: [react()],
  base: './',
});
