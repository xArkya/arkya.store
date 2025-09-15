import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useColorModeValue,
  Icon,
  Link,
  Flex,
  SimpleGrid,
  Card,
  CardBody,
  Divider,
} from '@chakra-ui/react';
import {
  FaInstagram,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaPaperPlane,
} from 'react-icons/fa';

export default function ContactPage() {
  
  // Color mode values
  const bgColor = useColorModeValue('gray.50', '#453641');
  const cardBg = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const headingColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  
  
  const contactInfo = [
    {
      icon: FaInstagram,
      title: 'Instagram',
      value: '@arkya.store',
      link: 'https://instagram.com/arkya.store',
      color: 'pink.500',
    },
    {
      icon: FaEnvelope,
      title: 'Email',
      value: 'arkya.store@gmail.com',
      link: 'mailto:arkya.store@gmail.com',
      color: 'blue.500',
    },
    {
      icon: FaMapMarkerAlt,
      title: 'Ubicación',
      value: 'Argentina',
      color: 'red.500',
    },
  ];
  
  return (
    <Box bg={bgColor} py={12}>
      <Container maxW="7xl">
        {/* Header */}
        <VStack spacing={6} textAlign="center" mb={12}>
          <Heading
            fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
            bgGradient="linear(to-r, brand.400, pink.400)"
            bgClip="text"
            fontWeight="bold"
          >
            Contáctanos
          </Heading>
          <Text
            fontSize={{ base: 'lg', md: 'xl' }}
            color={textColor}
            maxW="2xl"
            lineHeight="tall"
          >
            ¿Tienes alguna pregunta sobre nuestros productos? ¿Necesitas ayuda con tu pedido? 
            Estamos aquí para ayudarte. Contáctanos a través de cualquiera de estos medios.
          </Text>
        </VStack>
        
        <SimpleGrid columns={{ base: 1, lg: 1 }} spacing={12}>
          {/* Información de contacto */}
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading size="lg" mb={6} color={headingColor}>
                Información de Contacto
              </Heading>
              <VStack spacing={6} align="stretch">
                {contactInfo.map((info, index) => (
                  <Card key={index} bg={cardBg} borderColor={borderColor}>
                    <CardBody>
                      <HStack spacing={4}>
                        <Flex
                          w={12}
                          h={12}
                          align="center"
                          justify="center"
                          borderRadius="full"
                          bg={`${info.color.split('.')[0]}.50`}
                          color={info.color}
                        >
                          <Icon as={info.icon} boxSize={5} />
                        </Flex>
                        <Box flex={1}>
                          <Text fontWeight="semibold" color={headingColor} mb={1}>
                            {info.title}
                          </Text>
                          {info.link ? (
                            <Link
                              href={info.link}
                              isExternal
                              color={info.color}
                              _hover={{ textDecoration: 'underline' }}
                            >
                              {info.value}
                            </Link>
                          ) : (
                            <Text color={textColor}>{info.value}</Text>
                          )}
                        </Box>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </Box>
            
            {/* Horarios de atención */}
            <Card bg={cardBg} borderColor={borderColor}>
              <CardBody>
                <HStack spacing={4} mb={4}>
                  <Flex
                    w={12}
                    h={12}
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg="purple.50"
                    color="purple.500"
                  >
                    <Icon as={FaClock} boxSize={5} />
                  </Flex>
                  <Box>
                    <Text fontWeight="semibold" color={headingColor} mb={1}>
                      Horarios de Atención
                    </Text>

                  </Box>
                </HStack>
                <Divider mb={4} />
                <VStack spacing={2} align="stretch">
                  <HStack justify="space-between">
                    <Text color={textColor}>Siempre que tenga tiempo te voy a contestar</Text>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
