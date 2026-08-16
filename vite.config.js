import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages 처럼 하위 경로(/salary-eval/)에 올려도 에셋이 깨지지 않도록 상대 경로로 뽑는다
  base: './',
  plugins: [react(), tailwindcss()],
  server: { port: 5180 },
})
