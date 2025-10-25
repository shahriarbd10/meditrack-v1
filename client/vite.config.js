import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(), // Tailwind (incl. DaisyUI) via Vite plugin
    react(),       // React fast refresh, JSX transform
  ],
  // Optional: nicer local dev experience
  server: {
    port: 5173,
    open: true,
  },
  // Optional: smaller builds
  build: {
    sourcemap: false,
    target: "es2020",
  },
});
