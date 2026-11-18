import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Icon,
  Image,
} from '@chakra-ui/react';
import { FaHome, FaSearch, FaArrowLeft, FaHeart, FaInstagram } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

export default function NotFoundPage() {
  
  const pageText = 'arkya.text';
  const pageSub = 'arkya.textSoft';
  const cardText = 'white';
  const cardBg = 'arkya.cardAlt';

  return (
    <Box minH="100vh" bg="transparent" py={20} px={4}>
      <Container maxW="4xl" textAlign="center">
        <VStack spacing={8}>
          <Box position="relative">
            <Image
              src="/images/mascot.webp"
              alt="Arkya, la mascota de Arkya Store"
              h={{ base: '140px', md: '180px' }}
              mx="auto"
              filter="drop-shadow(0 6px 14px rgba(0, 0, 0, 0.4))"
            />
            <Box
              fontSize={{ base: '6xl', md: '9xl' }}
              fontWeight="bold"
              bgGradient="linear(to-r, teal.200, teal.400)"
              bgClip="text"
              lineHeight={1}
              mt={-4}
              filter="drop-shadow(0 0 30px rgba(65, 191, 169, 0.35))"
            >
              404
            </Box>
          </Box>

          <Heading
            as="h1"
            fontSize={{ base: '2xl', md: '4xl' }}
            color={pageText}
            fontWeight={700}
          >
            Página no encontrada
          </Heading>

          <Text fontSize={{ base: 'md', md: 'lg' }} color={pageSub} maxW="600px">
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
              colorScheme="teal"
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
              colorScheme="teal"
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
              <Text fontSize="lg" fontWeight="bold" color={cardText}>
                ¿Buscabas algo en particular?
              </Text>

              <HStack spacing={6} justify="center" flexWrap="wrap" gap={4}>
                <VStack
                  as={RouterLink}
                  to="/mis-me-gustas"
                  spacing={2}
                  p={4}
                  borderRadius="xl"
                  _hover={{ bg: 'whiteAlpha.100', color: 'teal.300' }}
                  transition="all 0.2s"
                  color={cardText}
                >
                  <Icon as={FaHeart} boxSize={6} color="teal.300" />
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
                  _hover={{ bg: 'whiteAlpha.100', color: 'teal.300' }}
                  transition="all 0.2s"
                  color={cardText}
                >
                  <Icon as={FaInstagram} boxSize={6} color="teal.300" />
                  <Text fontSize="sm" fontWeight="medium">Instagram</Text>
                </VStack>
              </HStack>

              <Button
                as={RouterLink}
                to="/contacto"
                variant="ghost"
                colorScheme="teal"
                size="sm"
              >
                Contactanos
              </Button>
            </VStack>
          </Box>

          <Text fontSize="sm" color={pageSub} mt={4}>
            Arkya Store — Artículos importados de Japón
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
