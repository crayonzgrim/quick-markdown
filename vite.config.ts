import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // Chrome 웹 스토어 리뷰를 위해 압축 비활성화
    rollupOptions: {
      input: {
        panel: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: 'src/[name].js',
        chunkFileNames: 'src/[name].js',
        assetFileNames: 'src/[name].[ext]',
        manualChunks: undefined // 청크 분할 비활성화
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false // 소스맵 비활성화
  }
});
