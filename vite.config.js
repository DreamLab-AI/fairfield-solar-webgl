import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  preview: {
    // The browser GPU sidecar reaches this container by its Compose service name.
    allowedHosts: ['agentbox', 'localhost'],
  },
  build: {
    // Three.js is intentionally the principal application chunk.
    chunkSizeWarningLimit: 650,
  },
});
