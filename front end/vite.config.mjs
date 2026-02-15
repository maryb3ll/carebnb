import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  build: {
    outDir: "../public/spa",
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
  plugins: [tsconfigPaths(), react()],
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
    proxy: {
      // When Next.js backend runs on 3001, provider/match and other API routes work
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  }
});