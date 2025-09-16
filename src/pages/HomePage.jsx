import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { FaSearch, FaInstagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import { categories } from '../data/categories';
import { offers } from '../data/offers';

// Nota: 'todos' es un ID especial para mostrar todos los productos

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [searchParams] = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState('newest-added');
  const PRODUCTS_PER_PAGE = 12;
  
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
  
  // Leer categoría y subcategoría de URL params al cargar
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const subcategoryFromUrl = searchParams.get('subcategory');
    
    if (categoryFromUrl) {
      const categoryExists = categories.some(cat => cat.id === categoryFromUrl);
      if (categoryExists) {
        setActiveCategory(categoryFromUrl);
        
        if (subcategoryFromUrl) {
          const category = categories.find(cat => cat.id === categoryFromUrl);
          const subcategoryExists = category.subcategories.some(subcat => subcat.id === subcategoryFromUrl);
          
          if (subcategoryExists) {
            setActiveSubcategory(subcategoryFromUrl);
          } else {
            setActiveSubcategory('');
          }
        } else {
          setActiveSubcategory('');
        }
      } else {
        setActiveCategory('todos');
        setActiveSubcategory('');
      }
    } else {
      // Si no hay parámetro de categoría, mostrar todos
      setActiveCategory('todos');
      setActiveSubcategory('');
    }
  }, [searchParams]);

  // Aplicar ofertas globales a los productos
  const productsWithOffers = useMemo(() => {
    return products.map(product => {
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
  }, []);
  
  // Filtrar productos según la búsqueda, categoría y subcategoría
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
      
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [productsWithOffers, searchTerm, activeCategory, activeSubcategory]);
  
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
        result.sort((a, b) => (b.isOnOffer === a.isOnOffer) ? 0 : b.isOnOffer ? 1 : -1);
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
      // Scroll al inicio de la sección de productos
      const productsSection = document.getElementById('productos');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <Box>
      <Box 
        py={2} 
        px={4} 
        bg="pink.100" 
        color="gray.700" 
        textAlign="center"
        fontSize="md"
      >
        Si te interesa traer algo a pedido ¡Contáctanos por <a href="https://instagram.com/arkya.store" target="_blank">Instagram</a>!
      </Box>
      <Hero />
      
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
          >
           
            <Flex flexWrap="wrap" gap={2} p={2} width={{ base: '100%', md: 'auto' }} justifyContent="center" css={{
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
                onClick={() => handleCategoryClick('todos')}
                _hover={{
                  bg: activeCategory === 'todos' ? 'pink.500' : 'gray.100',
                }}
                fontWeight="medium"
              >
                Todos
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
                      bg={activeCategory === category.id && !activeSubcategory ? 'pink.400' : 'white'}
                      color={activeCategory === category.id && !activeSubcategory ? 'white' : 'gray.800'}
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
            
            <Flex width="100%" justify="space-between" align="center" mb={4}>
              {/* Buscador (izquierda) */}
              <InputGroup maxW={{ base: '100%', md: '300px' }}>
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="white" />
                </InputLeftElement>
                <Input 
                  placeholder="Buscar productos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  borderRadius="md"
                  bg="whiteAlpha.200"
                  color="white"
                  borderColor="whiteAlpha.300"
                  _placeholder={{ color: 'whiteAlpha.700' }}
                  _hover={{ borderColor: 'whiteAlpha.400' }}
                  _focus={{ borderColor: 'pink.300', boxShadow: '0 0 0 1px #d53f8c' }}
                />
              </InputGroup>
              
              {/* Selector de ordenación (derecha) */}
              <Menu>
                <MenuButton 
                  as={Button} 
                  rightIcon={<ChevronDownIcon />}
                  colorScheme="pink"
                  variant="outline"
                  size="md"
                  bg="whiteAlpha.200"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                >
                  Ordenar por: {sortOption === 'newest-added' ? 'Más recientes' : 
                               sortOption === 'price-asc' ? 'Precio: menor a mayor' :
                               sortOption === 'price-desc' ? 'Precio: mayor a menor' :
                               sortOption === 'newest' ? 'Etiqueta nuevo' :
                               sortOption === 'offers' ? 'Ofertas primero' :
                               sortOption === 'name-asc' ? 'Nombre: A-Z' :
                               sortOption === 'name-desc' ? 'Nombre: Z-A' : 'Más recientes'}
                </MenuButton>
                <Portal>
                  <MenuList zIndex={1000}>
                    <MenuItem onClick={() => { setSortOption('newest-added'); setCurrentPage(1); }}>Más recientes</MenuItem>
                    <MenuItem onClick={() => { setSortOption('price-asc'); setCurrentPage(1); }}>Precio: menor a mayor</MenuItem>
                    <MenuItem onClick={() => { setSortOption('price-desc'); setCurrentPage(1); }}>Precio: mayor a menor</MenuItem>
                    <MenuItem onClick={() => { setSortOption('newest'); setCurrentPage(1); }}>Etiqueta nuevo</MenuItem>
                    <MenuItem onClick={() => { setSortOption('offers'); setCurrentPage(1); }}>Ofertas primero</MenuItem>
                    <MenuItem onClick={() => { setSortOption('name-asc'); setCurrentPage(1); }}>Nombre: A-Z</MenuItem>
                    <MenuItem onClick={() => { setSortOption('name-desc'); setCurrentPage(1); }}>Nombre: Z-A</MenuItem>
                  </MenuList>
                </Portal>
              </Menu>
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
                {currentProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
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
                    
                    {/* Mostrar números de página */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // Lógica para mostrar páginas cercanas a la actual cuando hay muchas páginas
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button 
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          variant={currentPage === pageNum ? "solid" : "outline"}
                          colorScheme="pink"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    
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
    </Box>
  );
}
