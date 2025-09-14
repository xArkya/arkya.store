import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    },
  }
  
  // Solo usar base URL en producción (build), no en desarrollo
  if (command !== 'serve') {
    config.base = '/arkya.store/'
  }
  
  return config
})
