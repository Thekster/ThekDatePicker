import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "ThekDatePickerVue",
      fileName: (format) => {
        return format === "es" ? "thekdatepicker-vue.js" : "thekdatepicker-vue.umd.cjs";
      },
      formats: ["es", "umd"],
    },
    rollupOptions: {
      external: ["vue", "thekdatepicker"],
      output: {
        globals: {
          vue: "Vue",
          thekdatepicker: "ThekDatePicker",
        },
      },
    },
  },
  resolve: {
    alias: {
      thekdatepicker: resolve(__dirname, "../ThekDatePicker/src/index.ts"),
    },
  },
  test: {
    environment: "jsdom",
  },
});
