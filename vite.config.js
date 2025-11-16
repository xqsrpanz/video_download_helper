import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';

export default defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: 'src/index.js',
      },
      output: {
        entryFileNames: 'background/index.js',
      },
      plugins: [
        copy({
          hook: 'writeBundle',
          targets: [
            { src: 'manifest.json', dest: 'dist' },
            { src: 'assets', dest: 'dist' },
            { src: 'content_scripts', dest: 'dist' },
            { src: 'popup', dest: 'dist' },
            { src: 'options', dest: 'dist' },
          ],
        }),
      ],
    },
  },
});
