import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Card,
  CardBody,
  UnorderedList,
  ListItem,
} from '@chakra-ui/react';
import { SEO } from '../components/SEO';

export default function ReturnsPolicyPage() {
  const bgColor = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <>
      <SEO
        title="Política de Devoluciones | Arkya Store"
        description="Política de devoluciones de Arkya Store. Solo se aceptan devoluciones si el producto llegó dañado desde Japón."
        url="https://arkya.store/devoluciones"
        keywords="devoluciones, política de devolución, artbooks, doujinshi, manga, japón, tienda, argentina"
      />
      <Box bg="#453641" minH="100vh" py={8}>
        <Container maxW="4xl">
          <VStack spacing={8} align="stretch">
            <VStack spacing={4} textAlign="center">
              <Heading
                as="h1"
                size="2xl"
                color="white"
                bgGradient="linear(to-r, pink.400, purple.500)"
                bgClip="text"
              >
                Política de Devoluciones
              </Heading>
              <Text color="gray.300">
                Última actualización: 3 de Julio, 2026
              </Text>
            </VStack>

            <Card bg={bgColor}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      No se aceptan devoluciones ni cambios
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      En Arkya Store <strong>no realizamos devoluciones ni cambios</strong> de productos, salvo en la única excepción indicada más abajo.
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Única excepción: producto dañado en el envío desde Japón
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      Si el producto llegó <strong>dañado o en mal estado como consecuencia del envío internacional desde Japón</strong>, podés solicitar un reembolso. En ese caso:
                    </Text>
                    <UnorderedList spacing={2} color={textColor} mt={2}>
                      <ListItem>Debés avisarnos dentro de las <strong>24 horas</strong> de haber recibido el paquete</ListItem>
                      <ListItem>Debés enviarnos <strong>fotos o video</strong> del estado del producto y del empaque</ListItem>
                      <ListItem>El reembolso incluye el monto total pagado por el producto</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Casos que NO aplican
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      No se aceptan solicitudes por:
                    </Text>
                    <UnorderedList spacing={2} color={textColor} mt={2}>
                      <ListItem>Cambio de opinión o arrepentimiento de compra</ListItem>
                      <ListItem>Producto abierto o en condición de usado</ListItem>
                      <ListItem>Productos de contenido adulto (+18)</ListItem>
                      <ListItem>Pedidos personalizados o por encargo</ListItem>
                      <ListItem>Productos con descuentos especiales o de liquidación</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Contacto
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      Si el producto llegó dañado desde Japón, contactanos inmediatamente:
                    </Text>
                    <UnorderedList spacing={1} color={textColor} mt={2}>
                      <ListItem>Instagram: @arkya.store</ListItem>
                      <ListItem>Email: arkya.store@gmail.com</ListItem>
                    </UnorderedList>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    </>
  );
}
