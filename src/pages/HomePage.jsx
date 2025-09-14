import { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { FaSearch, FaInstagram } from 'react-icons/fa';
import { ChevronDownIcon } from '@chakra-ui/icons';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';
import { categories } from '../data/categories';

// Nota: 'todos' es un ID especial para mostrar todos los productos

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [searchParams] = useSearchParams();
  
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

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Verificar si coincide con la categoría
    let matchesCategory = false;
    if (activeCategory === 'todos') {
      matchesCategory = true;
    } else {
      const categoryName = getCategoryNameById(activeCategory);
      matchesCategory = product.category === categoryName;
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
  
  // Función para manejar el clic en una categoría
  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setActiveSubcategory('');
    
    // Actualizar URL con el parámetro de categoría
    const params = new URLSearchParams();
    if (categoryId !== 'todos') {
      params.set('category', categoryId);
    }
    window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
  };
  
  // Función para manejar el clic en una subcategoría
  const handleSubcategoryClick = (categoryId, subcategoryId) => {
    setActiveCategory(categoryId);
    setActiveSubcategory(subcategoryId);
    
    // Actualizar URL con los parámetros de categoría y subcategoría
    const params = new URLSearchParams();
    params.set('category', categoryId);
    params.set('subcategory', subcategoryId);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
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
      
      <Box id="productos" py={10} bg="#453641">
        <Container maxW={'7xl'}>
          <Heading as="h2" size="xl" mb={6} textAlign="center" color="white">
            Tienda
          </Heading>
          <Text fontSize="sm" color="gray.300" textAlign="center" mb={6}>
            Mostrando 1-20 de 106 resultados
          </Text>
          
          <Flex 
            direction={{ base: 'column', md: 'column' }} 
            justify="center" 
            align="center"
            mb={8}
            gap={4}
          >
            <HStack spacing={2} overflow="auto" p={2} width={{ base: '100%', md: 'auto' }} justifyContent="center" css={{
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
            </HStack>
            
            <InputGroup maxW={{ base: '100%', md: '300px' }} mx="auto">
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
          </Flex>
          
          {filteredProducts.length > 0 ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </SimpleGrid>
          ) : (
            <Box textAlign="center" py={10}>
              <Text fontSize="xl">No se encontraron productos que coincidan con tu búsqueda.</Text>
            </Box>
          )}
        </Container>
      </Box>
      
     
    </Box>
  );
}
