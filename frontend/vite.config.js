import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Proxy API va anh sang backend: trinh duyet chi can goi cung origin voi Vite,
// nen khong vuong CORS va chay duoc ca tren Codespaces (chi can forward port 5173).
const backend = 'http://localhost:3000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.app.github.dev'],
    proxy: {
      '/api': backend,
      '/uploads': backend,
      '/samples': backend,
    },
  },
})
