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
  const [stockFilter, setStockFilter] = useState('all'); // 'all', 'inStock', 'outOfStock'
  
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');

  const filteredProducts = useMemo(() => {
    let result = products;

    // Apply stock filter
    if (stockFilter === 'inStock') {
      result = result.filter(product => product.inStock !== false);
    } else if (stockFilter === 'outOfStock') {
      result = result.filter(product => product.inStock === false);
    }

    if (!searchTerm.trim()) {
      return result;
    }

    const term = searchTerm.toLowerCase();

    return result.filter(product => {
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
  }, [searchTerm, searchType, stockFilter, products]);

  // Propagate filtered results whenever filters change
  React.useEffect(() => {
    onFilterChange(filteredProducts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProducts]);

  const handleSearch = (value) => {
    setSearchTerm(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    setStockFilter('all');
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
  };

  const handleStockFilterChange = (filter) => {
    setStockFilter(filter);
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

        <HStack spacing={2} flexWrap="wrap">
          <Text fontSize="sm" fontWeight="medium">Stock:</Text>
          <Button
            size="xs"
            colorScheme={stockFilter === 'all' ? 'brand' : 'gray'}
            variant={stockFilter === 'all' ? 'solid' : 'outline'}
            onClick={() => handleStockFilterChange('all')}
          >
            Todos
          </Button>
          <Button
            size="xs"
            colorScheme={stockFilter === 'inStock' ? 'green' : 'gray'}
            variant={stockFilter === 'inStock' ? 'solid' : 'outline'}
            onClick={() => handleStockFilterChange('inStock')}
          >
            En Stock
          </Button>
          <Button
            size="xs"
            colorScheme={stockFilter === 'outOfStock' ? 'red' : 'gray'}
            variant={stockFilter === 'outOfStock' ? 'solid' : 'outline'}
            onClick={() => handleStockFilterChange('outOfStock')}
          >
            Fuera de Stock
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
