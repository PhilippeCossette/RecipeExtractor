import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  server: { port: 3001 }, // the recipe API runs on 3000
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) }, // "@/components/ui/button" (shadcn)
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    viteReact(), // react's vite plugin must come after start's vite plugin
  ],
});
