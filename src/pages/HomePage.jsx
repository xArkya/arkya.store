import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Stack,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  HStack,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Portal,
  ButtonGroup,
  IconButton,
  Switch,
  Tooltip,
  Badge,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
} from '@chakra-ui/react';
import { FaSearch, FaInstagram, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaShareAlt, FaWhatsapp, FaTwitter, FaFacebook } from 'react-icons/fa';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import PromoBanner from '../components/PromoBanner';
import { products } from '../data/products';
import { categories } from '../data/categories';
import { offers } from '../data/offers';

// Nota: 'todos' es un ID especial para mostrar todos los productos

export default function HomePage() {
  const [allProducts, setAllProducts] = useState(products);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() => {
    // Intentar recuperar la categoría activa del sessionStorage al cargar
    const savedCategory = sessionStorage.getItem('activeCategory');
    return savedCategory || 'todos';
  });
  const [activeSubcategory, setActiveSubcategory] = useState(() => {
    // Intentar recuperar la subcategoría activa del sessionStorage al cargar
    return sessionStorage.getItem('activeSubcategory') || '';
  });
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(() => {
    // Intentar recuperar la página actual del sessionStorage al cargar
    // Esto hace que la página guardada solo persista durante la sesión actual
    const savedPage = sessionStorage.getItem('currentPage');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [sortOption, setSortOption] = useState('newest-added');
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  const [filterOffersOnly, setFilterOffersOnly] = useState(false);
  
  // Estado para búsqueda mejorada
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const [showAdultContent] = useState(true); // Mostrar contenido +18 por defecto (siempre true ahora)
  const [adultFilterActive, setAdultFilterActive] = useState(() => {
    // Inicializar desde sessionStorage o sincronizar con activeCategory
    const savedAdultFilter = sessionStorage.getItem('adultFilterActive');
    if (savedAdultFilter !== null) {
      return savedAdultFilter === 'true';
    }
    // Si no hay valor guardado, verificar si la categoría activa es 'adultos'
    const savedCategory = sessionStorage.getItem('activeCategory');
    return savedCategory === 'adultos';
  });
  const PRODUCTS_PER_PAGE = 12;
  
  // Restaurar posición de scroll al volver desde ProductPage
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('homeScrollPosition');
    if (savedScroll) {
      const scrollY = parseInt(savedScroll, 10);
      sessionStorage.removeItem('homeScrollPosition');
      // Esperar a que React termine de renderizar y el DOM esté listo
      const restoreScroll = () => {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
          // Verificar que realmente scrolleó (algunos navegadores lo sobreescriben)
          if (Math.abs(window.scrollY - scrollY) > 50) {
            setTimeout(() => window.scrollTo(0, scrollY), 300);
          }
        });
      };
      // Doble RAF para asegurar que todo el layout esté calculado
      requestAnimationFrame(restoreScroll);
    }
  }, []);
  
  // Cargar productos desde IndexedDB al montar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const dbRequest = indexedDB.open('ArkyaStoreDB', 1);
        
        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          const transaction = db.transaction(['products'], 'readonly');
          const store = transaction.objectStore('products');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const savedProducts = getAllRequest.result;
            if (savedProducts && savedProducts.length > 0) {
              // Combinar productos estáticos con los guardados, evitando duplicados
              const combinedProducts = [...products];
              const staticIds = new Set(products.map(p => p.id));
              
              savedProducts.forEach(savedProduct => {
                if (!staticIds.has(savedProduct.id)) {
                  combinedProducts.push(savedProduct);
                }
              });
              
              setAllProducts(combinedProducts);
            }
          };
        };
      } catch (error) {
        console.error('Error loading products from IndexedDB:', error);
      }
    };
    
    loadProducts();
  }, []);
  
  // Función para obtener el nombre de la categoría por su ID
  const getCategoryNameById = (categoryId) => {
    if (categoryId === 'todos') return 'Todos';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };
  
  // Función para obtener el nombre de la subcategoría por su ID
  const getSubcategoryNameById = (categoryId, subcategoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '';
    
    const subcategory = category.subcategories.find(subcat => subcat.id === subcategoryId);
    return subcategory ? subcategory.name : '';
  };
  
  // Sincronizar adultFilterActive con activeCategory cuando se carga la página
  useEffect(() => {
    if (activeCategory === 'adultos') {
      setAdultFilterActive(true);
      sessionStorage.setItem('adultFilterActive', 'true');
    } else {
      // Solo actualizar si no está en la categoría adultos
      const savedAdultFilter = sessionStorage.getItem('adultFilterActive');
      if (savedAdultFilter === 'true' && activeCategory !== 'adultos') {
        setAdultFilterActive(false);
        sessionStorage.setItem('adultFilterActive', 'false');
      }
    }
  }, [activeCategory]);
  
  // Leer categoría y subcategoría de URL params al cargar
  useEffect(() => {
    // Verificar si hay categoría guardada en sessionStorage
    const savedCategory = sessionStorage.getItem('activeCategory');
    const savedSubcategory = sessionStorage.getItem('activeSubcategory');
    
    // Obtener categoría y subcategoría de la URL
    const categoryFromUrl = searchParams.get('category');
    const subcategoryFromUrl = searchParams.get('subcategory');
    
    // Priorizar la categoría guardada en sessionStorage
    if (savedCategory) {
      const categoryExists = categories.some(cat => cat.id === savedCategory) || savedCategory === 'adultos';
      if (categoryExists) {
        setActiveCategory(savedCategory);
        
        if (savedSubcategory) {
          const category = categories.find(cat => cat.id === savedCategory);
          if (category && category.subcategories) {
            const subcategoryExists = category.subcategories.some(subcat => subcat.id === savedSubcategory);
            if (subcategoryExists) {
              setActiveSubcategory(savedSubcategory);
              return; // Salir del useEffect si se encontró categoría y subcategoría válidas
            }
          }
        }
        return; // Salir del useEffect si se encontró categoría válida
      }
    }
    
    // Si no hay categoría guardada en sessionStorage o no es válida, usar la de la URL
    if (categoryFromUrl) {
      const categoryExists = categories.some(cat => cat.id === categoryFromUrl);
      if (categoryExists) {
        setActiveCategory(categoryFromUrl);
        sessionStorage.setItem('activeCategory', categoryFromUrl);
        
        if (subcategoryFromUrl) {
          const category = categories.find(cat => cat.id === categoryFromUrl);
          const subcategoryExists = category.subcategories.some(subcat => subcat.id === subcategoryFromUrl);
          
          if (subcategoryExists) {
            setActiveSubcategory(subcategoryFromUrl);
            sessionStorage.setItem('activeSubcategory', subcategoryFromUrl);
          } else {
            setActiveSubcategory('');
            sessionStorage.setItem('activeSubcategory', '');
          }
        } else {
          setActiveSubcategory('');
          sessionStorage.setItem('activeSubcategory', '');
        }
      } else {
        setActiveCategory('todos');
        setActiveSubcategory('');
        sessionStorage.setItem('activeCategory', 'todos');
        sessionStorage.setItem('activeSubcategory', '');
      }
    } else {
      // Si no hay parámetro de categoría ni categoría guardada, mostrar todos
      setActiveCategory('todos');
      setActiveSubcategory('');
      sessionStorage.setItem('activeCategory', 'todos');
      sessionStorage.setItem('activeSubcategory', '');
    }
  }, [searchParams]); // categories es una constante importada, no necesita estar en las dependencias

  // Aplicar ofertas globales a los productos
  const productsWithOffers = useMemo(() => {
    return allProducts.map(product => {
      // Si el producto no tiene stock, no aplicar ofertas
      if (product.inStock === false) {
        return {
          ...product,
          isOnOffer: false // Asegurarse de que no tenga oferta
        };
      }
      
      // Si ya tiene oferta y tiene stock, mantenerla
      if (product.isOnOffer) return product;
      
      // Buscar si hay una oferta global para todas las categorías
      const globalOffer = offers.find(offer => offer.isGlobal && offer.isActive);
      
      if (globalOffer) {
        return {
          ...product,
          isOnOffer: true,
          discountPercentage: globalOffer.discountPercentage,
          originalPrice: product.price,
          price: Math.round(product.price * (1 - globalOffer.discountPercentage / 100))
        };
      }
      
      // Buscar si hay una oferta específica para alguna de las categorías del producto
      let categoryOffer = null;
      
      // Si el producto tiene múltiples categorías
      if (product.categories && product.categories.length > 0) {
        // Buscar ofertas para cualquiera de las categorías del producto
        for (const cat of product.categories) {
          const offer = offers.find(o => 
            !o.isGlobal && 
            o.isActive && 
            o.applicableCategories && 
            o.applicableCategories.includes(cat)
          );
          
          if (offer) {
            categoryOffer = offer;
            break; // Usar la primera oferta encontrada
          }
        }
      } else {
        // Compatibilidad con productos que solo tienen una categoría
        categoryOffer = offers.find(offer => 
          !offer.isGlobal && 
          offer.isActive && 
          offer.applicableCategories && 
          offer.applicableCategories.includes(product.category)
        );
      }
      
      if (categoryOffer) {
        return {
          ...product,
          isOnOffer: true,
          discountPercentage: categoryOffer.discountPercentage,
          originalPrice: product.price,
          price: Math.round(product.price * (1 - categoryOffer.discountPercentage / 100))
        };
      }
      
      return product;
    });
  }, [allProducts]);
  
  // Estado para el filtro de rango de precios
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [tempPriceRange, setTempPriceRange] = useState([0, 100000]);
  
  // Calcular precios mínimo y máximo de todos los productos
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = productsWithOffers.map(p => p.price);
    return {
      minPrice: Math.floor(Math.min(...prices) / 1000) * 1000,
      maxPrice: Math.ceil(Math.max(...prices) / 1000) * 1000
    };
  }, [productsWithOffers]);
  
  // Inicializar el rango de precios con los valores reales
  useEffect(() => {
    setPriceRange([minPrice, maxPrice]);
    setTempPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);
  
  // Generar sugerencias de búsqueda
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const searchLower = searchTerm.toLowerCase();
      
      // Buscar en nombres de productos
      const suggestions = productsWithOffers
        .filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
          (product.id && product.id.toString().includes(searchTerm))
        )
        .slice(0, 8) // Limitar a 8 sugerencias
        .map(product => ({
          type: 'product',
          text: product.name,
          id: product.id,
          price: product.price,
          image: product.image
        }));
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm, productsWithOffers]);
  
  // Función para agregar al historial
  const addToSearchHistory = (term) => {
    if (!term.trim()) return;
    
    const newHistory = [term, ...searchHistory.filter(h => h !== term)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };
  
  // Función para limpiar historial
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  
  // Filtrar productos según la búsqueda, categoría, subcategoría y contenido adulto
  const filteredProducts = useMemo(() => {
    return productsWithOffers.filter(product => {
      // Buscar en nombre, descripción y etiquetas
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        product.name.toLowerCase().includes(searchTermLower) || 
        product.description.toLowerCase().includes(searchTermLower) ||
        // Buscar en etiquetas si existen
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTermLower)));
      
      // Verificar si coincide con la categoría
      let matchesCategory = false;
      if (activeCategory === 'todos') {
        matchesCategory = true;
      } else if (activeCategory === 'adultos') {
        // Categoría especial para contenido adulto
        matchesCategory = product.adultContent === true;
      } else if (activeCategory === 'fuera-de-stock') {
        // Categoría especial para productos sin stock
        matchesCategory = product.inStock === false;
      } else {
        const categoryName = getCategoryNameById(activeCategory);
        // Comprobar si coincide con alguna de las categorías del producto
        if (product.categories && product.categories.length > 0) {
          matchesCategory = product.categories.includes(categoryName);
        } else {
          // Compatibilidad con productos que solo tienen una categoría
          matchesCategory = product.category === categoryName;
        }
      }
      
      // Verificar si coincide con la subcategoría (si hay una seleccionada)
      let matchesSubcategory = true;
      if (activeSubcategory && product.subcategory) {
        const subcategoryName = getSubcategoryNameById(activeCategory, activeSubcategory);
        matchesSubcategory = product.subcategory === subcategoryName;
      } else if (activeSubcategory) {
        matchesSubcategory = false;
      }
      
      // Filtrar por contenido adulto
      let matchesAdultFilter = true;
      if (adultFilterActive) {
        matchesAdultFilter = product.adultContent === true;
      } else if (!showAdultContent) {
        matchesAdultFilter = product.adultContent !== true;
      }
      
      // Filtrar por rango de precios
      const matchesPriceRange = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      // Filtrar por productos nuevos
      const matchesNewFilter = !filterNewOnly || product.isNew === true;
      const matchesOffersFilter = !filterOffersOnly || product.isOnOffer === true;
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesAdultFilter && matchesPriceRange && matchesNewFilter && matchesOffersFilter;
    });
  }, [productsWithOffers, searchTerm, activeCategory, activeSubcategory, showAdultContent, adultFilterActive, priceRange, filterNewOnly, filterOffersOnly]);
  
  // Ordenar productos según la opción seleccionada
  const sortedProducts = useMemo(() => {
    let result = [...filteredProducts];
    
    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew === a.isNew) ? 0 : b.isNew ? 1 : -1);
        break;
      case 'newest-added':
        // Ordenar por ID descendente (asumiendo que IDs mayores son productos más recientes)
        result.sort((a, b) => b.id - a.id);
        break;
      case 'offers':
        // Ordenar por porcentaje de descuento (de mayor a menor)
        result.sort((a, b) => {
          // Si ambos tienen oferta, comparar por porcentaje de descuento
          if (a.isOnOffer && b.isOnOffer) {
            return b.discountPercentage - a.discountPercentage;
          }
          // Si solo uno tiene oferta, ese va primero
          return (b.isOnOffer === a.isOnOffer) ? 0 : b.isOnOffer ? 1 : -1;
        });
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        // Por defecto, ordenar por ID descendente (productos más recientes primero)
        result.sort((a, b) => b.id - a.id);
        break;
    }
    
    // Siempre mover los productos sin stock al final, independientemente de la ordenación elegida
    result.sort((a, b) => {
      if (a.inStock === false && b.inStock !== false) return 1;
      if (a.inStock !== false && b.inStock === false) return -1;
      return 0;
    });
    
    return result;
  }, [filteredProducts, sortOption]);
  
  // Función para manejar el clic en una categoría
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveSubcategory('');
    
    // Desactivar el filtro de adultos si se selecciona una categoría que no sea 'adultos'
    if (categoryId !== 'adultos') {
      setAdultFilterActive(false);
      sessionStorage.setItem('adultFilterActive', 'false');
    } else {
      setAdultFilterActive(true);
      sessionStorage.setItem('adultFilterActive', 'true');
    }
    
    // Guardar la categoría en sessionStorage
    sessionStorage.setItem('activeCategory', categoryId);
    sessionStorage.setItem('activeSubcategory', '');
    
    // Guardar la página actual antes de cambiar
    if (searchTerm) {
      sessionStorage.setItem('lastPage', currentPage);
    }
    
    setCurrentPage(1); // Reiniciar a la primera página al cambiar de categoría
    sessionStorage.setItem('currentPage', '1'); // Actualizar en sessionStorage
    
    // Con HashRouter, no podemos usar window.history.replaceState directamente
    // En su lugar, podemos usar un enfoque diferente para actualizar la URL
    const params = new URLSearchParams();
    if (categoryId !== 'todos') {
      params.set('category', categoryId);
    }
    // No actualizamos la URL aquí para evitar problemas con HashRouter
  };
  
  // Función para manejar el clic en una subcategoría
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId);
    
    // Siempre desactivar el filtro de adultos al seleccionar una subcategoría
    setAdultFilterActive(false);
    sessionStorage.setItem('adultFilterActive', 'false');
    
    // Guardar la categoría y subcategoría en sessionStorage
    sessionStorage.setItem('activeCategory', categoryId);
    sessionStorage.setItem('activeSubcategory', subcategoryId);
    
    // Guardar la página actual antes de cambiar
    if (searchTerm) {
      sessionStorage.setItem('lastPage', currentPage);
    }
    
    setCurrentPage(1); // Reiniciar a la primera página al cambiar de subcategoría
    sessionStorage.setItem('currentPage', '1'); // Actualizar en sessionStorage
    
    // Con HashRouter, no podemos usar window.history.replaceState directamente
    // En su lugar, podemos usar un enfoque diferente para actualizar la URL
    const params = new URLSearchParams();
    params.set('category', categoryId);
    params.set('subcategory', subcategoryId);
    // No actualizamos la URL aquí para evitar problemas con HashRouter
  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(sortedProducts.length / PRODUCTS_PER_PAGE);
  
  // Obtener los productos para la página actual
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return sortedProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [sortedProducts, currentPage, PRODUCTS_PER_PAGE]);
  
  // Función para cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Guardar la página actual en sessionStorage para mantenerla al actualizar
      // pero que no persista entre sesiones
      sessionStorage.setItem('currentPage', newPage.toString());
      // Scroll al inicio de la sección de productos
      const productsSection = document.getElementById('productos');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <SEO 
        title="Arkya Store - Artbooks, Doujinshi, Mangas y Revistas Importadas de Japón"
        description="Hacé tu pedido de Artbooks, Dōjinshi (Doujinshi), Mangas, Guías oficiales, Novelas Ligeras, Revistas (Jump, etc.) y merchandising importado desde Japón. Envíos a todo el país. También traemos a pedido."
        image="https://arkya.store/images/logo2.webp"
        url="https://arkya.store/"
      />
      <Box>
      <Box 
        py={2} 
        px={4} 
        bg="pink.100" 
        color="gray.700" 
        textAlign="center"
        fontSize="md"
        position="sticky"
        top={0}
        zIndex={1000}
      >
        Si te interesa traer algo a pedido ¡Contáctanos por <a href="https://instagram.com/arkya.store" target="_blank" rel="noopener noreferrer">Instagram</a>!
      </Box>
      <Hero />
      
      {/* Banner de promoción activa */}
      {offers.find(o => o.isActive && o.isGlobal) && (
        <PromoBanner offer={{
          ...offers.find(o => o.isActive && o.isGlobal),
          title: `¡${offers.find(o => o.isActive && o.isGlobal).discountPercentage}% de descuento en toda la tienda!`,
          description: 'Aprovecha esta oferta especial por tiempo limitado',
          endDate: '2025-10-31T23:59:59'
        }} />
      )}
      
      <Box id="productos" name="productos" py={10} bg="#453641">
        <Container maxW={'7xl'}>
          <Heading as="h2" size="xl" mb={6} textAlign="center" color="white">
            Tienda
          </Heading>
          <Text fontSize="sm" color="gray.300" textAlign="center" mb={6}>
            Mostrando {currentProducts.length} de {sortedProducts.length} {sortedProducts.length === 1 ? 'resultado' : 'resultados'}
            {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
          </Text>
          
          <Flex 
            direction={{ base: 'column', md: 'column' }} 
            justify="center" 
            align="center"
            mb={8}
            gap={4}
            width="100%"
          >
           
            <Flex
              flexWrap="wrap"
              gap={2}
              p={2}
              width={{ base: '100%', md: 'auto' }}
              justifyContent="flex-start"
              overflowX={{ base: 'auto', md: 'visible' }}
              maxWidth="100%"
              css={{
                '&::-webkit-scrollbar': {
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '10px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: 'rgba(255, 255, 255, 0.3)',
                },
            }}>
              {/* Botón para mostrar todos los productos */}
              <Button
                key="todos"
                size="md"
                px={4}
                py={2}
                minW="80px"
                height="40px"
                bg={activeCategory === 'todos' ? 'pink.400' : 'white'}
                color={activeCategory === 'todos' ? 'white' : 'gray.800'}
                borderColor={activeCategory === 'todos' ? 'pink.400' : 'gray.300'}
                variant={activeCategory === 'todos' ? 'solid' : 'outline'}
                onClick={() => {
                  handleCategoryClick('todos');
                  setAdultFilterActive(false);
                }}
                _hover={{
                  bg: activeCategory === 'todos' ? 'pink.500' : 'gray.100',
                }}
                fontWeight="medium"
              >
                Todos
              </Button>
              
              {/* Botón para filtrar productos adultos */}
              <Button
                key="adultos"
                size="md"
                px={4}
                py={2}
                minW="80px"
                height="40px"
                bg={activeCategory === 'adultos' || adultFilterActive ? 'red.500' : 'white'}
                color={activeCategory === 'adultos' || adultFilterActive ? 'white' : 'gray.800'}
                borderColor={activeCategory === 'adultos' || adultFilterActive ? 'red.500' : 'gray.300'}
                variant={activeCategory === 'adultos' || adultFilterActive ? 'solid' : 'outline'}
                onClick={() => {
                  // Guardar la página actual antes de cambiar
                  if (searchTerm) {
                    sessionStorage.setItem('lastPage', currentPage);
                  }
                  
                  if (activeCategory === 'adultos') {
                    handleCategoryClick('todos');
                  } else {
                    handleCategoryClick('adultos');
                  }
                  setCurrentPage(1); // Reiniciar a la primera página al cambiar filtro de adultos
                  sessionStorage.setItem('currentPage', '1'); // Actualizar en sessionStorage
                }}
                _hover={{
                  bg: activeCategory === 'adultos' || adultFilterActive ? 'red.600' : 'gray.100',
                }}
                fontWeight="medium"
                leftIcon={<FaExclamationTriangle />}
              >
                +18
              </Button>
              
              {/* Botones para cada categoría */}
              {categories.map((category) => (
                category.subcategories.length > 0 ? (
                  <Menu key={category.id}>
                    <MenuButton
                      as={Button}
                      size="md"
                      px={4}
                      py={2}
                      minW="80px"
                      height="40px"
                      bg={activeCategory === category.id ? 'pink.400' : 'white'}
                      color={activeCategory === category.id ? 'white' : 'gray.800'}
                      borderColor={activeCategory === category.id ? 'pink.400' : 'gray.300'}
                      variant={activeCategory === category.id ? 'solid' : 'outline'}
                      _hover={{
                        bg: activeCategory === category.id ? 'pink.500' : 'gray.100',
                      }}
                      fontWeight="medium"
                    >
                      {category.name}
                    </MenuButton>
                    <Portal>
                      <MenuList zIndex={1000}>
                        <MenuItem onClick={() => handleCategoryClick(category.id)}>
                          Todos los {category.name}
                        </MenuItem>
                        {category.subcategories.map((subcategory) => (
                          <MenuItem 
                            key={subcategory.id}
                            onClick={() => handleSubcategoryClick(category.id, subcategory.id)}
                            bg={activeCategory === category.id && activeSubcategory === subcategory.id ? 'pink.100' : undefined}
                          >
                            {subcategory.name}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </Portal>
                  </Menu>
                ) : (
                  <Button
                    key={category.id}
                    size="md"
                    px={4}
                    py={2}
                    minW="80px"
                    height="40px"
                    bg={activeCategory === category.id ? 'pink.400' : 'white'}
                    color={activeCategory === category.id ? 'white' : 'gray.800'}
                    borderColor={activeCategory === category.id ? 'pink.400' : 'gray.300'}
                    variant={activeCategory === category.id ? 'solid' : 'outline'}
                    onClick={() => handleCategoryClick(category.id)}
                    _hover={{
                      bg: activeCategory === category.id ? 'pink.500' : 'gray.100',
                    }}
                    fontWeight="medium"
                  >
                    {category.name}
                  </Button>
                )
              ))}
              </Flex>
            
            <Flex 
              width="100%" 
              justify="space-between" 
              align="center" 
              mb={4}
              direction={{ base: 'column', md: 'row' }}
              gap={{ base: 3, md: 0 }}
              position="sticky"
              top={0}
              zIndex={10}
              py={4}
              px={{ base: 4, md: 0 }}
              mx={{ base: -4, md: 0 }}
            >
              <Flex align="center" width={{ base: '100%', md: 'auto' }} justify={{ base: 'space-between', md: 'flex-start' }} gap={4}>
                {/* Buscador mejorado con autocompletado */}
                <Box position="relative" maxW={{ base: '100%', md: '300px' }} mb={{ base: 2, md: 0 }} width="100%">
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <FaSearch color="white" />
                    </InputLeftElement>
                    <Input 
                      placeholder="Buscar productos..." 
                      value={searchTerm}
                      onFocus={() => {
                        setIsSearchFocused(true);
                        if (searchTerm.length === 0 && searchHistory.length > 0) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir clicks en sugerencias
                        setTimeout(() => {
                          setIsSearchFocused(false);
                          setShowSuggestions(false);
                          setSelectedSuggestionIndex(-1);
                        }, 200);
                      }}
                      onChange={(e) => {
                        const newSearchTerm = e.target.value;
                        setSearchTerm(newSearchTerm);
                        setSelectedSuggestionIndex(-1);
                        
                        if (newSearchTerm && !searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                          setCurrentPage(1);
                        } else if (!newSearchTerm && searchTerm) {
                          const lastPage = sessionStorage.getItem('lastPage');
                          if (lastPage) {
                            setCurrentPage(parseInt(lastPage));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
                            const suggestion = searchSuggestions[selectedSuggestionIndex];
                            setSearchTerm(suggestion.text);
                            addToSearchHistory(suggestion.text);
                            setShowSuggestions(false);
                          } else if (searchTerm) {
                            addToSearchHistory(searchTerm);
                            setShowSuggestions(false);
                          }
                        } else if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setSelectedSuggestionIndex(prev => 
                            prev < searchSuggestions.length - 1 ? prev + 1 : prev
                          );
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Escape') {
                          setShowSuggestions(false);
                        }
                      }}
                      borderRadius="md"
                      bg="whiteAlpha.200"
                      color="white"
                      borderColor="whiteAlpha.300"
                      _placeholder={{ color: 'whiteAlpha.700' }}
                      _hover={{ borderColor: 'whiteAlpha.400' }}
                      _focus={{ borderColor: 'pink.300', boxShadow: '0 0 0 1px #d53f8c' }}
                      pr="2.5rem"
                    />
                    {searchTerm && (
                      <InputRightElement width="2.5rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          icon={<CloseIcon />}
                          onClick={() => {
                            setSearchTerm('');
                            const lastPage = sessionStorage.getItem('lastPage');
                            if (lastPage) {
                              setCurrentPage(parseInt(lastPage));
                            }
                          }}
                          variant="ghost"
                          colorScheme="whiteAlpha"
                          aria-label="Limpiar búsqueda"
                          _hover={{ bg: 'whiteAlpha.300' }}
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                  
                  {/* Panel de sugerencias */}
                  {(showSuggestions && isSearchFocused) && (
                    <Box
                      position="absolute"
                      top="100%"
                      left={0}
                      right={0}
                      mt={2}
                      bg="gray.800"
                      borderRadius="md"
                      boxShadow="xl"
                      zIndex={1000}
                      maxH="400px"
                      overflowY="auto"
                      border="1px solid"
                      borderColor="gray.700"
                    >
                      {/* Historial de búsqueda */}
                      {searchTerm.length === 0 && searchHistory.length > 0 && (
                        <Box>
                          <Flex justify="space-between" align="center" px={4} py={2} borderBottom="1px solid" borderColor="gray.700">
                            <Text fontSize="xs" color="gray.400" fontWeight="bold">
                              BÚSQUEDAS RECIENTES
                            </Text>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorScheme="pink"
                              onClick={clearSearchHistory}
                            >
                              Limpiar
                            </Button>
                          </Flex>
                          {searchHistory.map((term, index) => (
                            <Box
                              key={index}
                              px={4}
                              py={3}
                              cursor="pointer"
                              _hover={{ bg: 'whiteAlpha.100' }}
                              onClick={() => {
                                setSearchTerm(term);
                                addToSearchHistory(term);
                              }}
                            >
                              <Text color="white" fontSize="sm">
                                {term}
                              </Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                      
                      {/* Sugerencias de productos */}
                      {searchTerm.length >= 2 && searchSuggestions.length > 0 && (
                        <Box>
                          <Text fontSize="xs" color="gray.400" fontWeight="bold" px={4} py={2} borderBottom="1px solid" borderColor="gray.700">
                            SUGERENCIAS
                          </Text>
                          {searchSuggestions.map((suggestion, index) => (
                            <Flex
                              key={suggestion.id}
                              px={4}
                              py={3}
                              cursor="pointer"
                              bg={selectedSuggestionIndex === index ? 'whiteAlpha.100' : 'transparent'}
                              _hover={{ bg: 'whiteAlpha.100' }}
                              onClick={() => {
                                setSearchTerm(suggestion.text);
                                addToSearchHistory(suggestion.text);
                                setShowSuggestions(false);
                              }}
                              align="center"
                              gap={3}
                            >
                              <Box
                                width="40px"
                                height="40px"
                                borderRadius="md"
                                overflow="hidden"
                                flexShrink={0}
                              >
                                <img 
                                  src={suggestion.image} 
                                  alt={suggestion.text}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              </Box>
                              <Box flex={1}>
                                <Text color="white" fontSize="sm" noOfLines={1}>
                                  {suggestion.text}
                                </Text>
                                <Text color="pink.300" fontSize="xs" fontWeight="bold">
                                  ${suggestion.price.toLocaleString()}
                                </Text>
                              </Box>
                            </Flex>
                          ))}
                        </Box>
                      )}
                      
                      {/* Sin resultados */}
                      {searchTerm.length >= 2 && searchSuggestions.length === 0 && (
                        <Box px={4} py={6} textAlign="center">
                          <Text color="gray.400" fontSize="sm">
                            No se encontraron productos
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
                
                {/* El toggle para mostrar/ocultar contenido adulto ha sido eliminado */}
              </Flex>
              
              {/* Selector de ordenación y filtro de precios (derecha) */}
              <Flex align="center" gap={{ base: 2, md: 4 }} width={{ base: '100%', md: 'auto' }} flexWrap="wrap" justifyContent={{ base: 'flex-start', md: 'flex-end' }}>
                {/* Botón para filtrar productos en oferta */}
                <Button
                  colorScheme={filterOffersOnly ? 'pink' : 'gray'}
                  variant={filterOffersOnly ? 'solid' : 'outline'}
                  size={{ base: 'sm', md: 'md' }}
                  bg={filterOffersOnly ? 'pink.500' : 'whiteAlpha.200'}
                  color="white"
                  _hover={{ bg: filterOffersOnly ? 'pink.600' : 'whiteAlpha.300' }}
                  onClick={() => {
                    setFilterOffersOnly(!filterOffersOnly);
                    setCurrentPage(1);
                  }}
                  width="auto"
                >
                  <Box display={{ base: 'none', sm: 'block' }}>
                    {filterOffersOnly ? '✓ Ofertas' : 'Ofertas'}
                  </Box>
                  <Box display={{ base: 'block', sm: 'none' }}>
                    {filterOffersOnly ? '✓ Ofertas' : 'Ofertas'}
                  </Box>
                </Button>
                
                {/* Botón para filtrar productos nuevos */}
                <Button
                  colorScheme={filterNewOnly ? 'pink' : 'gray'}
                  variant={filterNewOnly ? 'solid' : 'outline'}
                  size={{ base: 'sm', md: 'md' }}
                  bg={filterNewOnly ? 'pink.500' : 'whiteAlpha.200'}
                  color="white"
                  _hover={{ bg: filterNewOnly ? 'pink.600' : 'whiteAlpha.300' }}
                  onClick={() => {
                    setFilterNewOnly(!filterNewOnly);
                    setCurrentPage(1);
                  }}
                  width="auto"
                >
                  <Box display={{ base: 'none', sm: 'block' }}>
                    {filterNewOnly ? '✓ Nuevos' : 'Nuevos'}
                  </Box>
                  <Box display={{ base: 'block', sm: 'none' }}>
                    {filterNewOnly ? '✓ Nuevos' : 'Nuevos'}
                  </Box>
                </Button>
                
                {/* Filtro de rango de precios */}
                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <Button
                      colorScheme="pink"
                      variant="outline"
                      size={{ base: 'sm', md: 'md' }}
                      bg="whiteAlpha.200"
                      color="white"
                      _hover={{ bg: 'whiteAlpha.300' }}
                      width="auto"
                    >
                      <Box as="span" overflow="hidden" textOverflow="ellipsis">
                        <Box display={{ base: 'none', sm: 'block' }}>
                          ${Math.floor(priceRange[0] / 1000)}k - ${Math.floor(priceRange[1] / 1000)}k
                        </Box>
                        <Box display={{ base: 'block', sm: 'none' }}>
                          ${Math.floor(priceRange[0] / 1000)}k-${Math.floor(priceRange[1] / 1000)}k
                        </Box>
                      </Box>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent bg="gray.800" borderColor="gray.700" width="300px">
                    <PopoverArrow bg="gray.800" />
                    <PopoverBody p={6}>
                      <VStack spacing={4} align="stretch">
                        <Text color="white" fontWeight="bold" fontSize="sm">
                          Rango de precios
                        </Text>
                        <RangeSlider
                          min={minPrice}
                          max={maxPrice}
                          step={1000}
                          value={tempPriceRange}
                          onChange={(val) => setTempPriceRange(val)}
                          onChangeEnd={(val) => {
                            setPriceRange(val);
                            setCurrentPage(1);
                          }}
                          colorScheme="pink"
                        >
                          <RangeSliderTrack bg="gray.600">
                            <RangeSliderFilledTrack bg="pink.400" />
                          </RangeSliderTrack>
                          <RangeSliderThumb index={0} boxSize={6}>
                            <Box color="pink.400" />
                          </RangeSliderThumb>
                          <RangeSliderThumb index={1} boxSize={6}>
                            <Box color="pink.400" />
                          </RangeSliderThumb>
                        </RangeSlider>
                        <HStack justify="space-between">
                          <Text color="gray.300" fontSize="sm">
                            ${tempPriceRange[0].toLocaleString()}
                          </Text>
                          <Text color="gray.300" fontSize="sm">
                            ${tempPriceRange[1].toLocaleString()}
                          </Text>
                        </HStack>
                        {(priceRange[0] !== minPrice || priceRange[1] !== maxPrice) && (
                          <Button
                            size="sm"
                            colorScheme="pink"
                            variant="ghost"
                            onClick={() => {
                              setPriceRange([minPrice, maxPrice]);
                              setTempPriceRange([minPrice, maxPrice]);
                              setCurrentPage(1);
                            }}
                          >
                            Restablecer
                          </Button>
                        )}
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
                
                {/* Selector de ordenación */}
                <Menu width={{ base: '100%', md: 'auto' }}>
                  <MenuButton 
                    as={Button} 
                    rightIcon={<ChevronDownIcon />}
                    colorScheme="pink"
                    variant="outline"
                    size={{ base: 'sm', md: 'md' }}
                    bg="whiteAlpha.200"
                    color="white"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    width="auto"
                    sx={{
                      // Estilos para manejar el texto en dispositivos móviles
                      '.chakra-button__icon': {
                        ml: { base: 1, md: 2 }
                      },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box as="span" overflow="hidden" textOverflow="ellipsis" flex="1">
                      <Box display={{ base: 'none', sm: 'block' }}>
                        Ordenar por: {sortOption === 'newest-added' ? 'Más recientes' : 
                                sortOption === 'price-asc' ? 'Precio: menor a mayor' :
                                sortOption === 'price-desc' ? 'Precio: mayor a menor' :
                                sortOption === 'newest' ? 'Etiqueta nuevo' :
                                sortOption === 'offers' ? 'Mejores ofertas primero' :
                                sortOption === 'name-asc' ? 'Nombre: A-Z' :
                                sortOption === 'name-desc' ? 'Nombre: Z-A' : 'Más recientes'}
                      </Box>
                      <Box display={{ base: 'block', sm: 'none' }}>
                        Ordenar: {sortOption === 'newest-added' ? 'Recientes' : 
                                sortOption === 'price-asc' ? 'Precio ↑' :
                                sortOption === 'price-desc' ? 'Precio ↓' :
                                sortOption === 'newest' ? 'Nuevos' :
                                sortOption === 'offers' ? 'Ofertas' :
                                sortOption === 'name-asc' ? 'A-Z' :
                                sortOption === 'name-desc' ? 'Z-A' : 'Recientes'}
                      </Box>
                    </Box>
                  </MenuButton>
                  <Portal>
                    <MenuList zIndex={1000}>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('newest-added'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Más recientes</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('price-asc'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Precio: menor a mayor</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('price-desc'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Precio: mayor a menor</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('newest'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Etiqueta nuevo</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('offers'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Mejores ofertas primero</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('name-asc'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Nombre: A-Z</MenuItem>
                      <MenuItem onClick={() => { 
                        // Guardar la página actual antes de cambiar
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('name-desc'); 
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Nombre: Z-A</MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              </Flex>
            </Flex>
          </Flex>
          
          {sortedProducts.length > 0 ? (
            <>
              <SimpleGrid 
                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                spacing={6}
                justifyItems="center"
                mx="auto"
                mb={8}
              >
                <AnimatePresence mode="popLayout">
                  {currentProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
                    >
                      <ProductCard 
                        product={product}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </SimpleGrid>
              
              {/* Controles de paginación */}
              {totalPages > 1 && (
                <Flex justify="center" mt={8} mb={4}>
                  <ButtonGroup variant="outline" spacing={2} colorScheme="pink">
                    <IconButton 
                      icon={<FaChevronLeft />} 
                      onClick={() => handlePageChange(currentPage - 1)}
                      isDisabled={currentPage === 1}
                      aria-label="Página anterior"
                    />
                    
                    {/* Mostrar números de página con puntos suspensivos */}
                    {(() => {
                      // Array para almacenar los botones de página que se mostrarán
                      const pageButtons = [];
                      
                      // Siempre mostrar la primera página
                      pageButtons.push(
                        <Button 
                          key={1}
                          onClick={() => handlePageChange(1)}
                          variant={currentPage === 1 ? "solid" : "outline"}
                          colorScheme="pink"
                        >
                          1
                        </Button>
                      );
                      
                      // Lógica para mostrar puntos suspensivos y páginas intermedias
                      if (totalPages > 7) {
                        // Si la página actual está cerca del inicio (páginas 1-4)
                        if (currentPage <= 4) {
                          for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink">{i}</Button>
                            );
                          }
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost">...</Button>
                          );
                        } 
                        // Si la página actual está cerca del final
                        else if (currentPage >= totalPages - 3) {
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost">...</Button>
                          );
                          for (let i = Math.max(2, totalPages - 4); i < totalPages; i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink">{i}</Button>
                            );
                          }
                        } 
                        // Si la página actual está en el medio
                        else {
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost">...</Button>
                          );
                          // Mostrar 2 páginas antes, la actual, y 2 páginas después
                          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink">{i}</Button>
                            );
                          }
                          pageButtons.push(
                            <Button key="ellipsis2" isDisabled _hover={{ cursor: "default" }} variant="ghost">...</Button>
                          );
                        }
                      } else if (totalPages > 1) {
                        // Para menos páginas, mostrar todas sin puntos suspensivos
                        for (let i = 2; i < totalPages; i++) {
                          pageButtons.push(
                            <Button 
                              key={i}
                              onClick={() => handlePageChange(i)}
                              variant={currentPage === i ? "solid" : "outline"}
                              colorScheme="pink"
                            >
                              {i}
                            </Button>
                          );
                        }
                      }
                      
                      // Siempre mostrar la última página si hay más de una página
                      if (totalPages > 1) {
                        pageButtons.push(
                          <Button 
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            variant={currentPage === totalPages ? "solid" : "outline"}
                            colorScheme="pink"
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                      
                      return pageButtons;
                    })()}
                    
                    <IconButton 
                      icon={<FaChevronRight />} 
                      onClick={() => handlePageChange(currentPage + 1)}
                      isDisabled={currentPage === totalPages}
                      aria-label="Página siguiente"
                    />
                  </ButtonGroup>
                </Flex>
              )}
            </>
          ) : (
            <Box textAlign="center" py={10}>
              <Text fontSize="xl" color="white">No se encontraron productos que coincidan con tu búsqueda.</Text>
            </Box>
          )}
        </Container>
      </Box>

      {/* Sección SEO - Contenido textual para motores de búsqueda */}
      <Box bg="#241521" py={12} color="white">
        <Container maxW="7xl">
          <Stack spacing={8}>
            <Heading as="h2" size="xl" color="pink.300">
              Sobre Arkya Store
            </Heading>
            <Text fontSize="md" color="gray.300" lineHeight={1.8}>
              Arkya Store es tu tienda online especializada en artículos importados directamente desde Japón.
              Ofrecemos una cuidada selección de Artbooks oficiales, Dōjinshi (Doujinshi) de artistas independientes,
              Mangas en japonés, Novelas Ligeras (Light Novels), Revistas semanales como Weekly Shōnen Jump,
              Guías oficiales de videojuegos, figuras coleccionables y merchandising exclusivo.
              Todos nuestros productos son 100% originales y se importan directamente desde Japón para garantizar
              la máxima calidad y autenticidad.
            </Text>
            <Text fontSize="md" color="gray.300" lineHeight={1.8}>
              Nuestro catálogo incluye títulos de las principales editoriales japonesas como Shueisha, Kodansha y
              Square Enix, además de obras de círculos independientes reconocidos. Encontrá las últimas revistas
              Jump con los capítulos más recientes de One Piece, Jujutsu Kaisen, My Hero Academia y más.
              Si buscás material específico que no tenemos en stock, ofrecemos el servicio de pedidos personalizados:
              contactanos por <a href="https://instagram.com/arkya.store" target="_blank" rel="noopener noreferrer" style={{color: '#d53f8c', textDecoration: 'underline'}}>Instagram</a> y
              nos encargamos de conseguirlo por vos. Realizamos envíos a todo el territorio argentino con
              seguimiento y embalaje seguro para proteger tus productos durante el traslado.
            </Text>
            <Text fontSize="md" color="gray.300" lineHeight={1.8}>
              En Arkya Store entendemos la pasión por la cultura japonesa. Por eso trabajamos constantemente
              para ampliar nuestro inventario con los lanzamientos más recientes y las ediciones más buscadas
              por coleccionistas. Desde Artbooks de anime y manga hasta Doujinshi de eventos como Comiket,
              Novelas Ligeras de las series más populares y Revistas Jump semanales, traemos lo mejor del
              mercado japonés para los fans de Argentina.
            </Text>

            {/* Links internos */}
            <Box>
              <Heading as="h3" size="md" color="pink.300" mb={3}>
                Navegación del sitio
              </Heading>
              <Flex wrap="wrap" gap={3}>
                <Button as={Link} to="/" size="sm" variant="outline" colorScheme="pink">
                  Inicio
                </Button>
                <Button as={Link} to="/" onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })} size="sm" variant="outline" colorScheme="pink">
                  Catálogo de Productos
                </Button>
                <Button as={Link} to="/contacto" size="sm" variant="outline" colorScheme="pink">
                  Contacto
                </Button>
                <Button as={Link} to="/terminos" size="sm" variant="outline" colorScheme="pink">
                  Términos y Condiciones
                </Button>
                <Button as={Link} to="/preguntas-frecuentes" size="sm" variant="outline" colorScheme="pink">
                  Preguntas Frecuentes
                </Button>
                <Button as={Link} to="/mis-me-gustas" size="sm" variant="outline" colorScheme="pink">
                  Mis Favoritos
                </Button>
              </Flex>
            </Box>

            {/* Links externos */}
            <Box>
              <Heading as="h3" size="md" color="pink.300" mb={3}>
                Seguinos en redes sociales
              </Heading>
              <Flex wrap="wrap" gap={3}>
                <Button
                  as="a"
                  href="https://instagram.com/arkya.store"
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FaInstagram />}
                  colorScheme="pink"
                  variant="solid"
                >
                  Instagram @arkya.store
                </Button>
              </Flex>
            </Box>

            {/* Botones de compartir */}
            <Box>
              <Heading as="h3" size="md" color="pink.300" mb={3}>
                Compartí Arkya Store
              </Heading>
              <Flex wrap="wrap" gap={3}>
                <Button
                  as="a"
                  href={`https://wa.me/?text=Conocé%20Arkya%20Store%20-%20Artículos%20importados%20de%20Japón:%20https://arkya.store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FaWhatsapp />}
                  bg="#25D366"
                  color="white"
                  _hover={{ bg: '#128C7E' }}
                  size="sm"
                >
                  WhatsApp
                </Button>
                <Button
                  as="a"
                  href={`https://twitter.com/intent/tweet?text=Arkya%20Store%20-%20Artículos%20importados%20de%20Japón&url=https://arkya.store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FaTwitter />}
                  bg="#1DA1F2"
                  color="white"
                  _hover={{ bg: '#0d8bd9' }}
                  size="sm"
                >
                  Twitter
                </Button>
                <Button
                  as="a"
                  href={`https://www.facebook.com/sharer/sharer.php?u=https://arkya.store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FaFacebook />}
                  bg="#4267B2"
                  color="white"
                  _hover={{ bg: '#365899' }}
                  size="sm"
                >
                  Facebook
                </Button>
                <Button
                  as="a"
                  href={`https://instagram.com/arkya.store`}
                  target="_blank"
                  rel="noopener noreferrer"
                  leftIcon={<FaInstagram />}
                  bg="#E4405F"
                  color="white"
                  _hover={{ bg: '#c13584' }}
                  size="sm"
                >
                  Instagram
                </Button>
              </Flex>
            </Box>
          </Stack>
        </Container>
      </Box>

    </Box>
    </>
  );
}
