import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  copyPublicDir: true,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: 'src/index.js',
        ffmpeg: 'src/offscreen/ffmpeg.js',
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'background'
            ? 'background/index.js'
            : 'offscreen/[name].js',
      },
    },
  },
});
