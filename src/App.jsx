import { Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { useAnalytics } from './hooks/useAnalytics'
import HomePage from './pages/HomePage'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingCartButton from './components/Cart/FloatingCartButton'
import CatalogPromoPopup from './components/CatalogPromoPopup'

// Code splitting: las rutas que no son el home se cargan bajo demanda.
// El prerender solo inyecta meta tags en el HTML estático, así que esto
// no afecta el SEO.
const ProductPage = lazy(() => import('./pages/ProductPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const FAQPage = lazy(() => import('./pages/FAQPage'))
const MisLikesPage = lazy(() => import('./pages/MisLikesPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const AnimeGamePage = lazy(() => import('./pages/AnimeGamePage'))
const GuidesPage = lazy(() => import('./pages/GuidesPage'))
const ReturnsPolicyPage = lazy(() => import('./pages/ReturnsPolicyPage'))
const TransparencyPolicyPage = lazy(() => import('./pages/TransparencyPolicyPage'))
const ImportCatalogPage = lazy(() => import('./pages/ImportCatalogPage'))

// Importar AdminPage solo en desarrollo (lazy loading)
const AdminPage = import.meta.env.VITE_ENABLE_ADMIN === 'true' 
  ? lazy(() => import('./pages/AdminPage'))
  : null

const PageFallback = (
  <Center py={20}>
    <Spinner size="xl" color="pink.300" thickness="4px" />
  </Center>
)

function App() {
  useAnalytics()
  return (
    <Box 
      minH="100vh" 
      display="flex" 
      flexDirection="column" 
      bg="#453641" 
      width="100%" 
      margin="0" 
      padding="0"
      overflowX="hidden"
    >
      <Header />
      <Box width="100%" flex="1">
        <Suspense fallback={PageFallback}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tienda" element={<HomePage storeOnly />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            {import.meta.env.VITE_ENABLE_ADMIN === 'true' && AdminPage && (
              <Route path="/admin" element={<AdminPage />} />
            )}
            <Route path="/contacto" element={<ContactPage />} />
            <Route path="/terminos" element={<TermsPage />} />
            <Route path="/preguntas-frecuentes" element={<FAQPage />} />
            <Route path="/mis-me-gustas" element={<MisLikesPage />} />
            <Route path="/adivina-el-anime" element={<AnimeGamePage />} />
            <Route path="/guias" element={<GuidesPage />} />
            <Route path="/catalogo" element={<ImportCatalogPage />} />
            <Route path="/devoluciones" element={<ReturnsPolicyPage />} />
            <Route path="/politica-informacion" element={<TransparencyPolicyPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Box>
      <Footer />
      
      {/* Botón flotante del carrito siempre visible */}
      <FloatingCartButton />

      {/* Popup promocional del catálogo a pedido (una vez por visitante) */}
      <CatalogPromoPopup />
    </Box>
  )
}

export default App
