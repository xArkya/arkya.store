import {
  Box,
  Container,
  Stack,
  SimpleGrid,
  Text,
  Link,
  VisuallyHidden,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { FaInstagram, FaTwitter, FaYoutube } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';

const SocialButton = ({
  children,
  label,
  href,
}) => {
  return (
    <Button
      bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.100')}
      rounded={'full'}
      w={8}
      h={8}
      p={0}
      cursor={'pointer'}
      as={'a'}
      href={href}
      target="_blank"
      display={'inline-flex'}
      alignItems={'center'}
      justifyContent={'center'}
      transition={'background 0.3s ease'}
      _hover={{
        bg: useColorModeValue('blackAlpha.200', 'whiteAlpha.200'),
      }}>
      <VisuallyHidden>{label}</VisuallyHidden>
      {children}
    </Button>
  );
};

export default function Footer() {
  return (
    <Box
      color={useColorModeValue('white', 'gray.200')}
      >
      <Container as={Stack} maxW={'6xl'} py={15}>
        <SimpleGrid
          templateColumns={{ sm: '1fr 1fr', md: '2fr 1fr 1fr 2fr' }}
          spacing={8}>
          <Stack spacing={6}>
            <Box>
              <Text fontSize="xl" color="#ed64a6" fontWeight="bold">Mi Tienda</Text>
            </Box>
            <Text fontSize={'sm'}>
              © {new Date().getFullYear()} Mi Tienda. Todos los derechos reservados
            </Text>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontSize={'lg'} color="#ed64a6" fontWeight="bold" mb={2}>Nosotros</Text>
            <Link as={RouterLink} to={'/contacto'}>Contacto</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontSize={'lg'} color="#ed64a6" fontWeight="bold" mb={2}>Soporte</Text>
            <Link as={RouterLink} to={'/terminos'}>Términos de Servicio</Link>
            <Link as={RouterLink} to={'/preguntas-frecuentes'}>Preguntas Frecuentes</Link>
          </Stack>
          <Stack align={'flex-start'}>
            <Text fontSize={'lg'} color="#ed64a6" fontWeight="bold" mb={2}>Mantente Conectado</Text>
            <Text>
              Síguenos en Instagram para ver nuestros productos más recientes y promociones especiales.
            </Text>
            <Link 
              href="https://instagram.com/arkya.store" 
              target="_blank"
              color="#ed64a6"
              fontWeight="bold"
              display="inline-flex"
              alignItems="center"
              _hover={{
                color: 'brand.600',
                textDecoration: 'underline'
              }}>
              @arkya.store <Box as={FaInstagram} ml={1} />
            </Link>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
