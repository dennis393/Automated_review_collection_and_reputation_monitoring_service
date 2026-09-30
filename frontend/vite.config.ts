import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // Разрешаем открывать dev-сервер через ngrok-туннель (нужно Telegram Mini App для HTTPS)
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app', '.ngrok.io'],
    // Один HTTPS-туннель на весь Mini App: запросы к /api/* уходят на backend
    // локально, а снаружи (для Telegram) всё выглядит как один и тот же адрес —
    // так не упираемся в лимит ngrok "1 туннель на бесплатном плане" и не ловим CORS
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
