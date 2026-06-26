import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaHome, FaSearch, FaArrowLeft, FaHeart, FaInstagram } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFoundPage() {
  const bgColor = useColorModeValue('gray.50', '#241521');
  const textColor = useColorModeValue('gray.700', 'white');
  const subTextColor = useColorModeValue('gray.500', 'gray.400');
  const cardBg = useColorModeValue('white', '#2a1c29');

  return (
    <Box minH="100vh" bg={bgColor} py={20} px={4}>
      <Container maxW="4xl" textAlign="center">
        <VStack spacing={8}>
          <Box
            fontSize={{ base: '6xl', md: '9xl' }}
            fontWeight="bold"
            color="pink.400"
            lineHeight={1}
            textShadow="0 0 40px rgba(237, 100, 166, 0.3)"
          >
            404
          </Box>

          <Heading
            as="h1"
            fontSize={{ base: '2xl', md: '4xl' }}
            color={textColor}
            fontWeight={700}
          >
            Página no encontrada
          </Heading>

          <Text fontSize={{ base: 'md', md: 'lg' }} color={subTextColor} maxW="600px">
            Lo sentimos, la página que buscás no existe o fue movida.
            Te invitamos a explorar nuestro catálogo de productos importados de Japón.
          </Text>

          <HStack
            spacing={4}
            flexWrap="wrap"
            justify="center"
            gap={4}
          >
            <Button
              as={RouterLink}
              to="/"
              leftIcon={<Icon as={FaHome} />}
              colorScheme="pink"
              size="lg"
              borderRadius="full"
              px={8}
            >
              Volver al inicio
            </Button>

            <Button
              as={RouterLink}
              to="/"
              leftIcon={<Icon as={FaSearch} />}
              variant="outline"
              colorScheme="pink"
              size="lg"
              borderRadius="full"
              px={8}
            >
              Ver productos
            </Button>
          </HStack>

          <Box
            bg={cardBg}
            borderRadius="2xl"
            p={8}
            mt={8}
            width="100%"
            maxW="600px"
            boxShadow="lg"
          >
            <VStack spacing={6}>
              <Text fontSize="lg" fontWeight="bold" color={textColor}>
                ¿Buscabas algo en particular?
              </Text>

              <HStack spacing={6} justify="center" flexWrap="wrap" gap={4}>
                <VStack
                  as={RouterLink}
                  to="/mis-me-gustas"
                  spacing={2}
                  p={4}
                  borderRadius="xl"
                  _hover={{ bg: 'pink.50', color: 'pink.600' }}
                  transition="all 0.2s"
                  color={textColor}
                >
                  <Icon as={FaHeart} boxSize={6} color="pink.400" />
                  <Text fontSize="sm" fontWeight="medium">Mis favoritos</Text>
                </VStack>

                <VStack
                  as="a"
                  href="https://instagram.com/arkya.store"
                  target="_blank"
                  rel="noopener noreferrer"
                  spacing={2}
                  p={4}
                  borderRadius="xl"
                  _hover={{ bg: 'pink.50', color: 'pink.600' }}
                  transition="all 0.2s"
                  color={textColor}
                >
                  <Icon as={FaInstagram} boxSize={6} color="pink.400" />
                  <Text fontSize="sm" fontWeight="medium">Instagram</Text>
                </VStack>
              </HStack>

              <Button
                as={RouterLink}
                to="/contacto"
                variant="ghost"
                colorScheme="pink"
                size="sm"
              >
                Contactanos
              </Button>
            </VStack>
          </Box>

          <Text fontSize="sm" color={subTextColor} mt={4}>
            Arkya Store — Artículos importados de Japón
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
