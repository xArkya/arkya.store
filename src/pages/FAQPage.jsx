import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Card,
  CardBody,
  SimpleGrid,
  Icon,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { FaShoppingCart, FaTruck, FaUndo, FaCreditCard, FaHeadset, FaLock } from 'react-icons/fa';

const faqCategories = [
  {
    icon: FaShoppingCart,
    title: 'Pedidos',
    color: 'blue.400',
    faqs: [
      {
        question: '¿Cómo puedo realizar un pedido?',
        answer: 'Puedes realizar un pedido navegando por nuestro catálogo, agregando productos al carrito y siguiendo el proceso de checkout. Solo necesitas crear una cuenta o comprar como invitado.'
      },
      {
        question: '¿Puedo modificar mi pedido después de realizarlo?',
        answer: 'Puedes modificar tu pedido dentro de las primeras 2 horas después de realizarlo, siempre que no haya sido procesado aún. Contacta a nuestro servicio al cliente lo antes posible.'
      },
      {
        question: '¿Cómo puedo cancelar mi pedido?',
        answer: 'Puedes cancelar tu pedido sin costo dentro de las primeras 24 horas si aún no ha sido enviado. Después de este período, se aplicarán las políticas de devolución estándar.'
      },
      {
        question: '¿Recibiré confirmación de mi pedido?',
        answer: 'Sí, recibirás una confirmación por email inmediatamente después de realizar tu pedido, seguida de actualizaciones sobre el estado del envío.'
      }
    ]
  },
  {
    icon: FaTruck,
    title: 'Envíos',
    color: 'green.400',
    faqs: [
      {
        question: '¿Cuánto tiempo tarda en llegar mi pedido?',
        answer: 'Los tiempos de entrega varían según tu ubicación: 2-3 días laborables para envío express, 3-5 días para envío estándar, y 7-14 días para envíos internacionales.'
      },
      {
        question: '¿Cuáles son los costos de envío?',
        answer: 'El envío estándar cuesta 4.95€, el express 9.95€. ¡Envío gratuito para pedidos superiores a 50€! Los costos internacionales varían según el destino.'
      },
      {
        question: '¿Envían a mi país?',
        answer: 'Enviamos a toda España y la mayoría de países de la Unión Europea. Para otros destinos, contacta nuestro servicio al cliente para verificar disponibilidad.'
      },
      {
        question: '¿Puedo rastrear mi pedido?',
        answer: 'Sí, recibirás un número de seguimiento por email una vez que tu pedido sea enviado. Puedes rastrearlo en tiempo real a través de nuestro sitio web o el sitio del transportista.'
      },
      {
        question: '¿Qué pasa si no estoy en casa para recibir el paquete?',
        answer: 'El transportista dejará un aviso y intentará la entrega al día siguiente. También puedes solicitar la entrega en un punto de recogida cercano.'
      }
    ]
  },
  {
    icon: FaUndo,
    title: 'Devoluciones',
    color: 'orange.400',
    faqs: [
      {
        question: '¿Cuál es su política de devoluciones?',
        answer: 'Ofrecemos devoluciones gratuitas dentro de 30 días desde la recepción del producto. El artículo debe estar en condiciones originales con etiquetas.'
      },
      {
        question: '¿Cómo inicio una devolución?',
        answer: 'Puedes iniciar una devolución desde tu cuenta en "Mis Pedidos" o contactando nuestro servicio al cliente. Te proporcionaremos una etiqueta de envío gratuita.'
      },
      {
        question: '¿Cuánto tiempo tarda el reembolso?',
        answer: 'Los reembolsos se procesan dentro de 5-10 días laborables después de recibir y verificar el producto devuelto. El tiempo puede variar según tu método de pago.'
      },
      {
        question: '¿Puedo cambiar un producto por otra talla?',
        answer: 'Sí, ofrecemos cambios gratuitos por talla o color dentro de 30 días. El proceso es similar a una devolución pero más rápido.'
      },
      {
        question: '¿Qué productos no se pueden devolver?',
        answer: 'No se pueden devolver productos de higiene personal, ropa interior, productos personalizados, o artículos dañados por uso normal.'
      }
    ]
  },
  {
    icon: FaCreditCard,
    title: 'Pagos',
    color: 'purple.400',
    faqs: [
      {
        question: '¿Qué métodos de pago aceptan?',
        answer: 'Aceptamos tarjetas de crédito/débito (Visa, Mastercard, American Express), PayPal, transferencia bancaria, y pago contra reembolso (solo España peninsular).'
      },
      {
        question: '¿Es seguro pagar en su sitio web?',
        answer: 'Absolutamente. Utilizamos cifrado SSL de 256 bits y cumplimos con los estándares PCI DSS. Nunca almacenamos información de tarjetas de crédito en nuestros servidores.'
      },
      {
        question: '¿Puedo pagar a plazos?',
        answer: 'Sí, ofrecemos financiación a través de nuestros socios para compras superiores a 100€. Las opciones incluyen 3, 6, y 12 meses sin intereses.'
      },
      {
        question: '¿Cuándo se cobra mi tarjeta?',
        answer: 'Tu tarjeta se cobra inmediatamente después de confirmar el pedido. Para transferencias bancarias, tienes 48 horas para completar el pago.'
      },
      {
        question: '¿Emiten facturas?',
        answer: 'Sí, todas las compras incluyen factura electrónica que se envía por email. También puedes descargarla desde tu cuenta en cualquier momento.'
      }
    ]
  },
  {
    icon: FaHeadset,
    title: 'Atención al Cliente',
    color: 'pink.400',
    faqs: [
      {
        question: '¿Cómo puedo contactar atención al cliente?',
        answer: 'Puedes contactarnos por email (soporte@tienda.com), teléfono (+34 900 123 456), chat en vivo, o WhatsApp. Nuestro horario es L-V 9:00-18:00.'
      },
      {
        question: '¿En qué idiomas ofrecen soporte?',
        answer: 'Ofrecemos soporte en español, inglés, francés, y portugués. Nuestro equipo está capacitado para ayudarte en tu idioma preferido.'
      },
      {
        question: '¿Cuánto tiempo tardan en responder?',
        answer: 'Respondemos emails dentro de 24 horas, chat en vivo es inmediato durante horario laboral, y llamadas telefónicas se atienden al momento.'
      },
      {
        question: '¿Tienen tienda física?',
        answer: 'Actualmente somos una tienda 100% online, pero estamos considerando abrir showrooms en principales ciudades. ¡Mantente atento a nuestras novedades!'
      }
    ]
  },
  {
    icon: FaLock,
    title: 'Cuenta y Seguridad',
    color: 'red.400',
    faqs: [
      {
        question: '¿Necesito crear una cuenta para comprar?',
        answer: 'No es obligatorio, puedes comprar como invitado. Sin embargo, crear una cuenta te permite rastrear pedidos, guardar direcciones, y acceder a ofertas exclusivas.'
      },
      {
        question: '¿Cómo cambio mi contraseña?',
        answer: 'Puedes cambiar tu contraseña desde "Mi Cuenta" > "Configuración" o usar la opción "Olvidé mi contraseña" en el login para recibir un enlace de restablecimiento.'
      },
      {
        question: '¿Cómo actualizo mi información personal?',
        answer: 'Inicia sesión en tu cuenta y ve a "Mi Perfil" donde puedes actualizar tu información personal, direcciones de envío, y preferencias de comunicación.'
      },
      {
        question: '¿Puedo eliminar mi cuenta?',
        answer: 'Sí, puedes solicitar la eliminación de tu cuenta contactando nuestro servicio al cliente. Ten en cuenta que esto eliminará tu historial de pedidos permanentemente.'
      },
      {
        question: '¿Cómo protegen mis datos personales?',
        answer: 'Cumplimos con GDPR y utilizamos cifrado avanzado. Nunca compartimos tus datos con terceros sin consentimiento, excepto para procesar pedidos y envíos.'
      }
    ]
  }
];

export default function FAQPage() {
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box bg="#453641" minH="100vh" py={8}>
      <Container maxW="6xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Heading 
              size="2xl" 
              color="white"
              bgGradient="linear(to-r, pink.400, purple.500)"
              bgClip="text"
            >
              Preguntas Frecuentes
            </Heading>
            <Text fontSize="xl" color="gray.300" maxW="3xl">
              Encuentra respuestas rápidas a las preguntas más comunes sobre 
              nuestros productos, envíos, devoluciones y más.
            </Text>
          </VStack>

          {/* Quick Contact */}
          <Card bg={bgColor}>
            <CardBody textAlign="center">
              <VStack spacing={3}>
                <Icon as={FaHeadset} boxSize={8} color="purple.400" />
                <Heading size="md">¿No encuentras lo que buscas?</Heading>
                <Text color="gray.600">
                  Nuestro equipo de atención al cliente está aquí para ayudarte
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  <Badge colorScheme="purple" p={2}>
                    arkya.store@gmail.com
                  </Badge>
                  <Badge colorScheme="blue" p={2}>
                    @arkya.store
                  </Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* FAQ Categories */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
            {faqCategories.map((category, categoryIndex) => (
              <Card key={categoryIndex} bg={bgColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    {/* Category Header */}
                    <HStack spacing={3}>
                      <Icon as={category.icon} boxSize={6} color={category.color} />
                      <Heading size="md" color={category.color}>
                        {category.title}
                      </Heading>
                    </HStack>

                    {/* FAQ Accordion */}
                    <Accordion allowMultiple>
                      {category.faqs.map((faq, faqIndex) => (
                        <AccordionItem key={faqIndex} border="none">
                          <AccordionButton
                            _hover={{ bg: 'gray.50' }}
                            borderRadius="md"
                            px={0}
                          >
                            <Box flex="1" textAlign="left">
                              <Text fontWeight="semibold" fontSize="sm">
                                {faq.question}
                              </Text>
                            </Box>
                            <AccordionIcon color={category.color} />
                          </AccordionButton>
                          <AccordionPanel px={0} pb={4}>
                            <Text 
                              color="gray.600" 
                              fontSize="sm" 
                              lineHeight="tall"
                            >
                              {faq.answer}
                            </Text>
                          </AccordionPanel>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Additional Help */}
          <Card bg="purple.500">
            <CardBody textAlign="center">
              <VStack spacing={4}>
                <Icon as={FaHeadset} boxSize={10} color="white" />
                <Heading size="lg" color="white">
                  ¿Necesitas Ayuda Personalizada?
                </Heading>
                <Text color="purple.100" maxW="2xl">
                  Si no has encontrado la respuesta que buscas, nuestro equipo 
                  de expertos está disponible para brindarte asistencia personalizada.
                </Text>
                <VStack spacing={2}>
                  <Text color="white" fontWeight="semibold">
                    Horarios de Atención:
                  </Text>
                  <Text color="purple.100" fontSize="sm">
                    Lunes a Viernes: 9:00 - 18:00 CET
                  </Text>
                  <Text color="purple.100" fontSize="sm">
                    Sábados: 10:00 - 14:00 CET
                  </Text>
                  <Text color="purple.100" fontSize="sm">
                    Domingos: Cerrado
                  </Text>
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
