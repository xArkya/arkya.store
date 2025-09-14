import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import AdminPage from './pages/AdminPage'
import ContactPage from './pages/ContactPage'
import TermsPage from './pages/TermsPage'
import FAQPage from './pages/FAQPage'
import Header from './components/Header'
import Footer from './components/Footer'

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
      <Box flex="1" width="100%">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/preguntas-frecuentes" element={<FAQPage />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  )
}

export default App
