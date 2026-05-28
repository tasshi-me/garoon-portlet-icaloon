import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "Icaroon",
      formats: ["iife"],
      fileName: () => "icaroon.iife.js",
    },
    rollupOptions: {
      output: {
        assetFileNames: "icaroon.css",
        inlineDynamicImports: true,
      },
    },
    minify: "esbuild",
    sourcemap: false,
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
