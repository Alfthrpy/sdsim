import { defineConfig } from "vite";

export default defineConfig({
  root: import.meta.dirname,
  server: { port: 4173, strictPort: true },
});
