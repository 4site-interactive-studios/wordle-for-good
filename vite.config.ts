import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "src/main.ts",
      name: "WordleForGood",
      fileName: "wordle-for-good",
      formats: ["es", "cjs"],
    },
    target: "esnext",
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("wordle-for-good"),
        },
      },
    }),
  ],
  define: {
    "process.env": {},
  },
});
