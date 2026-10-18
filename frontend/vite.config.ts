import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  base: "./",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    target: "esnext",
    outDir: "dist",
    assetsDir: "assets",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("naive-ui") ||
              id.includes("vooks") ||
              id.includes("seemly") ||
              id.includes("treemate") ||
              id.includes("vdirs") ||
              id.includes("vueuc")
            ) {
              return "naive-ui";
            }
            if (id.includes("vue-i18n")) {
              return "vue-i18n";
            }
            if (id.includes("pinia")) {
              return "pinia";
            }
            if (id.includes("vue") || id.includes("@vue")) {
              return "vue";
            }
          }
        },
      },
    },
  },
});
