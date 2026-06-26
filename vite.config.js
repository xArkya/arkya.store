import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'redirect-base',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && !req.url.startsWith('/src') && !req.url.startsWith('/@') && req.url !== '/' && !req.url.includes('.')) {
            const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
            res.writeHead(301, { Location: req.url + '/' + query })
            res.end()
            return
          }
          next()
        })
      }
    }
  ],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  publicDir: 'public'
})
