import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const repoBase = process.env.VITE_BASE_PATH?.trim()
const base = repoBase && repoBase !== '' ? repoBase : '/'

export default defineConfig({
  base,
  plugins: [
    tailwindcss(),
  ],
})