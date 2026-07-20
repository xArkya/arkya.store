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

export default function TransparencyPolicyPage() {
  const bgColor = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <>
      <SEO
        title="Política de Información Transparente | Arkya Store"
        description="Política de información transparente de Arkya Store. Información clara sobre productos, disponibilidad y políticas."
        url="https://arkya.store/politica-informacion"
        keywords="política, información, transparencia, productos, disponibilidad, arkya store"
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
                Política de Información Transparente
              </Heading>
              <Text color="gray.300">
                Última actualización: 19 de Julio, 2026
              </Text>
            </VStack>

            <Card bg={bgColor}>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Compromiso con la Transparencia
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      En Arkya Store nos comprometemos a proporcionar información clara, precisa y honesta sobre todos nuestros productos y servicios. Entendemos que la confianza es fundamental para una buena relación con nuestros clientes.
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Información de Productos
                    </Heading>
                    <Text color={textColor} lineHeight="tall" mb={3}>
                      Nos aseguramos de que:
                    </Text>
                    <UnorderedList spacing={2} color={textColor}>
                      <ListItem>Todos los productos mostrados en nuestro catálogo están disponibles en Argentina</ListItem>
                      <ListItem>Los precios mostrados son los precios finales en pesos argentinos (ARS)</ListItem>
                      <ListItem>Las imágenes de los productos son reales y representan fielmente el artículo</ListItem>
                      <ListItem>Las descripciones incluyen detalles importantes como contenido, formato y condiciones especiales</ListItem>
                      <ListItem>El estado de stock se actualiza regularmente</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Disponibilidad y Stock
                    </Heading>
                    <Text color={textColor} lineHeight="tall" mb={3}>
                      Respecto a la disponibilidad:
                    </Text>
                    <UnorderedList spacing={2} color={textColor}>
                      <ListItem>Solo mostramos productos que están disponibles para compra inmediata</ListItem>
                      <ListItem>Los productos sin stock no aparecen en nuestro catálogo principal</ListItem>
                      <ListItem>Cuando un producto se agota, se retira del catálogo de venta</ListItem>
                      <ListItem>Proporcionamos información clara sobre fechas de entrega estimadas</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Precios y Ofertas
                    </Heading>
                    <Text color={textColor} lineHeight="tall" mb={3}>
                      Sobre nuestros precios:
                    </Text>
                    <UnorderedList spacing={2} color={textColor}>
                      <ListItem>Los precios incluyen todos los impuestos aplicables</ListItem>
                      <ListItem>Las ofertas y descuentos se muestran claramente con sus condiciones</ListItem>
                      <ListItem>No hay costos ocultos al momento de la compra</ListItem>
                      <ListItem>El envío se detalla antes de confirmar la compra</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Políticas Claras
                    </Heading>
                    <Text color={textColor} lineHeight="tall" mb={3}>
                      Mantenemos políticas claras y accesibles sobre:
                    </Text>
                    <UnorderedList spacing={2} color={textColor}>
                      <ListItem><strong>Devoluciones:</strong> Solo se aceptan devoluciones si el producto llegó dañado</ListItem>
                      <ListItem><strong>Contacto:</strong> Proporcionamos múltiples canales para comunicarse con nosotros</ListItem>
                      <ListItem><strong>Privacidad:</strong> Protegemos los datos personales de nuestros clientes</ListItem>
                      <ListItem><strong>Términos de Servicio:</strong> Todos los términos están disponibles en nuestro sitio</ListItem>
                    </UnorderedList>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Contenido Adulto
                    </Heading>
                    <Text color={textColor} lineHeight="tall">
                      Los productos con contenido adulto (+18) están claramente identificados y marcados. Estos productos solo se venden a mayores de edad y se requiere verificación de edad al comprar.
                    </Text>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4} color="purple.500">
                      Contacto y Reclamos
                    </Heading>
                    <Text color={textColor} lineHeight="tall" mb={3}>
                      Si tienes dudas sobre cualquier producto o política:
                    </Text>
                    <UnorderedList spacing={1} color={textColor}>
                      <ListItem>Instagram: @arkya.store</ListItem>
                      <ListItem>Email: arkya.store@gmail.com</ListItem>
                      <ListItem>Página de Contacto: arkya.store/contacto</ListItem>
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
