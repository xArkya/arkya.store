import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Divider,
  useColorModeValue,
  Card,
  CardBody,
  OrderedList,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';

export default function TermsPage() {
  const bgColor = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box bg="#453641" minH="100vh" py={8}>
      <Container maxW="4xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              color="white"
              bgGradient="linear(to-r, pink.400, purple.500)"
              bgClip="text"
            >
              Términos de Servicio
            </Heading>
            <Text color="gray.300">
              Última actualización: 20 de Julio, 2025
            </Text>
          </VStack>

          <Card bg={bgColor}>
            <CardBody>
              <VStack spacing={6} align="stretch">
                {/* Introducción */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    1. Introducción
                  </Heading>
                  <Text color={textColor} lineHeight="tall">
                    Bienvenido a nuestra tienda online. Estos términos y condiciones 
                    describen las reglas y regulaciones para el uso de nuestro sitio web 
                    y servicios. Al acceder y utilizar este sitio web, aceptas estar 
                    sujeto a estos términos y condiciones.
                  </Text>
                </Box>

                <Divider />

                {/* Definiciones */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    2. Definiciones
                  </Heading>
                  <UnorderedList spacing={2} color={textColor}>
                    <ListItem>
                      <strong>"Nosotros"</strong> se refiere a la empresa propietaria del sitio web
                    </ListItem>
                    <ListItem>
                      <strong>"Usuario"</strong> se refiere a cualquier persona que acceda al sitio
                    </ListItem>
                    <ListItem>
                      <strong>"Servicios"</strong> se refiere a todos los servicios ofrecidos a través del sitio
                    </ListItem>
                    <ListItem>
                      <strong>"Productos"</strong> se refiere a todos los artículos disponibles para compra
                    </ListItem>
                  </UnorderedList>
                </Box>

                <Divider />

                {/* Uso del Sitio */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    3. Uso del Sitio Web
                  </Heading>
                  <Text color={textColor} mb={4} lineHeight="tall">
                    Al utilizar nuestro sitio web, te comprometes a:
                  </Text>
                  <UnorderedList spacing={2} color={textColor}>
                    <ListItem>Usar el sitio solo para fines legales</ListItem>
                    <ListItem>No interferir con el funcionamiento del sitio</ListItem>
                    <ListItem>Proporcionar información precisa y actualizada</ListItem>
                    <ListItem>Mantener la confidencialidad de tu cuenta</ListItem>
                    <ListItem>No realizar actividades fraudulentas</ListItem>
                  </UnorderedList>
                </Box>

                <Divider />

                {/* Compras y Pagos */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    4. Compras y Pagos
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        4.1 Precios
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Todos los precios están expresados en pesos Argentinos (ARS) e incluyen IVA. 
                        Nos reservamos el derecho de modificar los precios sin previo aviso.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        4.2 Métodos de Pago
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Actualmente solo aceptamos transferencias bancarias, o efectivo si lo retiras en Monte Castro. 
                        El pago debe completarse antes del envío del producto.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                {/* Envíos y Entregas */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    5. Envíos y Entregas
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        5.1 Tipos de Entrega
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Los envíos son por Correo Argentino.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        5.2 Costos de Envío
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Los costos de envío se calculan según el destino y el peso del paquete.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                {/* Devoluciones */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    6. Devoluciones y Reembolsos
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        6.1 Devolucion por error del envío de Japón
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Si el producto viene en mal estado desde Japón por culpa del correo, se te devolverá el dinero pagado a no ser que se haya acordado lo contrario
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        6.2 Devolución de la seña
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        La seña no se devuelve por ningun motivo, solo el de la sección 6.1.
                      </Text>
                    </Box>
                    <Box>
                      <Text fontWeight="semibold" color={textColor} mb={2}>
                        6.3 Proceso de Reembolso
                      </Text>
                      <Text color={textColor} lineHeight="tall">
                        Los reembolsos se procesarán dentro de 5-10 días laborables después 
                        de recibir y verificar el producto devuelto.
                      </Text>
                    </Box>
                  </VStack>
                </Box>

                <Divider />

                {/* Propiedad Intelectual */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    7. Propiedad Intelectual
                  </Heading>
                  <Text color={textColor} lineHeight="tall">
                    Todo el contenido del sitio web, incluyendo textos, imágenes, logos, 
                    y diseños, está protegido por derechos de autor y otras leyes de 
                    propiedad intelectual. No puedes usar, copiar o distribuir este 
                    contenido sin nuestro permiso expreso.
                  </Text>
                </Box>

                <Divider />

                {/* Limitación de Responsabilidad */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    8. Limitación de Responsabilidad
                  </Heading>
                  <Text color={textColor} lineHeight="tall">
                    No seremos responsables por daños indirectos, incidentales o 
                    consecuentes que puedan surgir del uso de nuestros productos o servicios. 
                    Nuestra responsabilidad se limita al valor del producto comprado.
                  </Text>
                </Box>

                <Divider />

                {/* Modificaciones */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    9. Modificaciones de los Términos
                  </Heading>
                  <Text color={textColor} lineHeight="tall">
                    Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                    Las modificaciones entrarán en vigor inmediatamente después de su 
                    publicación en el sitio web. Es tu responsabilidad revisar 
                    periódicamente estos términos.
                  </Text>
                </Box>

                <Divider />

                {/* Contacto */}
                <Box>
                  <Heading size="md" mb={4} color="purple.500">
                    10. Contacto
                  </Heading>
                  <Text color={textColor} lineHeight="tall">
                    Si tienes preguntas sobre estos términos de servicio, puedes contactarnos:
                  </Text>
                  <UnorderedList spacing={1} color={textColor} mt={2}>
                    <ListItem>Email: arkya.store@gmail.com</ListItem>
                    <ListItem>Instagram: @arkya.store</ListItem>
                  </UnorderedList>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
