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
        answer: 'Puedes realizar un pedido navegando por nuestro catálogo, agregando productos al carrito y siguiendo el proceso de checkout o hablandome directamente por instagram @arkya.store'
      },
      {
        question: '¿Cuanto tardan en llegar desde Japón?',
        answer: 'Los libros suelen tardar 1-2 semanas, otras cosas tardan más de 1 mes'
      },
      {
        question: '¿Puedo modificar mi pedido después de realizarlo?',
        answer: 'Consulta en el momento y veremos que se puede hacer'
      },
      {
        question: '¿Recibiré confirmación de mi pedido?',
        answer: 'Sí, recibirás una confirmación después de realizar tu pedido, seguida de actualizaciones sobre el estado del envío.'
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
        answer: 'Depende del peso y tamaño del producto'
      },
      {
        question: '¿A donde envían?',
        answer: 'Enviamos a toda Argentina, tanto a sucursal como a domicilio'
      },
      {
        question: '¿Puedo rastrear mi pedido?',
        answer: 'Sí, recibirás un número de seguimiento una vez que tu pedido sea enviado. Puedes rastrearlo en tiempo real a través de la web de correo argentino'
      }
    ]
  },
  {
    icon: FaUndo,
    title: 'Devoluciones',
    color: 'orange.400',
    faqs: [
      {
        question: '¿Hay devoluciones?',
        answer: 'Solo se devuelve el dinero si el pedido llega mal desde Japón'
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
        answer: 'Aceptamos transferencia, MercadoPago, y efectivo'
      },
      {
        question: '¿Puedo pagar a plazos?',
        answer: 'Sí, podes pagar una parte del producto y la otra parte en otro momento, pero será enviado cuando pagues todo'
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
        answer: 'Puedes contactarnos por email (arkya.store@gmail.com) o por instagram @arkya.store'
      },
      {
        question: '¿Cuánto tiempo tardan en responder?',
        answer: 'Respondemos apenas podemos'
      },
      {
        question: '¿Tienen tienda física?',
        answer: 'Actualmente somos una tienda 100% online'
      }
    ]
  },
  {
    icon: FaHeadset,
    title: 'Productos',
    color: 'red.400',
    faqs: [
      {
        question: '¿Son originales?',
        answer: 'Si, todos vienen directamente de Japón'
      },
      {
        question: 'Son nuevos?',
        answer: 'La mayoría tienen un mínimo de uso pero están en perfecto estado, se puede ver en las fotos'
      }
    ]
  }
];

export default function FAQPage() {
  const bgColor = useColorModeValue('white', '#2a1c29');

  return (
    <Box bg="#453641" py={8}>
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
                <Text color="gray.400">
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
                            _hover={{ bg: '#453641' }}
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
                              color="gray.300" 
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

        </VStack>
      </Container>
    </Box>
  );
}
