import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Badge,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  HStack,
} from '@chakra-ui/react';
import { FaArrowLeft } from 'react-icons/fa';
import { products as initialProducts } from '../data/products';
import ProductCard from '../components/ProductCard';

const FeriaPage = () => {
  const navigate = useNavigate();
  const [feriaProducts, setFeriaProducts] = useState([]);
  
  const bgColor = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.700', 'white');
  
  useEffect(() => {
    // Filter products that are marked as feria and sort by most recent first
    const feriaItems = initialProducts
      .filter(product => product.isFeria === true)
      .sort((a, b) => b.id - a.id); // Sort by ID descending (most recent first)
    setFeriaProducts(feriaItems);
  }, []);

  return (
    <Box minH="100vh" bg="#241521" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box mb={8}>
            <HStack justify="space-between" align="center" mb={4}>
              <Button
                leftIcon={<FaArrowLeft />}
                colorScheme="purple"
                variant="outline"
                onClick={() => navigate('/admin')}
                size="md"
              >
                Volver al Admin
              </Button>
            </HStack>
            
            <Box textAlign="center">
              <Heading 
                size="xl" 
                color="white" 
                mb={4}
                bgGradient="linear(to-r, purple.400, pink.400)"
                bgClip="text"
              >
                🎪 Productos de Feria
              </Heading>
              <Text color="gray.300" fontSize="lg">
                Categoría especial solo visible para administradores
              </Text>
              <Badge colorScheme="purple" size="lg" mt={2}>
                {feriaProducts.length} productos encontrados
              </Badge>
            </Box>
          </Box>

          {/* Info Alert */}
          <Alert 
            status="info" 
            bg="purple.800" 
            color="white" 
            borderRadius="md"
            borderWidth="1px"
            borderColor="purple.600"
          >
            <AlertIcon color="purple.300" />
            <Box>
              <AlertTitle>Vista de Administrador</AlertTitle>
              <AlertDescription>
                Esta página muestra únicamente los productos marcados como "Feria". 
                Los usuarios normales no pueden acceder a esta categoría.
              </AlertDescription>
            </Box>
          </Alert>

          {/* Products Grid */}
          {feriaProducts.length > 0 ? (
            <SimpleGrid 
              columns={{ base: 1, sm: 2, md: 3, lg: 4 }} 
              spacing={6}
              mt={6}
            >
              {feriaProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                />
              ))}
            </SimpleGrid>
          ) : (
            <Box 
              textAlign="center" 
              py={16}
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="purple.300"
            >
              <Text fontSize="xl" color={textColor} mb={4}>
                🎪 No hay productos de feria
              </Text>
              <Text color="gray.500">
                Aún no se han marcado productos como "Feria". 
                Ve al panel de administración para agregar productos a esta categoría.
              </Text>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default FeriaPage;
