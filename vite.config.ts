import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite'
import path from 'path';

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      cache: true,
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
