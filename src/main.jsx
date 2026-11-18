import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider, extendTheme, ColorModeScript } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { CartProvider } from './context/CartProvider'
import { AgeVerificationProvider } from './context/AgeVerificationContext'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.log('SW registration failed:', err));
  });
}

// Extend the theme to include custom colors, fonts, etc
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  semanticTokens: {
    colors: {
      // Superficies
      'arkya.canvas':   { default: '#fecee0', _dark: '#453641' }, // fondo de página
      'arkya.surface':  { default: '#453641', _dark: '#241521' }, // header/footer/drawers (siempre oscuro)
      'arkya.card':     { default: '#453641', _dark: '#241521' }, // cards → oscuras en ambos modos
      'arkya.cardAlt':  { default: '#52424d', _dark: '#2a1c29' },
      'arkya.modal':    { default: '#453641', _dark: '#2d1e2a' },
      'arkya.cardDeep': { default: '#342730', _dark: '#1a1017' },
      'arkya.elevated': { default: '#5e4c55', _dark: '#342730' },
      'arkya.deep':     { default: '#241521', _dark: '#3a2235' },
      'arkya.surfaceDeep': { default: '#342730', _dark: '#1a1017' }, // chrome oscuro profundo
      'arkya.surfaceEdge': { default: '#5e4c55', _dark: '#342730' }, // borde de chrome oscuro
      // Textos
      'arkya.text':     { default: '#453641', _dark: 'white' },
      'arkya.textSoft': { default: '#6f5560', _dark: 'whiteAlpha.700' },
      'arkya.textMute': { default: '#96798a', _dark: 'whiteAlpha.500' },
      'arkya.accent':   { default: '#2a8c7c', _dark: '#63d3c2' }, // teal legible en claro
      // Espejo de whiteAlpha.* en ciruela (para texto/bordes sobre fondo claro)
      'alpha.50':  { default: 'rgba(69, 54, 65, 0.04)', _dark: 'whiteAlpha.50' },
      'alpha.100': { default: 'rgba(69, 54, 65, 0.06)', _dark: 'whiteAlpha.100' },
      'alpha.150': { default: 'rgba(69, 54, 65, 0.08)', _dark: 'whiteAlpha.150' },
      'alpha.200': { default: 'rgba(69, 54, 65, 0.10)', _dark: 'whiteAlpha.200' },
      'alpha.300': { default: 'rgba(69, 54, 65, 0.18)', _dark: 'whiteAlpha.300' },
      'alpha.400': { default: 'rgba(69, 54, 65, 0.28)', _dark: 'whiteAlpha.400' },
      'alpha.500': { default: 'rgba(69, 54, 65, 0.40)', _dark: 'whiteAlpha.500' },
      'alpha.600': { default: 'rgba(69, 54, 65, 0.54)', _dark: 'whiteAlpha.600' },
      'alpha.700': { default: 'rgba(69, 54, 65, 0.68)', _dark: 'whiteAlpha.700' },
      'alpha.800': { default: 'rgba(69, 54, 65, 0.82)', _dark: 'whiteAlpha.800' },
      'alpha.900': { default: 'rgba(69, 54, 65, 0.92)', _dark: 'whiteAlpha.900' },
    },
  },
  styles: {
    global: (props) => ({
      body: {
        backgroundColor: props.colorMode === 'dark' ? '#453641' : '#fecee0',
        color: props.colorMode === 'dark' ? 'rgba(255, 255, 255, 0.87)' : '#453641',
      },
    }),
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
      700: '#fecee0',
      800: '#342730',
      900: '#453641', // Main brand color as requested
    },
    // Verde-menta del nuevo logo/mascota de Arkya
    teal: {
      50: '#e6faf6',
      100: '#c0f0e8',
      200: '#94e4d7',
      300: '#63d3c2',
      400: '#41bfa9',
      500: '#34a892',
      600: '#2a8c7c',
      700: '#247165',
      800: '#1d584f',
      900: '#163f3a',
    },
  },
  fonts: {
    heading: "'Poppins', sans-serif",
    body: "'Poppins', sans-serif",
  },
  components: {
    Button: {
      variants: {
        solid: (props) => ({
          bg: props.colorMode === 'dark' ? '#241521' : '#453641',
          color: 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? '#342730' : '#5e4c55',
          },
        }),
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <ChakraProvider theme={theme}>
      <BrowserRouter>
        <CartProvider>
          <AgeVerificationProvider>
            <App />
          </AgeVerificationProvider>
        </CartProvider>
      </BrowserRouter>
    </ChakraProvider>
  </React.StrictMode>,
)
