import React, { useState, useMemo } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Button,
  Text,
  VStack,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSearch, FaTimes } from 'react-icons/fa';

const ProductSearch = ({ products, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) {
      return products;
    }

    const term = searchTerm.toLowerCase();

    return products.filter(product => {
      switch (searchType) {
        case 'name':
          return product.name.toLowerCase().includes(term);
        case 'category': {
          const categories = product.categories || [product.category];
          return categories.some(cat => cat.toLowerCase().includes(term));
        }
        case 'price': {
          const price = parseFloat(term);
          if (!isNaN(price)) {
            return product.price === price;
          }
          return false;
        }
        case 'id':
          return product.id.toString().includes(term);
        case 'tags':
          return (product.tags || []).some(tag => tag.toLowerCase().includes(term));
        case 'all':
        default:
          return (
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            (product.categories || [product.category]).some(cat => 
              cat.toLowerCase().includes(term)
            ) ||
            (product.tags || []).some(tag => tag.toLowerCase().includes(term)) ||
            product.id.toString().includes(term)
          );
      }
    });
  }, [searchTerm, searchType, products]);

  const handleSearch = (value) => {
    setSearchTerm(value);
    onFilterChange(filteredProducts);
  };

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange(products);
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
  };

  return (
    <Box
      bg={bgColor}
      p={4}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      mb={4}
    >
      <VStack spacing={3} align="stretch">
        <HStack spacing={2}>
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              borderColor={borderColor}
            />
          </InputGroup>
          {searchTerm && (
            <Button
              size="sm"
              colorScheme="red"
              variant="outline"
              leftIcon={<FaTimes />}
              onClick={handleClear}
            >
              Limpiar
            </Button>
          )}
        </HStack>

        <HStack spacing={2} flexWrap="wrap">
          <Text fontSize="sm" fontWeight="medium">Buscar por:</Text>
          <Button
            size="xs"
            colorScheme={searchType === 'all' ? 'brand' : 'gray'}
            variant={searchType === 'all' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('all')}
          >
            Todo
          </Button>
          <Button
            size="xs"
            colorScheme={searchType === 'name' ? 'brand' : 'gray'}
            variant={searchType === 'name' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('name')}
          >
            Nombre
          </Button>
          <Button
            size="xs"
            colorScheme={searchType === 'category' ? 'brand' : 'gray'}
            variant={searchType === 'category' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('category')}
          >
            Categoría
          </Button>
          <Button
            size="xs"
            colorScheme={searchType === 'price' ? 'brand' : 'gray'}
            variant={searchType === 'price' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('price')}
          >
            Precio
          </Button>
          <Button
            size="xs"
            colorScheme={searchType === 'id' ? 'brand' : 'gray'}
            variant={searchType === 'id' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('id')}
          >
            ID
          </Button>
          <Button
            size="xs"
            colorScheme={searchType === 'tags' ? 'brand' : 'gray'}
            variant={searchType === 'tags' ? 'solid' : 'outline'}
            onClick={() => handleSearchTypeChange('tags')}
          >
            Etiquetas
          </Button>
        </HStack>

        <Text fontSize="sm" color="gray.600">
          Resultados: <Badge colorScheme="blue">{filteredProducts.length}</Badge> de {products.length} productos
        </Text>
      </VStack>
    </Box>
  );
};

export default ProductSearch;
