import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartProvider'

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f8f6f7',
      100: '#e9e5e7',
      200: '#d4ccd0',
      300: '#b9adb3',
      400: '#9c8a93',
      500: '#7d6a74',
      600: '#5e4c55',
      700: '#453641',
      800: '#342730',
      900: '#241521', // Main brand color as requested
    },
  },
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Poppins', sans-serif",
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: '#241521',
          color: 'white',
          _hover: {
            bg: '#342730',
          },
        },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <HashRouter>
        <CartProvider>
          <App />
        </CartProvider>
      </HashRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
