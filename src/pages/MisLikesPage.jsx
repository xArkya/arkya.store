import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Button,
  Flex,
  VStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaHeart, FaArrowLeft, FaHome } from 'react-icons/fa';
import { useLikes } from '../hooks/useLikes';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function MisLikesPage() {
  const { likedProducts } = useLikes();
  const textColor = useColorModeValue('gray.900', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');

  const likedItems = useMemo(() => {
    return products.filter(p => likedProducts.includes(String(p.id)));
  }, [likedProducts]);

  return (
    <Box minH="100vh" bg="#241521" pt={8} pb={20}>
      <Container maxW="7xl">
        <Flex mb={6} gap={4}>
          <Button
            as={RouterLink}
            to="/"
            leftIcon={<FaArrowLeft />}
            colorScheme="brand"
            variant="outline"
          >
            Volver
          </Button>
        </Flex>

        <VStack spacing={4} align="start" mb={10}>
          <Flex align="center" gap={3}>
            <Icon as={FaHeart} color="pink.500" boxSize={8} />
            <Heading
              color={textColor}
              fontSize={{ base: '2xl', md: '4xl' }}
              fontWeight={600}
            >
              Mis me gusta
            </Heading>
          </Flex>
          <Text color={subTextColor} fontSize="lg">
            {likedItems.length > 0
              ? `Tenés ${likedItems.length} producto${likedItems.length > 1 ? 's' : ''} guardado${likedItems.length > 1 ? 's' : ''}. Te avisaremos cuando vuelvan a estar en stock.`
              : 'Todavía no tenés productos guardados. Dale like a los que te interesen y te avisamos cuando vuelvan a estar en stock o hagamos un pedido.'}
          </Text>
        </VStack>

        {likedItems.length > 0 ? (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {likedItems.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </SimpleGrid>
        ) : (
          <VStack spacing={6} py={20}>
            <Icon as={FaHeart} color="pink.300" boxSize={16} opacity={0.5} />
            <Text color={subTextColor} fontSize="xl" textAlign="center">
              No tenés productos guardados todavía
            </Text>
            <Button
              as={RouterLink}
              to="/"
              leftIcon={<FaHome />}
              colorScheme="pink"
              size="lg"
            >
              Ver productos
            </Button>
          </VStack>
        )}
      </Container>
    </Box>
  );
}
