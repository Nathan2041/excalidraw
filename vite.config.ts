import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  base: "/excalidraw/",
  build: {
    outDir: "dist"
  },
  plugins: [react()],
  optimizeDeps: {
    include: ["@excalidraw/excalidraw"],
  },
})
