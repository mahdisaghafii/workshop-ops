import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative asset paths so the built demo also runs from a subdirectory
  // (e.g. a client subdomain or /demo/ on an existing site).
  base: './',
  plugins: [react(), tailwindcss()],
})
