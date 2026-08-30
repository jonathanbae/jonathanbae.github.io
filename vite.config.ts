import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this repo at jonathanbae.github.io, and the built app
// lives under /docs/ — matching how the site was already deployed.
export default defineConfig({
  base: '/docs/',
  plugins: [react()],
  build: { outDir: 'docs', emptyOutDir: true },
});
