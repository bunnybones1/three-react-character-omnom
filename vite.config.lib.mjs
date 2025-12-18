import path from "node:path";
import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["three"],
  },
  build: {
    lib: {
      entry: path.resolve(process.cwd(), "src/index.ts"),
      formats: ["es", "cjs"],
      fileName: (format) => (format === "es" ? "index.mjs" : "index.cjs"),
    },
    outDir: "dist-lib",
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      external: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
    },
  },
});
