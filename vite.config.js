import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // Listen on all local IP addresses for easy mobile testing
    port: 5173,
  },
});
