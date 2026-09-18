import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {
  searchCatalog,
  fetchImage,
  JP_CATEGORIES,
  JP_SUBCATEGORY_CODES,
  JP_YEAR_RANGES,
  JP_SORTS,
} from './scripts/jp-catalog.mjs'

// En dev, /api/jp-search y /api/jp-image corren acá; en producción Netlify
// los redirige a las functions jp-search y jp-image (ver netlify.toml).
const jpCatalogDevApi = {
  name: 'jp-catalog-dev-api',
  configureServer(server) {
    server.middlewares.use('/api/jp-image', async (req, res) => {
      try {
        const u = new URL(req.url, 'http://localhost').searchParams.get('u') || ''
        const img = await fetchImage(u)
        if (!img) {
          res.statusCode = 404
          return res.end('Not found')
        }
        res.setHeader('Content-Type', img.contentType)
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable')
        res.end(img.body)
      } catch (err) {
        console.error('[jp-image]', err.message)
        res.statusCode = 502
        res.end('Error')
      }
    })
    server.middlewares.use('/api/jp-search', async (req, res) => {
      try {
        const params = new URL(req.url, 'http://localhost').searchParams
        const q = (params.get('q') || '').trim().slice(0, 80)
        const category = params.get('category') || 'books'
        const sub = params.get('sub') || ''
        const year = params.get('year') || ''
        const sort = params.get('sort') || ''
        const page = Math.min(Math.max(parseInt(params.get('page')) || 1, 1), 50)
        const valid =
          (category === 'all' || JP_CATEGORIES[category]) &&
          (!sub || JP_SUBCATEGORY_CODES.has(sub)) &&
          (!year || JP_YEAR_RANGES.includes(year)) &&
          (!sort || JP_SORTS.includes(sort))
        const data = valid
          ? await searchCatalog(q, { category, sub, year, sort, page })
          : { items: [], totalCount: 0, totalApprox: false, page: 1, hasMore: false }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
      } catch (err) {
        console.error('[jp-search]', err.message)
        res.statusCode = 502
        res.end(JSON.stringify({ items: [], total: null, error: 'catalog_unavailable' }))
      }
    })
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), jpCatalogDevApi],
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
