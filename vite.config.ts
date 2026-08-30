import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Pages is configured to publish the /docs folder, so docs/ IS the site root:
// the app lives at https://jonathanbae.github.io/ and assets at /assets/.
// (Publishing from /docs is not the same as serving the app under /docs/.)
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: { outDir: 'docs', emptyOutDir: true },
});
