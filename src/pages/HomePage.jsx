import { useState, useEffect, useMemo, useRef } from 'react';
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
  Checkbox,
  useDisclosure,
} from '@chakra-ui/react';
import { FaSearch, FaInstagram, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaShareAlt, FaWhatsapp, FaTwitter, FaFacebook, FaGamepad, FaArrowUp } from 'react-icons/fa';
import { ChevronDownIcon, CloseIcon } from '@chakra-ui/icons';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import Hero from '../components/Hero';
import { useGameCountdown } from '../hooks/useGameCountdown';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import InstagramFeed from '../components/InstagramFeed';
function GameCountdownBadge() {
  const { timeLeft, isExpired } = useGameCountdown();
  if (!timeLeft || isExpired) return null;
  return (
    <Text
      fontSize={{ base: '2xl', md: '4xl' }}
      fontWeight="extrabold"
      color="whiteAlpha.900"
      lineHeight="1"
      textShadow="0 0 20px rgba(255,255,255,0.4), 0 0 40px rgba(236,72,153,0.3)"
      letterSpacing="widest"
    >
      {timeLeft}
    </Text>
  );
}

import PromoBanner from '../components/PromoBanner';
import { products } from '../data/products';
import { categories } from '../data/categories';
import { offers } from '../data/offers';
import { GAME_CONFIG } from '../data/animeGame';

// Nota: 'todos' es un ID especial para mostrar todos los productos

export default function HomePage() {
  const [allProducts, setAllProducts] = useState(products);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
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
  const [searchParams, setSearchParams] = useSearchParams();
  const hasMounted = useRef(false);
  const isWritingUrl = useRef(false);
  const priceFromUrlRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(() => {
    // Intentar recuperar la página actual del sessionStorage al cargar
    // Esto hace que la página guardada solo persista durante la sesión actual
    const savedPage = sessionStorage.getItem('currentPage');
    return savedPage ? parseInt(savedPage) : 1;
  });
  const [sortOption, setSortOption] = useState('newest');
  const [filterOffersOnly, setFilterOffersOnly] = useState(false);
  const [excludedCategories, setExcludedCategories] = useState(() => {
    const saved = sessionStorage.getItem('excludedCategories');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Estado para búsqueda mejorada
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const [isLoading, setIsLoading] = useState(true);
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
  // Control del Popover de excluir categorías + ref para scroll
  const { isOpen: isExcludeOpen, onOpen: onExcludeOpen, onClose: onExcludeClose } = useDisclosure();
  const excludeScrollRef = useRef(null);
  
  useEffect(() => {
    if (isExcludeOpen && excludeScrollRef.current) {
      excludeScrollRef.current.scrollTop = 0;
    }
  }, [isExcludeOpen]);
  
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

        dbRequest.onerror = () => {
          setIsLoading(false);
        };

        dbRequest.onsuccess = (event) => {
          const db = event.target.result;
          // Verificar que el object store 'products' exista antes de usarlo
          if (!db.objectStoreNames.contains('products')) {
            setIsLoading(false);
            return;
          }
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
            setIsLoading(false);
          };

          transaction.onerror = () => {
            setIsLoading(false);
          };
        };
      } catch (error) {
        console.error('Error loading products from IndexedDB:', error);
        setIsLoading(false);
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
  
  // Leer filtros desde URL (evita loops cuando escribimos nosotros mismos)
  useEffect(() => {
    if (isWritingUrl.current) {
      isWritingUrl.current = false;
      return;
    }

    const categoryFromUrl = searchParams.get('category');
    const subcategoryFromUrl = searchParams.get('subcategory');
    const searchFromUrl = searchParams.get('search') || '';
    const sortFromUrl = searchParams.get('sort') || 'newest';
    const offersFromUrl = searchParams.get('offers') === 'true';
    const excludedFromUrl = searchParams.get('excluded') ? searchParams.get('excluded').split(',') : [];
    const pageFromUrl = parseInt(searchParams.get('page') || '1');
    const perPageFromUrl = parseInt(searchParams.get('perPage') || '12');
    const priceMinFromUrl = searchParams.get('priceMin');
    const priceMaxFromUrl = searchParams.get('priceMax');

    const savedCategory = sessionStorage.getItem('activeCategory');
    const savedSubcategory = sessionStorage.getItem('activeSubcategory');

    // --- Categoría / Subcategoría ---
    if (categoryFromUrl) {
      const categoryExists = categories.some(cat => cat.id === categoryFromUrl);
      if (categoryExists) {
        if (activeCategory !== categoryFromUrl) setActiveCategory(categoryFromUrl);
        sessionStorage.setItem('activeCategory', categoryFromUrl);
        if (subcategoryFromUrl) {
          const cat = categories.find(c => c.id === categoryFromUrl);
          const subExists = cat?.subcategories?.some(s => s.id === subcategoryFromUrl);
          if (subExists) {
            if (activeSubcategory !== subcategoryFromUrl) setActiveSubcategory(subcategoryFromUrl);
            sessionStorage.setItem('activeSubcategory', subcategoryFromUrl);
          } else if (activeSubcategory !== '') {
            setActiveSubcategory('');
            sessionStorage.setItem('activeSubcategory', '');
          }
        } else if (activeSubcategory !== '') {
          setActiveSubcategory('');
          sessionStorage.setItem('activeSubcategory', '');
        }
      }
    } else if (savedCategory) {
      const categoryExists = categories.some(cat => cat.id === savedCategory) || savedCategory === 'adultos';
      if (categoryExists && activeCategory !== savedCategory) {
        setActiveCategory(savedCategory);
        if (savedSubcategory) {
          const cat = categories.find(c => c.id === savedCategory);
          if (cat?.subcategories?.some(s => s.id === savedSubcategory)) {
            if (activeSubcategory !== savedSubcategory) setActiveSubcategory(savedSubcategory);
          } else if (activeSubcategory !== '') {
            setActiveSubcategory('');
          }
        } else if (activeSubcategory !== '') {
          setActiveSubcategory('');
        }
      } else if (!categoryExists && activeCategory !== 'todos') {
        setActiveCategory('todos');
        setActiveSubcategory('');
        sessionStorage.setItem('activeCategory', 'todos');
        sessionStorage.setItem('activeSubcategory', '');
      }
    } else if (activeCategory !== 'todos') {
      setActiveCategory('todos');
      setActiveSubcategory('');
      sessionStorage.setItem('activeCategory', 'todos');
      sessionStorage.setItem('activeSubcategory', '');
    }

    // --- Resto de filtros ---
    if (searchTerm !== searchFromUrl) {
      setSearchTerm(searchFromUrl);
      setInputValue(searchFromUrl);
    }
    if (sortOption !== sortFromUrl) setSortOption(sortFromUrl);
    if (filterOffersOnly !== offersFromUrl) setFilterOffersOnly(offersFromUrl);
    if (JSON.stringify(excludedCategories) !== JSON.stringify(excludedFromUrl)) setExcludedCategories(excludedFromUrl);
    if (currentPage !== pageFromUrl) setCurrentPage(pageFromUrl);
    if (productsPerPage !== perPageFromUrl) setProductsPerPage(perPageFromUrl);

    // --- Rango de precios ---
    if (priceMinFromUrl !== null && priceMaxFromUrl !== null) {
      const min = parseInt(priceMinFromUrl);
      const max = parseInt(priceMaxFromUrl);
      if (priceRange[0] !== min || priceRange[1] !== max) {
        priceFromUrlRef.current = true;
        setPriceRange([min, max]);
        setTempPriceRange([min, max]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Aplicar ofertas globales a los productos
  const productsWithOffers = useMemo(() => {
    return allProducts.map(product => {
      // Si el producto no tiene stock, no aplicar ofertas
      if (product.inStock === false) {
        return {
          ...product,
          isOnOffer: false, // Asegurarse de que no tenga oferta
          isNew: false      // Quitar etiqueta nuevo si no hay stock
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
  
  // Inicializar el rango de precios con los valores reales (respeta URL)
  useEffect(() => {
    if (priceFromUrlRef.current) return;
    setPriceRange([minPrice, maxPrice]);
    setTempPriceRange([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);
  
  // Debounce: actualizar searchTerm solo después de dejar de escribir
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(inputValue);
    }, 300);
    return () => clearTimeout(timeout);
  }, [inputValue]);

  // Generar sugerencias de búsqueda
  useEffect(() => {
    if (inputValue.length >= 2) {
      const searchLower = inputValue.toLowerCase();
      
      // Buscar en nombres de productos, respetando exclusiones
      const suggestions = productsWithOffers
        .filter(product => {
          const matchesSearch = 
            product.name.toLowerCase().includes(searchLower) ||
            (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
            (product.id && product.id.toString().includes(inputValue));
          
          // Aplicar filtro de categorías excluidas
          let matchesExcluded = true;
          if (excludedCategories.length > 0) {
            const productCategories = product.categories && product.categories.length > 0
              ? product.categories
              : [product.category];
            matchesExcluded = !excludedCategories.some(catId => {
              if (catId === 'adultos') {
                return product.adultContent === true;
              }
              const catName = getCategoryNameById(catId);
              return productCategories.includes(catName);
            });
          }
          
          return matchesSearch && matchesExcluded;
        })
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
  }, [inputValue, productsWithOffers, excludedCategories]);
  
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
      
      const matchesOffersFilter = !filterOffersOnly || (product.isOnOffer === true && product.discountPercentage > 0);
      
      // Excluir categorías seleccionadas
      let matchesExcludedCategories = true;
      if (excludedCategories.length > 0) {
        const productCategories = product.categories && product.categories.length > 0 
          ? product.categories 
          : [product.category];
        matchesExcludedCategories = !excludedCategories.some(catId => {
          if (catId === 'adultos') {
            return product.adultContent === true;
          }
          const catName = getCategoryNameById(catId);
          return productCategories.includes(catName);
        });
      }
      
      return matchesSearch && matchesCategory && matchesSubcategory && matchesAdultFilter && matchesPriceRange && matchesOffersFilter && matchesExcludedCategories;
    });
  }, [productsWithOffers, searchTerm, activeCategory, activeSubcategory, showAdultContent, adultFilterActive, priceRange, filterOffersOnly, excludedCategories]);
  
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
        result.sort((a, b) => {
          if (b.isNew === a.isNew) {
            return b.id - a.id;
          }
          return b.isNew ? 1 : -1;
        });
        break;
      case 'newest-added':
        // Ordenar por ID descendente (asumiendo que IDs mayores son productos más recientes)
        result.sort((a, b) => b.id - a.id);
        break;
      case 'offers':
        // Ordenar por porcentaje de descuento (de mayor a menor)
        result.sort((a, b) => {
          const aHasDiscount = a.isOnOffer && a.discountPercentage > 0;
          const bHasDiscount = b.isOnOffer && b.discountPercentage > 0;
          // Si ambos tienen oferta real, comparar por porcentaje de descuento
          if (aHasDiscount && bHasDiscount) {
            return b.discountPercentage - a.discountPercentage;
          }
          // Si solo uno tiene oferta real, ese va primero
          return (bHasDiscount === aHasDiscount) ? 0 : bHasDiscount ? 1 : -1;
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

  // === PAGINACIÓN ===
  const [productsPerPage, setProductsPerPage] = useState(() => {
    const saved = localStorage.getItem('productsPerPage');
    return saved ? parseInt(saved) : 12;
  });

  // Guardar preferencia de cantidad por página
  useEffect(() => {
    localStorage.setItem('productsPerPage', productsPerPage.toString());
  }, [productsPerPage]);

  // Escribir filtros activos a la URL (evita el primer render para no pisar la URL inicial)
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (activeCategory !== 'todos') params.set('category', activeCategory);
    if (activeSubcategory) params.set('subcategory', activeSubcategory);
    if (sortOption !== 'newest') params.set('sort', sortOption);
    if (filterOffersOnly) params.set('offers', 'true');
    if (excludedCategories.length > 0) params.set('excluded', excludedCategories.join(','));
    if (currentPage !== 1) params.set('page', String(currentPage));
    if (productsPerPage !== 12 && productsPerPage !== 9999) params.set('perPage', String(productsPerPage));
    if (productsPerPage === 9999) params.set('perPage', 'all');
    if (minPrice !== undefined && maxPrice !== undefined) {
      if (priceRange[0] !== minPrice || priceRange[1] !== maxPrice) {
        params.set('priceMin', String(priceRange[0]));
        params.set('priceMax', String(priceRange[1]));
      }
    }

    isWritingUrl.current = true;
    setSearchParams(params, { replace: true });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, activeCategory, activeSubcategory, sortOption, filterOffersOnly, excludedCategories, currentPage, productsPerPage, priceRange, minPrice, maxPrice]);

  // Scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Función para manejar el clic en una categoría
  const handleCategoryClick = (categoryId) => {
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

    setActiveCategory(categoryId);
    setActiveSubcategory('');

    // Guardar la página actual antes de cambiar
    if (searchTerm) {
      sessionStorage.setItem('lastPage', currentPage);
    }

    setCurrentPage(1); // Reiniciar a la primera página al cambiar de categoría
    sessionStorage.setItem('currentPage', '1');

  };

  // Función para manejar el clic en una subcategoría
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    // Siempre desactivar el filtro de adultos al seleccionar una subcategoría
    setAdultFilterActive(false);
    sessionStorage.setItem('adultFilterActive', 'false');

    // Guardar la categoría y subcategoría en sessionStorage
    sessionStorage.setItem('activeCategory', categoryId);
    sessionStorage.setItem('activeSubcategory', subcategoryId);

    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId);

    // Guardar la página actual antes de cambiar
    if (searchTerm) {
      sessionStorage.setItem('lastPage', currentPage);
    }

    setCurrentPage(1); // Reiniciar a la primera página al cambiar de subcategoría
    sessionStorage.setItem('currentPage', '1');

  };

  // Calcular el número total de páginas
  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  
  // Obtener los productos para la página actual
  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * productsPerPage;
    return sortedProducts.slice(startIndex, startIndex + productsPerPage);
  }, [sortedProducts, currentPage, productsPerPage]);
  
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
      {(() => {
        // SEO dinámico según categoría activa para mejorar posicionamiento en Google
        const seoMap = {
          todos: {
            title: 'Arkya Store - Artbooks, Doujinshi, Mangas y Revistas Importadas de Japón',
            desc: 'Hacé tu pedido de Artbooks, Dōjinshi (Doujinshi), Mangas, Guías oficiales, Novelas Ligeras, Revistas (Jump, etc.) y merchandising importado desde Japón. Envíos a todo el país. También traemos a pedido.',
            url: 'https://arkya.store/',
          },
          artbooks: {
            title: 'Artbooks de Anime y Manga Japoneses en Argentina | Arkya Store',
            desc: 'Comprá Artbooks originales de Japón: ilustraciones oficiales de One Piece, Fate, Evangelion, Jujutsu Kaisen y más. 100% originales, importados desde Japón. Envíos a todo el país.',
            url: 'https://arkya.store/?category=artbooks',
          },
          figuras: {
            title: 'Figuras de Anime Japonesas Importadas | Arkya Store',
            desc: 'Figuras coleccionables de anime importadas desde Japón. Bandai, Furyu y más marcas. 100% originales con envío a todo Argentina.',
            url: 'https://arkya.store/?category=figuras',
          },
          mangas: {
            title: 'Mangas en Japonés Originales Importados | Arkya Store',
            desc: 'Mangas en idioma japonés directo desde Japón. Ediciones especiales con artbooks, acrílicos, stickers y más. Shueisha, Kodansha, Square Enix.',
            url: 'https://arkya.store/?category=mangas',
          },
          revistas: {
            title: 'Revistas Japonesas de Anime - Jump, Comptiq, Kirara | Arkya Store',
            desc: 'Revistas japonesas semanales y mensuales: Weekly Shōnen Jump, Jump GIGA, Comptiq, Manga Time Kirara, Young Animal y más. Importadas desde Japón.',
            url: 'https://arkya.store/?category=revistas',
          },
          doujinshis: {
            title: 'Doujinshi Japonés - Comiket, Fanzines de Anime | Arkya Store',
            desc: 'Doujinshi (dōjinshi) originales de Japón. Fanzines de Comiket, ilustraciones independientes de artistas japoneses. 100% originales.',
            url: 'https://arkya.store/?category=doujinshis',
          },
          'guide-books': {
            title: 'Guide Books y Guías Oficiales de Videojuegos Japoneses | Arkya Store',
            desc: 'Guías oficiales de videojuegos japoneses: Dragon Ball, Fate/Grand Order, Evangelion, Rockman y más. Mapas, estadísticas e ilustraciones.',
            url: 'https://arkya.store/?category=guide-books',
          },
          'character-books': {
            title: 'Character Books de Anime y Manga Japoneses | Arkya Store',
            desc: 'Character books y fanbooks oficiales de anime y manga japoneses. Diseños de personajes, datos exclusivos e ilustraciones.',
            url: 'https://arkya.store/?category=character-books',
          },
          cartas: {
            title: 'Cartas y Trading Cards de Anime Japonesas | Arkya Store',
            desc: 'Cartas coleccionables de anime importadas desde Japón. Weiss Schwarz, cartas promocionales y más.',
            url: 'https://arkya.store/?category=cartas',
          },
          'cd-dvd': {
            title: 'CDs y DVDs de Anime y Manga Importados de Japón | Arkya Store',
            desc: 'CDs y DVDs de anime y manga importados directamente desde Japón. Bandas sonoras, dramas y más.',
            url: 'https://arkya.store/?category=cd-dvd',
          },
          'novela-ligera': {
            title: 'Novelas Ligeras Japonesas (Light Novels) Importadas | Arkya Store',
            desc: 'Novelas ligeras japonesas en idioma japonés. Ediciones especiales con artbooks, cajas contenedoras y extras.',
            url: 'https://arkya.store/?category=novela-ligera',
          },
          peluches: {
            title: 'Peluches de Anime Japoneses Importados | Arkya Store',
            desc: 'Peluches de personajes de anime importados desde Japón. Sumikkogurashi y más personajes kawaii.',
            url: 'https://arkya.store/?category=peluches',
          },
        };
        const seo = seoMap[activeCategory] || seoMap.todos;
        return (
          <SEO
            title={seo.title}
            description={seo.desc}
            image="https://arkya.store/images/logo2.webp"
            url={seo.url}
          />
        );
      })()}
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

      {/* Banner del juego Adivina el Anime — OCULTO TEMPORALMENTE
      <Box
        as={Link}
        to="/adivina-el-anime"
        display="block"
        mx={{ base: 4, md: 'auto' }}
        maxW="7xl"
        mt={4}
        mb={6}
        p={{ base: 5, md: 6 }}
        borderRadius="2xl"
        bgGradient="linear(to-r, #702963, #b83280)"
        border="2px solid"
        borderColor="pink.400"
        boxShadow="0 0 20px rgba(236, 72, 153, 0.4)"
        _hover={{ transform: 'translateY(-3px)', boxShadow: '0 0 30px rgba(236, 72, 153, 0.6)' }}
        transition="all 0.3s ease"
        position="relative"
        overflow="hidden"
      >
        <HStack spacing={{ base: 3, md: 5 }} align="center" justify="space-between">
          <HStack spacing={{ base: 3, md: 4 }} align="center">
            <Box
              bg="whiteAlpha.200"
              p={{ base: 2, md: 3 }}
              borderRadius="full"
              backdropFilter="blur(4px)"
            >
              <FaGamepad size={28} color="#fbb6ce" />
            </Box>
            <VStack align="start" spacing={0}>
              <Text
                fontSize={{ base: 'sm', md: 'lg' }}
                fontWeight="bold"
                color="white"
                lineHeight="short"
              >
                ¡Adiviná el anime y GANÁ DESCUENTOS!
              </Text>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="pink.100">
                5 niveles · Hasta {GAME_CONFIG.maxDiscount}% OFF · Una sola chance
              </Text>
            </VStack>
          </HStack>

          <Box display={{ base: 'none', md: 'block' }}>
            <GameCountdownBadge />
          </Box>

          <Button
            size={{ base: 'sm', md: 'md' }}
            bg="white"
            color="#702963"
            fontWeight="bold"
            borderRadius="full"
            px={6}
            _hover={{ bg: 'pink.50' }}
            flexShrink={0}
          >
            Jugar →
          </Button>
        </HStack>
      </Box>
      */}

      {/* Banner de promoción activa */}
      {offers.find(o => o.isActive && o.isGlobal) && (
        <PromoBanner offer={{
          ...offers.find(o => o.isActive && o.isGlobal),
          title: '¡Descuentos por toda la tienda!',
          description: 'Aprovecha esta oferta especial'
        }} />
      )}
      
      <Box id="productos" name="productos" py={10} bg="#453641">
        <Container maxW={'7xl'}>
          <Heading as="h2" size="xl" mb={3} textAlign="center" color="white">
            {activeCategory === 'todos'
              ? 'Tienda de Productos Importados de Japón'
              : activeCategory === 'adultos'
              ? 'Productos para mayores de 18'
              : activeCategory === 'artbooks'
              ? 'Artbooks de Anime y Manga'
              : activeCategory === 'figuras'
              ? 'Figuras de Anime'
              : activeCategory === 'mangas'
              ? 'Mangas en Japonés'
              : activeCategory === 'revistas'
              ? 'Revistas Japonesas de Anime y Manga'
              : activeCategory === 'doujinshis'
              ? 'Doujinshis'
              : activeCategory === 'guide-books'
              ? 'Guide Books y Guías de Videojuegos'
              : activeCategory === 'character-books'
              ? 'Character Books de Anime'
              : activeCategory === 'cartas'
              ? 'Cartas y Trading Cards de Anime'
              : activeCategory === 'cd-dvd'
              ? 'CDs y DVDs Japoneses'
              : activeCategory === 'novela-ligera'
              ? 'Novelas Ligeras Japonesas (Light Novels)'
              : activeCategory === 'peluches'
              ? 'Peluches Japoneses'
              : activeCategory === 'fuera-de-stock'
              ? 'Productos Fuera de Stock'
              : getCategoryNameById(activeCategory)}
          </Heading>
 
          
          <Flex 
            direction={{ base: 'column', md: 'column' }} 
            justify="center" 
            align="center"
            mb={5}
            gap={3}
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
                bg={
                  excludedCategories.includes('adultos') ? 'red.600' :
                  activeCategory === 'adultos' || adultFilterActive ? 'red.500' : 'white'
                }
                color={
                  excludedCategories.includes('adultos') || activeCategory === 'adultos' || adultFilterActive ? 'white' : 'gray.800'
                }
                borderColor={
                  excludedCategories.includes('adultos') ? 'red.600' :
                  activeCategory === 'adultos' || adultFilterActive ? 'red.500' : 'gray.300'
                }
                variant="solid"
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
                  bg: excludedCategories.includes('adultos') ? 'red.700' :
                       activeCategory === 'adultos' || adultFilterActive ? 'red.600' : 'gray.100',
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
                      bg={
                        excludedCategories.includes(category.id) ? 'red.600' :
                        activeCategory === category.id ? 'pink.400' : 'white'
                      }
                      color={
                        excludedCategories.includes(category.id) || activeCategory === category.id ? 'white' : 'gray.800'
                      }
                      borderColor={
                        excludedCategories.includes(category.id) ? 'red.600' :
                        activeCategory === category.id ? 'pink.400' : 'gray.300'
                      }
                      variant="solid"
                      _hover={{
                        bg: excludedCategories.includes(category.id) ? 'red.700' :
                             activeCategory === category.id ? 'pink.500' : 'gray.100',
                      }}
                      fontWeight="medium"
                    >
                      {category.name}
                    </MenuButton>
                    <Portal>
                      <MenuList zIndex={1000}>
                        <MenuItem onClick={() => handleCategoryClick(category.id)}>
                          Ver todos
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
                    bg={
                      excludedCategories.includes(category.id) ? 'red.600' :
                      activeCategory === category.id ? 'pink.400' : 'white'
                    }
                    color={
                      excludedCategories.includes(category.id) || activeCategory === category.id ? 'white' : 'gray.800'
                    }
                    borderColor={
                      excludedCategories.includes(category.id) ? 'red.600' :
                      activeCategory === category.id ? 'pink.400' : 'gray.300'
                    }
                    variant="solid"
                    onClick={() => handleCategoryClick(category.id)}
                    _hover={{
                      bg: excludedCategories.includes(category.id) ? 'red.700' :
                           activeCategory === category.id ? 'pink.500' : 'gray.100',
                    }}
                    fontWeight="medium"
                  >
                    {category.name}
                  </Button>
                )
              ))}
              
              {/* Botón Excluir categorías - siempre al final de la fila */}
              <Popover isOpen={isExcludeOpen} onOpen={onExcludeOpen} onClose={onExcludeClose} placement="bottom-end">
                <PopoverTrigger>
                  <Button
                    size="md"
                    px={4}
                    py={2}
                    minW="80px"
                    height="40px"
                    variant="outline"
                    bg={excludedCategories.length > 0 ? 'pink.500' : 'whiteAlpha.200'}
                    color="white"
                    borderColor="whiteAlpha.300"
                    _hover={{
                      bg: excludedCategories.length > 0 ? 'pink.600' : 'whiteAlpha.300',
                    }}
                    fontWeight="medium"
                  >
                    {excludedCategories.length > 0 ? `✓ Excluir (${excludedCategories.length})` : 'Excluir'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent bg="gray.800" borderColor="gray.700" width="260px">
                  <PopoverArrow bg="gray.800" />
                  <PopoverBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <Text color="white" fontWeight="bold" fontSize="sm">
                        Excluir categorías
                      </Text>
                      {excludedCategories.length > 0 && (
                        <Button
                          size="sm"
                          colorScheme="pink"
                          variant="ghost"
                          onClick={() => {
                            setExcludedCategories([]);
                            sessionStorage.removeItem('excludedCategories');
                            setCurrentPage(1);
                          }}
                        >
                          Restablecer
                        </Button>
                      )}
                      <VStack ref={excludeScrollRef} spacing={2} align="start" maxH="300px" overflowY="auto">
                        {categories.map((category) => (
                          <Checkbox
                            key={category.id}
                            isChecked={excludedCategories.includes(category.id)}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setExcludedCategories(prev => {
                                const newExcluded = isChecked
                                  ? [...prev, category.id]
                                  : prev.filter(id => id !== category.id);
                                sessionStorage.setItem('excludedCategories', JSON.stringify(newExcluded));
                                setCurrentPage(1);
                                return newExcluded;
                              });
                            }}
                            colorScheme="pink"
                            color="gray.200"
                            size="sm"
                          >
                            {category.name}
                          </Checkbox>
                        ))}
                        <Checkbox
                          key="adultos"
                          isChecked={excludedCategories.includes('adultos')}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setExcludedCategories(prev => {
                              const newExcluded = isChecked
                                ? [...prev, 'adultos']
                                : prev.filter(id => id !== 'adultos');
                              sessionStorage.setItem('excludedCategories', JSON.stringify(newExcluded));
                              setCurrentPage(1);
                              return newExcluded;
                            });
                          }}
                          colorScheme="red"
                          color="gray.200"
                          size="sm"
                        >
                          Contenido +18
                        </Checkbox>
                      </VStack>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              
              </Flex>
            
            <Flex 
              width="100%" 
              justify="space-between" 
              align="center" 
              mb={0}
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
                      value={inputValue}
                      onFocus={() => {
                        setIsSearchFocused(true);
                        if (inputValue.length === 0 && searchHistory.length > 0) {
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
                        const newValue = e.target.value;
                        setInputValue(newValue);
                        setSelectedSuggestionIndex(-1);

                        if (newValue && !inputValue) {
                          sessionStorage.setItem('lastPage', currentPage);
                          setCurrentPage(1);
                          // Al empezar a buscar, cambiar a categoría "todos"
                          setActiveCategory('todos');
                          setActiveSubcategory('');
                          sessionStorage.setItem('activeCategory', 'todos');
                          sessionStorage.setItem('activeSubcategory', '');
                        } else if (!newValue && inputValue) {
                          const lastPage = sessionStorage.getItem('lastPage');
                          if (lastPage) {
                            setCurrentPage(parseInt(lastPage));
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          // Al buscar, siempre cambiar a la categoría "todos"
                          setActiveCategory('todos');
                          setActiveSubcategory('');
                          sessionStorage.setItem('activeCategory', 'todos');
                          sessionStorage.setItem('activeSubcategory', '');

                          if (selectedSuggestionIndex >= 0 && searchSuggestions[selectedSuggestionIndex]) {
                            const suggestion = searchSuggestions[selectedSuggestionIndex];
                            setInputValue(suggestion.text);
                            setSearchTerm(suggestion.text);
                            addToSearchHistory(suggestion.text);
                            setShowSuggestions(false);
                          } else if (inputValue) {
                            setSearchTerm(inputValue);
                            addToSearchHistory(inputValue);
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
                    {inputValue && (
                      <InputRightElement width="2.5rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          icon={<CloseIcon />}
                          onClick={() => {
                            setInputValue('');
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
                      {inputValue.length === 0 && searchHistory.length > 0 && (
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
                                setInputValue(term);
                                setSearchTerm(term);
                                addToSearchHistory(term);
                                setActiveCategory('todos');
                                setActiveSubcategory('');
                                sessionStorage.setItem('activeCategory', 'todos');
                                sessionStorage.setItem('activeSubcategory', '');
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
                                setActiveCategory('todos');
                                setActiveSubcategory('');
                                sessionStorage.setItem('activeCategory', 'todos');
                                sessionStorage.setItem('activeSubcategory', '');
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
                
                {/* Filtro de rango de precios */}
                <Popover placement="bottom-end">
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      size={{ base: 'sm', md: 'md' }}
                      bg="whiteAlpha.200"
                      color="white"
                      borderColor="whiteAlpha.300"
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
                              priceFromUrlRef.current = false;
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
                    variant="outline"
                    size={{ base: 'sm', md: 'md' }}
                    bg="whiteAlpha.200"
                    color="white"
                    borderColor="whiteAlpha.300"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    width="auto"
                    sx={{
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
                                sortOption === 'newest' ? 'Nuevos productos' :
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
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('newest');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Nuevos productos</MenuItem>
                      <MenuItem onClick={() => {
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('newest-added');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Más recientes</MenuItem>
                      <MenuItem onClick={() => {
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('price-asc');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Precio: menor a mayor</MenuItem>
                      <MenuItem onClick={() => {
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('price-desc');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Precio: mayor a menor</MenuItem>
                      <MenuItem onClick={() => {
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('offers');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Mejores ofertas primero</MenuItem>
                      <MenuItem onClick={() => {
                        if (searchTerm) {
                          sessionStorage.setItem('lastPage', currentPage);
                        }
                        setSortOption('name-asc');
                        setCurrentPage(1);
                        localStorage.setItem('currentPage', '1');
                      }}>Nombre: A-Z</MenuItem>
                      <MenuItem onClick={() => {
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

                {/* Selector de cantidad por página */}
                <Menu>
                  <MenuButton
                    as={Button}
                    rightIcon={<ChevronDownIcon />}
                    variant="outline"
                    size={{ base: 'sm', md: 'md' }}
                    bg="whiteAlpha.200"
                    color="white"
                    borderColor="whiteAlpha.300"
                    _hover={{ bg: 'whiteAlpha.300' }}
                    width="auto"
                  >
                    {productsPerPage === 9999 ? 'Todos' : `${productsPerPage}`}
                  </MenuButton>
                  <Portal>
                    <MenuList zIndex={1000}>
                      {[12, 24, 36, 48, 60].map((n) => (
                        <MenuItem key={n} onClick={() => { setProductsPerPage(n); setCurrentPage(1); }}>
                          {n} por página
                        </MenuItem>
                      ))}
                      <MenuItem onClick={() => { setProductsPerPage(9999); setCurrentPage(1); }}>
                        Todos
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              </Flex>
            </Flex>
                     <Text fontSize="sm" color="gray.300" textAlign="center" mb={0}>
            Mostrando {currentProducts.length} de {sortedProducts.length} {sortedProducts.length === 1 ? 'resultado' : 'resultados'}
            {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
          </Text>
          </Flex>
          
          
          {sortedProducts.length > 0 ? (
            <>
              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
                spacing={6}
                mx="auto"
                mb={8}
              >
                {isLoading ? (
                  Array.from({ length: productsPerPage === 9999 ? 12 : productsPerPage }).map((_, i) => (
                    <ProductCardSkeleton key={`skeleton-${i}`} />
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {currentProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        style={{ width: '100%', height: '100%', display: 'flex' }}
                      >
                        <ProductCard
                          product={product}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </SimpleGrid>
              
              {/* Controles de paginación */}
              {totalPages > 1 && (
                <Flex justify="center" mt={8} mb={4} overflowX="auto" px={2}>
                  <ButtonGroup variant="outline" spacing={{ base: 1, md: 2 }} colorScheme="pink" size={{ base: 'sm', md: 'md' }}>
                    <IconButton
                      icon={<FaChevronLeft />}
                      onClick={() => handlePageChange(currentPage - 1)}
                      isDisabled={currentPage === 1}
                      aria-label="Página anterior"
                      size={{ base: 'sm', md: 'md' }}
                    />
                    
                    {/* Mostrar números de página con puntos suspensivos */}
                    {(() => {
                      const pageButtons = [];
                      pageButtons.push(
                        <Button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          variant={currentPage === 1 ? "solid" : "outline"}
                          colorScheme="pink"
                          size={{ base: 'sm', md: 'md' }}
                        >
                          1
                        </Button>
                      );
                      
                      if (totalPages > 7) {
                        if (currentPage <= 4) {
                          for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink" size={{ base: 'sm', md: 'md' }}>{i}</Button>
                            );
                          }
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost" size={{ base: 'sm', md: 'md' }}>...</Button>
                          );
                        }
                        else if (currentPage >= totalPages - 3) {
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost" size={{ base: 'sm', md: 'md' }}>...</Button>
                          );
                          for (let i = Math.max(2, totalPages - 4); i < totalPages; i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink" size={{ base: 'sm', md: 'md' }}>{i}</Button>
                            );
                          }
                        }
                        else {
                          pageButtons.push(
                            <Button key="ellipsis1" isDisabled _hover={{ cursor: "default" }} variant="ghost" size={{ base: 'sm', md: 'md' }}>...</Button>
                          );
                          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                            pageButtons.push(
                              <Button key={i} onClick={() => handlePageChange(i)} variant={currentPage === i ? "solid" : "outline"} colorScheme="pink" size={{ base: 'sm', md: 'md' }}>{i}</Button>
                            );
                          }
                          pageButtons.push(
                            <Button key="ellipsis2" isDisabled _hover={{ cursor: "default" }} variant="ghost" size={{ base: 'sm', md: 'md' }}>...</Button>
                          );
                        }
                      } else if (totalPages > 1) {
                        for (let i = 2; i < totalPages; i++) {
                          pageButtons.push(
                            <Button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              variant={currentPage === i ? "solid" : "outline"}
                              colorScheme="pink"
                              size={{ base: 'sm', md: 'md' }}
                            >
                              {i}
                            </Button>
                          );
                        }
                      }
                      
                      if (totalPages > 1) {
                        pageButtons.push(
                          <Button
                            key={totalPages}
                            onClick={() => handlePageChange(totalPages)}
                            variant={currentPage === totalPages ? "solid" : "outline"}
                            colorScheme="pink"
                            size={{ base: 'sm', md: 'md' }}
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
                      size={{ base: 'sm', md: 'md' }}
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

      <InstagramFeed />

      {/* Sección SEO - Contenido textual para motores de búsqueda */}
      <Box bg="#241521" py={12} color="white">
        <Container maxW="7xl">
          <Stack spacing={8}>
            <Heading as="h2" size="xl" color="pink.300">
              Sobre Arkya Store
            </Heading>
            <Text fontSize="md" color="gray.300" lineHeight={1.8}>
              Arkya Store es tu tienda online especializada en artículos importados directamente desde Japón.
              Ofrecemos una cuidada selección de Artbooks japoneses oficiales, Dōjinshi (Doujinshi) de artistas independientes,
              Mangas en japonés originales, Novelas Ligeras (Light Novels) japonesas, Revistas japonesas semanales como Weekly Shōnen Jump,
              Guías oficiales de videojuegos japoneses, figuras coleccionables de anime japonesas y merchandising exclusivo.
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

            {/* Links internos de categorías para SEO */}
            <Box>
              <Heading as="h3" size="md" color="pink.300" mb={3}>
                Categorías de productos
              </Heading>
              <Flex wrap="wrap" gap={3}>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('artbooks'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Artbooks Japoneses
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('mangas'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Mangas en Japonés
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('revistas'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Revistas Japonesas
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('doujinshis'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Doujinshis
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('guide-books'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Guide Books
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('character-books'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Character Books
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('novela-ligera'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Novelas Ligeras Japonesas
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('figuras'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Figuras de Anime
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('cd-dvd'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  CDs/DVDs Japoneses
                </Button>
                <Button size="sm" variant="outline" colorScheme="pink" onClick={() => { handleCategoryClick('todos'); document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' }); }}>
                  Ver Todo
                </Button>
              </Flex>
            </Box>

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
                  bg="#000000"
                  color="white"
                  _hover={{ bg: '#1a1a1a' }}
                  size="sm"
                >
                  X
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

      {/* Botón scroll to top */}
      {showScrollTop && (
        <IconButton
          icon={<FaArrowUp />}
          aria-label="Volver arriba"
          position="fixed"
          bottom="24px"
          left="24px"
          zIndex={9999}
          size="lg"
          borderRadius="full"
          bg="pink.500"
          color="white"
          boxShadow="0 0 20px rgba(236, 72, 153, 0.6)"
          _hover={{ bg: 'pink.400', transform: 'translateY(-2px)', boxShadow: '0 0 30px rgba(236, 72, 153, 0.9)' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        />
      )}

    </Box>
    </>
  );
}
