import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Box } from '@chakra-ui/react'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import FAQPage from './pages/FAQPage'
import Header from './components/Header'
import Footer from './components/Footer'
import FloatingCartButton from './components/Cart/FloatingCartButton'

// Importar AdminPage solo en desarrollo (lazy loading)
const AdminPage = import.meta.env.VITE_ENABLE_ADMIN === 'true' 
  ? lazy(() => import('./pages/AdminPage'))
  : null

function App() {
  return (
    <Box 
      minH="100vh" 
      display="flex" 
      flexDirection="column" 
      bg="#241521" 
      width="100%" 
      margin="0" 
      padding="0"
      overflowX="hidden"
    >
      <Header />
      <Box width="100%">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          {import.meta.env.VITE_ENABLE_ADMIN === 'true' && AdminPage && (
            <Route path="/admin" element={
              <Suspense fallback={<Box>Cargando...</Box>}>
                <AdminPage />
              </Suspense>
            } />
          )}
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/preguntas-frecuentes" element={<FAQPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
      
      {/* Botón flotante del carrito siempre visible */}
      <FloatingCartButton />
    </Box>
  )
}

export default App
