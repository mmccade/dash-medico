import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  optimizeDeps: {
    include: ["html2pdf.js"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "html2pdf": ["html2pdf.js"],
        },
      },
    },
  },
});
