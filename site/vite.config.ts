import { defineConfig } from 'vitest/config';

// Pages serves this repo at http://s3r1.co/rf-curriculum/ (user Pages site with a
// custom domain), so every asset URL must be prefixed with the repo name.
export default defineConfig({
  base: '/rf-curriculum/',
  build: {
    outDir: 'dist',
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
