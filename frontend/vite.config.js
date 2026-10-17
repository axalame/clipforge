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
    },
});
