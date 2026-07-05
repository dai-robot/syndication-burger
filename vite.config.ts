import { defineConfig } from 'vite';

const repoName = 'syndication-burger';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: false,
    open: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    open: true,
  },
  optimizeDeps: {
    include: ['phaser'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
});
