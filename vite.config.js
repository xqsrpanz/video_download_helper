import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  copyPublicDir: true,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { background: 'src/index.js' },
      output: { entryFileNames: 'background/index.js' },
    },
  },
});
