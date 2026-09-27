import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // '/' locally; the GitHub Pages workflow sets VITE_BASE=/<repo-name>/
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
})
