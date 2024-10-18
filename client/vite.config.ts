import { defineConfig } from "vite";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3069",
        changeOrigin: true,
      },
      "^/*": {
        target: "http://localhost:3069",
        changeOrigin: true,
      },
    },
    host: true,
    strictPort: true,
  },
});
