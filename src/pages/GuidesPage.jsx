import { useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Badge,
  Flex,
  Image,
  Button,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
} from '@chakra-ui/react';
import {
  FaBookOpen,
  FaShippingFast,
  FaTag,
  FaBoxOpen,
  FaStar,
  FaArrowLeft,
  FaShoppingBag,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { SEO } from '../components/SEO';

const guides = [
  {
    id: 'artbooks',
    icon: FaBookOpen,
    title: 'Cómo elegir un Artbook',
    category: 'Compras',
    summary: 'Guía para entender las diferencias entre artbooks regulares, de edición limitada y de aniversario.',
    content: [
      {
        question: '¿Qué es un Artbook?',
        answer: 'Un artbook es un libro ilustrado que recopila arte conceptual, diseños de personajes, escenarios y material visual de animes, videojuegos o mangas. Generalmente son publicados por las propias compañías productoras y ofrecen una mirada detrás de cámaras del proceso creativo.',
      },
      {
        question: 'Edición Regular vs Edición Limitada',
        answer: 'La edición regular incluye el libro con todas las ilustraciones principales. La edición limitada puede incluir extras como postales, CDs, DVDs, señaladores, cartas, fundas exclusivas, o contenido adicional no disponible en la versión estándar.',
      },
      {
        question: '¿Cómo saber si es oficial?',
        answer: 'Los artbooks oficiales siempre llevan el sello de la editorial japonesa (Shueisha, Kadokawa, Square Enix, etc.) y suelen tener un código ISBN. En Arkya Store todos nuestros productos son importados directamente de Japón, garantizando su autenticidad.',
      },
    ],
  },
  {
    id: 'dojinshi',
    icon: FaStar,
    title: 'Todo sobre Dōjinshi',
    category: 'Productos',
    summary: 'Qué son, cómo se clasifican y qué tener en cuenta al comprar dōjinshi.',
    content: [
      {
        question: '¿Qué es un Dōjinshi?',
        answer: 'Son publicaciones amateur o independientes creadas por fanáticos o artistas emergentes en Japón. Pueden ser historias originales o derivadas (basadas en animes, mangas o videojuegos existentes). Se venden principalmente en eventos como Comiket.',
      },
      {
        question: '¿Por qué algunos son tan caros?',
        answer: 'El precio depende de varios factores: rareza (ediciones de eventos limitados), artista popular, calidad de impresión, y si incluye extras. Los dōjinshi de artistas reconocidos o de eventos pasados pueden aumentar su valor con el tiempo.',
      },
    ],
  },
  {
    id: 'precios',
    icon: FaTag,
    title: 'Entendiendo los Precios',
    category: 'Compras',
    summary: 'Cómo interpretar los precios, descuentos y qué incluye cada producto.',
    content: [
      {
        question: '¿Qué significa "(puede bajar o subir)" en productos sin stock?',
        answer: 'Los productos marcados como "fuera de stock" muestran un precio estimado basado en su último valor conocido. Al hacer un pedido especial, el precio final puede variar según la disponibilidad actual en Japón, el tipo de cambio y los costos de importación.',
      },
    ],
  },
  {
    id: 'cuidado',
    icon: FaBoxOpen,
    title: 'Cuidado y Conservación',
    category: 'Productos',
    summary: 'Consejos para mantener tus artbooks, mangas y figuras en perfecto estado.',
    content: [
      {
        question: '¿Cómo cuidar artbooks y mangas?',
        answer: 'Guardalos lejos de la luz solar directa para evitar decoloración. Usá fundas de plástico transparente (comic bags) para proteger las portadas. Evitá doblar las páginas y mantené una humedad controlada en el ambiente.',
      },
      {
        question: '¿Qué hacer con figuras de colección?',
        answer: 'Las figuras son sensibles al polvo y la luz UV. Limpiá el polvo regularmente con un pincel suave o aire comprimido. Usá vitrinas con puertas o al menos mantenlas en estantes cerrados. Evitá cambios bruscos de temperatura.',
      },
    ],
  },
];

export default function GuidesPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const bgColor = '#453641';
  const cardBg = '#2d1e2a';
  const textColor = 'white';
  const subTextColor = 'whiteAlpha.700';

  return (
    <Box minH="100vh" bg={bgColor} pt={8} pb={20}>
      <SEO
        title="Guías de Compra | Arkya Store"
        description="Aprendé todo sobre artbooks, dōjinshi, mangas y figuras. Guías prácticas para comprar productos importados de Japón."
      />
      <Container maxW="6xl">
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

        <VStack spacing={4} align="start" mb={12}>
          <Heading
            as="h1"
            color={textColor}
            fontSize={{ base: '2xl', md: '4xl' }}
            fontWeight={600}
          >
            Guías de Compra
          </Heading>
          <Text color={subTextColor} fontSize="lg" maxW="2xl">
            Todo lo que necesitás saber sobre nuestros productos, envíos y cómo hacer tu pedido. Si no encontrás tu duda, escribinos por Instagram.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={16}>
          {guides.map((guide) => (
            <VStack
              key={guide.id}
              as="button"
              onClick={() => {
                const el = document.getElementById(guide.id);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              bg={cardBg}
              borderRadius="xl"
              p={6}
              spacing={4}
              align="stretch"
              borderWidth="1px"
              borderColor="whiteAlpha.50"
              transition="all 0.3s"
              cursor="pointer"
              textAlign="left"
              _hover={{
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                borderColor: 'pink.400',
              }}
            >
              <Flex justify="space-between" align="center">
                <Box color="pink.400">
                  <guide.icon size={28} />
                </Box>
                <Badge colorScheme="purple" size="sm" borderRadius="full">
                  {guide.category}
                </Badge>
              </Flex>
              <Heading as="h3" fontSize="lg" color={textColor}>
                {guide.title}
              </Heading>
              <Text color={subTextColor} fontSize="sm" lineHeight="tall">
                {guide.summary}
              </Text>
            </VStack>
          ))}
        </SimpleGrid>

        <Divider borderColor="whiteAlpha.100" mb={12} />

        <VStack spacing={12} align="stretch">
          {guides.map((guide) => (
            <Box key={guide.id} id={guide.id}>
              <Flex align="center" gap={3} mb={4}>
                <Box color="pink.400">
                  <guide.icon size={24} />
                </Box>
                <Heading as="h2" fontSize="xl" color={textColor}>
                  {guide.title}
                </Heading>
                <Badge colorScheme="purple" size="sm">
                  {guide.category}
                </Badge>
              </Flex>
              <Accordion allowMultiple bg={cardBg} borderRadius="xl" overflow="hidden">
                {guide.content.map((item, idx) => (
                  <AccordionItem
                    key={idx}
                    borderColor="whiteAlpha.50"
                    _last={{ borderBottomWidth: 0 }}
                  >
                    <AccordionButton py={4} _hover={{ bg: 'whiteAlpha.50' }}>
                      <Box flex="1" textAlign="left" fontWeight="semibold" color={textColor}>
                        {item.question}
                      </Box>
                      <AccordionIcon color="pink.400" />
                    </AccordionButton>
                    <AccordionPanel pb={4} color={subTextColor} lineHeight="tall">
                      {item.answer}
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </Box>
          ))}
        </VStack>

        <Box
          mt={16}
          p={8}
          bg="linear-gradient(135deg, #453641 0%, #2d1e2a 100%)"
          borderRadius="xl"
          textAlign="center"
        >
          <VStack spacing={4}>
            <Text fontSize="xl" fontWeight="bold" color={textColor}>
              ¿Todavía tenés dudas?
            </Text>
            <Text color={subTextColor}>
              Escribinos directo por Instagram y te ayudamos con tu consulta personalizada.
            </Text>
            <Button
              as="a"
              href="https://instagram.com/arkya.store"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="pink"
              size="lg"
              leftIcon={<FaShoppingBag />}
            >
              Contactar por Instagram
            </Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
