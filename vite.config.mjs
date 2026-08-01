import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL FOR ELECTRON PRODUCTION BUILD: Ensures asset URLs use relative paths (./assets/...) instead of root domain paths (/assets/...)
})
