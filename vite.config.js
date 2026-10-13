import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Catálogo de productos en chunk separado: cambia con cada
          // actualización de productos, así conviene cachearlo aparte
          // del código de la app. No tocar node_modules: separar React
          // de las libs que lo usan rompe el orden de evaluación de los
          // chunks (TypeError: useLayoutEffect of undefined).
          if (id.includes('src/data/products.js')) return 'products-data';
        }
      }
    }
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  publicDir: 'public'
})
