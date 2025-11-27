import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  publicDir: 'public',
  copyPublicDir: true,
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: 'src/index.js',
        ffmpeg: 'src/offscreen/ffmpeg.js',
        popup: 'popup/index.html',
        options: 'options/index.html',
      },
      output: {
        entryFileNames: (chunkInfo) =>
          chunkInfo.name === 'background'
            ? 'background/index.js'
            : chunkInfo.name === 'ffmpeg'
              ? 'offscreen/[name].js'
              : 'assets/[name].[hash].js',
      },
    },
  },
});
