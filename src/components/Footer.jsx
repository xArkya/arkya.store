import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  Image,
  Divider,
  IconButton,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { FaInstagram, FaEnvelope } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const navLinkStyle = {
  color: 'whiteAlpha.800',
  fontSize: 'sm',
  _hover: { color: 'pink.300', textDecoration: 'none' },
  transition: 'color 0.2s',
};

const sectionTitleStyle = {
  fontSize: 'sm',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: 'wider',
  color: 'white',
  mb: 4,
};

export default function Footer() {
  return (
    <Box
      bg="linear-gradient(180deg, #241521 0%, #1a1017 100%)"
      color="white"
      pt={16}
      pb={8}
      borderTopWidth="1px"
      borderColor="whiteAlpha.100"
    >
      <Container maxW="7xl" px={{ base: 6, md: 8 }}>
        <SimpleGrid
          columns={{ base: 1, sm: 2, lg: 4 }}
          spacing={{ base: 10, lg: 16 }}
          mb={14}
        >
          {/* Brand */}
          <Stack spacing={5} maxW="280px">
            <HStack spacing={3} align="center">
              <Image
                src="/images/logo2.webp"
                alt="Arkya Store"
                boxSize="40px"
                objectFit="contain"
                borderRadius="md"
              />
              <Text
                fontSize="xl"
                fontWeight="bold"
                bgGradient="linear(to-r, pink.400, brand.400)"
                bgClip="text"
              >
                Arkya Store
              </Text>
            </HStack>
            <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
              Artbooks, Dōjinshi, Mangas, Guías, Novelas Ligeras y Revistas importados directamente desde Japón.
            </Text>
            <Text fontSize="xs" color="whiteAlpha.500">
              © {new Date().getFullYear()} Arkya Store. Todos los derechos reservados.
            </Text>
          </Stack>

          {/* Tienda */}
          <Stack align="flex-start">
            <Text {...sectionTitleStyle}>Tienda</Text>
            <Link as={RouterLink} to="/" {...navLinkStyle}>Inicio</Link>
            <Link as={RouterLink} to="/" {...navLinkStyle}>Catálogo</Link>
            <Link as={RouterLink} to="/mis-me-gustas" {...navLinkStyle}>Mis Favoritos</Link>
          </Stack>

          {/* Soporte */}
          <Stack align="flex-start">
            <Text {...sectionTitleStyle}>Soporte</Text>
            <Link as={RouterLink} to="/contacto" {...navLinkStyle}>Contacto</Link>
            <Link as={RouterLink} to="/preguntas-frecuentes" {...navLinkStyle}>Preguntas Frecuentes</Link>
            <Link as={RouterLink} to="/terminos" {...navLinkStyle}>Términos de Servicio</Link>
          </Stack>

          {/* Conectados */}
          <Stack align="flex-start" spacing={5}>
            <Text {...sectionTitleStyle}>Contactanos</Text>
            <Text fontSize="sm" color="whiteAlpha.700" lineHeight="tall">
              Pedidos, consultas y disponibilidad directo por Instagram.
            </Text>
            <HStack spacing={3}>
              <IconButton
                as="a"
                href="https://instagram.com/arkya.store"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                icon={<FaInstagram />}
                size="lg"
                colorScheme="pink"
                variant="solid"
                rounded="full"
                _hover={{ transform: 'scale(1.1)', boxShadow: '0 0 15px rgba(237, 100, 166, 0.4)' }}
                transition="all 0.2s"
              />
              <IconButton
                as="a"
                href="mailto:arkya.store@gmail.com"
                aria-label="Email"
                icon={<FaEnvelope />}
                size="lg"
                colorScheme="brand"
                variant="solid"
                rounded="full"
                _hover={{ transform: 'scale(1.1)', boxShadow: '0 0 15px rgba(190, 120, 160, 0.4)' }}
                transition="all 0.2s"
              />
            </HStack>
            <Link
              href="https://instagram.com/arkya.store"
              target="_blank"
              rel="noopener noreferrer"
              fontSize="sm"
              fontWeight="semibold"
              color="pink.300"
              _hover={{ color: 'pink.200' }}
            >
              @arkya.store
            </Link>
          </Stack>
        </SimpleGrid>

        <Divider borderColor="whiteAlpha.100" mb={6} />

        {/* Bottom bar */}
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={4}
        >
          <Text fontSize="xs" color="whiteAlpha.400">
            Hecho con pasión por Arkya. Cualquier recomendación es bienvenida.
          </Text>
          <HStack spacing={6}>
            <Link as={RouterLink} to="/terminos" fontSize="xs" color="whiteAlpha.400" _hover={{ color: 'whiteAlpha.600' }}>
              Términos
            </Link>
            <Link as={RouterLink} to="/preguntas-frecuentes" fontSize="xs" color="whiteAlpha.400" _hover={{ color: 'whiteAlpha.600' }}>
              FAQ
            </Link>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
}
