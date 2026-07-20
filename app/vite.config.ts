import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The heaviest libraries live in their own long-term-cacheable chunks so a
    // change to app code does not invalidate them, and they download in
    // parallel instead of bloating the main bundle.
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          markdown: [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'rehype-katex',
            'katex',
          ],
          mermaid: ['mermaid'],
          highlighter: ['react-syntax-highlighter'],
          charts: ['recharts'],
        },
      },
    },
  },
});
