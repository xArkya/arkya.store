import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useCart } from '../context/useCart';
import { useAgeVerification } from '../context/useAgeVerification.js';
import {
  Box,
  Container,
  Stack,
  Text,
  Image,
  Flex,
  VStack,
  Button,
  Heading,
  SimpleGrid,
  StackDivider,
  useColorModeValue,
  List,
  ListItem,
  ListIcon,
  Badge,
  Icon,
  Skeleton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Center,
} from '@chakra-ui/react';
import { FaInstagram, FaArrowLeft, FaHeart, FaShoppingBag, FaHome, FaStar, FaCheck, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaClipboard, FaCheckCircle } from 'react-icons/fa';
import { products } from '../data/products';
import { offers } from '../data/offers';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Usar el contexto global de verificación de edad
  const { isAgeVerified, verifyAge } = useAgeVerification();
  
  // Color mode values - definidos al inicio para evitar errores de hooks
  const modalTextColorLight = useColorModeValue('gray.600', 'gray.300');
  const modalTextColorDark = useColorModeValue('gray.600', 'gray.400');
  const modalBoxBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const modalBoxBorder = useColorModeValue('gray.200', 'whiteAlpha.200');
  const modalInnerBoxBg = useColorModeValue('white', 'gray.800');
  const scrollbarTrackBg = useColorModeValue('white', '#1a202c');
  const scrollbarThumbBg = useColorModeValue('#cbd5e0', '#4a5568');
  const scrollbarThumbHoverBg = useColorModeValue('#a0aec0', '#718096');
  
  const toast = useToast();
  // Modal para compra por Instagram
  const { isOpen: isInstagramOpen, onOpen: onInstagramOpen, onClose: onInstagramClose } = useDisclosure();
  // Modal para consulta por Instagram (para productos sin stock)
  const { isOpen: isConsultOpen, onOpen: onConsultOpen, onClose: onConsultClose } = useDisclosure();
  // Modal para verificación de edad
  const { isOpen: isAgeModalOpen, onOpen: onAgeModalOpen, onClose: onAgeModalClose } = useDisclosure();
  const { addToCart } = useCart();
  
  // Define all color mode values at the top level
  const textColor = useColorModeValue('gray.900', 'gray.400');
  const dividerColor = useColorModeValue('gray.200', 'gray.600');
  const descriptionColor = useColorModeValue('gray.500', 'gray.400');
  const likeBtnBg = useColorModeValue('gray.900', 'gray.50');
  const likeBtnColor = useColorModeValue('white', 'gray.900');
  const instaBtnBg = useColorModeValue('brand.500', 'brand.400');
  const instaBtnHoverBg = useColorModeValue('brand.600', 'brand.500');
  const modalBgColor = useColorModeValue('white', '#241521');
  const modalHeaderColor = useColorModeValue('gray.00', 'white');
  const modalBoxBgColor = useColorModeValue('gray.100', 'whiteAlpha.100');
  
  // Nuevos valores de color para el diseño mejorado
  const pageBgColor = useColorModeValue('gray.50', '#453641');
  const productCardBgColor = useColorModeValue('#241521', '#241521');

  useEffect(() => {
    // Scroll al top de la página cuando se carga el producto
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Simulate loading
    const timer = setTimeout(() => {
      try {
        // Parse the ID properly, ensuring it's a number
        const numericId = parseInt(id, 10);
        
        if (isNaN(numericId)) {
          throw new Error(`ID inválido: ${id}`);
        }
        
        // Add console log for debugging
        console.log('Product ID requested:', numericId);
        console.log('Available products:', products.map(p => p.id));
        
        let foundProduct = products.find(p => p.id === numericId);
        
        if (!foundProduct) {
          throw new Error(`Producto con ID ${numericId} no encontrado`);
        }
        
        // Verificar si hay ofertas globales activas
        const globalOffer = offers.find(offer => 
          offer.isActive && 
          offer.isGlobal && 
          offer.discountType === 'percentage'
        );
        
        // Si el producto no tiene oferta específica pero hay una oferta global, aplicarla
        if (!foundProduct.isOnOffer && globalOffer) {
          foundProduct = {
            ...foundProduct,
            isOnOffer: true,
            discountPercentage: globalOffer.discountPercentage,
            originalPrice: foundProduct.price,
            price: Math.round(foundProduct.price * (1 - globalOffer.discountPercentage / 100))
          };
        }
        
        console.log('Found product with offers applied:', foundProduct);
        console.log('Product inStock value:', foundProduct.inStock);
        setProduct(foundProduct);
        
        // Si el producto es para adultos y el usuario no ha verificado su edad, mostrar modal
        if (foundProduct.adultContent && !isAgeVerified) {
          onAgeModalOpen();
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [id, isAgeVerified, onAgeModalOpen]);

  if (loading) {
    return (
      <Container maxW={'7xl'} py={12}>
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 8, md: 10 }}>
          <Skeleton height="400px" />
          <Stack spacing={{ base: 6, md: 10 }}>
            <Skeleton height="40px" width="70%" />
            <Skeleton height="30px" width="40%" />
            <Skeleton height="20px" width="30%" />
            <Skeleton height="100px" />
            <Skeleton height="50px" />
          </Stack>
        </SimpleGrid>
      </Container>
    );
  }

  if (!loading && (error || !product)) {
    return (
      <Container maxW={'7xl'} py={12}>
        <VStack spacing={4} align="center">
          <Heading>Producto no encontrado</Heading>
          <Text>{error || 'Lo sentimos, el producto que buscas no existe.'}</Text>
          <Text fontSize="sm" color="gray.500">
            URL actual: /product/{id}
          </Text>
          <Button 
            as={RouterLink} 
            to="/" 
            leftIcon={<FaArrowLeft />} 
            colorScheme="brand"
            onClick={() => {
              // Restaurar la página anterior al volver a la tienda
              const lastPage = sessionStorage.getItem('lastViewedPage');
              if (lastPage) {
                sessionStorage.setItem('currentPage', lastPage);
              }
            }}
          >
            Volver a la tienda
          </Button>
        </VStack>
      </Container>
    );
  }

  // Función para confirmar edad
  const handleConfirmAge = () => {
    verifyAge();
    onAgeModalClose();
  };
  
  // Función para copiar el mensaje y abrir Instagram
  const handleCopyAndOpenInstagram = () => {
    try {
      const message = `👋 Hola! Me interesa el siguiente producto:\n📦 ${product.name}\n💰 $${Math.floor(product.price).toLocaleString()}`;
      
      // Usar la API moderna de Clipboard
      navigator.clipboard.writeText(message)
        .then(() => {
          // Mostrar notificación de éxito
          toast({
            title: "¡Mensaje copiado!",
            description: "El mensaje ha sido copiado. Pégalo en el chat de Instagram.",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
          
          // Cerrar modal
          onInstagramClose();
          
          // Abrir Instagram después de un breve retraso
          setTimeout(() => {
            window.open("https://ig.me/m/arkya.store", "_blank");
          }, 500);
        })
        .catch(err => {
          console.error('Error al copiar con Clipboard API:', err);
          // Fallback al método antiguo si la API moderna falla
          const textArea = document.createElement("textarea");
          textArea.value = message;
          textArea.style.position = "fixed";
          textArea.style.opacity = "0";
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          toast({
            title: "¡Mensaje copiado!",
            description: `"${message}" ha sido copiado. Pégalo en el chat de Instagram.`,
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "top"
          });
          
          onInstagramClose();
          
          setTimeout(() => {
            window.open("https://ig.me/m/arkya.store", "_blank");
          }, 500);
        });
    } catch (err) {
      console.error('Error al copiar:', err);
      toast({
        title: "Error",
        description: "No se pudo copiar el mensaje. Por favor, inténtalo de nuevo.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
    }
  };

  // Las variables de color del modal ya están definidas al inicio del componente

  return (
    <Box bg={pageBgColor}>
      {/* Modal de verificación de edad */}
      <Modal isOpen={isAgeModalOpen} onClose={() => {}} isCentered size="md" closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(12px)" />
        <ModalContent 
          bg="#241521" 
          color="white" 
          borderRadius="xl" 
          borderWidth="2px" 
          borderColor="red.500"
          overflow="hidden"
          mx={4}
        >
          <ModalHeader 
            bg="linear-gradient(135deg, #DC2626 0%, #991B1B 100%)" 
            textAlign="center"
            py={4}
            fontSize={{ base: 'lg', md: 'xl' }}
            fontWeight="bold"
          >
            VERIFICACIÓN DE EDAD
          </ModalHeader>
          
          <ModalBody py={8} px={6}>
            <VStack spacing={6} align="center">
              <Box position="relative">
                <Box
                  bg="yellow.500"
                  borderRadius="full"
                  p={6}
                  boxShadow="0 0 30px rgba(251, 191, 36, 0.4)"
                >
                  <Icon as={FaExclamationTriangle} boxSize="3em" color="#1A1A1A" />
                </Box>
                <Box 
                  position="absolute" 
                  top="-5px" 
                  right="-5px" 
                  bg="red.600" 
                  color="white" 
                  borderRadius="full" 
                  width="40px" 
                  height="40px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  fontSize="lg"
                  border="3px solid #241521"
                  boxShadow="lg"
                >
                  18+
                </Box>
              </Box>
              
              <VStack spacing={3}>
                <Text fontSize={{ base: 'md', md: 'lg' }} textAlign="center" color="gray.200">
                  Este producto contiene contenido exclusivo para adultos.
                </Text>
                <Text fontWeight="bold" fontSize={{ base: 'xl', md: '2xl' }} textAlign="center">
                  ¿Confirmas que eres mayor de 18 años?
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center" px={4}>
                  Al confirmar, declaras que tienes la edad legal para ver este contenido.
                </Text>
              </VStack>
            </VStack>
          </ModalBody>

          <ModalFooter 
            justifyContent="center" 
            pb={6}
            px={6}
          >
            <Button
              colorScheme="green"
              onClick={handleConfirmAge}
              size="lg"
              width="full"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
            >
              Sí, soy mayor de 18
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de instrucciones para comprar por Instagram */}
      <Modal isOpen={isInstagramOpen} onClose={onInstagramClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="lg" boxShadow="xl" mx={4}>
          <ModalHeader fontSize="2xl" fontWeight="bold" pb={2} color={modalHeaderColor}>
            🛍️ Comprar por Instagram
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              <Text fontSize="md" color={modalTextColorLight}>
                Para comprar este producto a través de Instagram, sigue estos sencillos pasos:
              </Text>
              
              <List spacing={4}>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaClipboard} color="brand.500" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 1: Copiar mensaje</Text>
                    <Text fontSize="sm" color={modalTextColorDark}>
                      Al hacer clic en el botón, el mensaje con el producto se copiará automáticamente.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaInstagram} color="brand.500" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 2: Abrir Instagram</Text>
                    <Text fontSize="sm" color={modalTextColorDark}>
                      Se abrirá automáticamente el chat de @arkya.store en una nueva pestaña.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCheckCircle} color="brand.500" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 3: Pegar y enviar</Text>
                    <Text fontSize="sm" color={modalTextColorDark}>
                      Pega el mensaje en el chat (Ctrl+V en PC o Cmd+V en MAC) y envíalo para completar tu pedido.
                    </Text>
                  </Box>
                </ListItem>
              </List>
              
              <Box 
                bg={modalBoxBg} 
                p={4} 
                borderRadius="lg" 
                borderWidth="1px"
                borderColor={modalBoxBorder}
              >
                <Text fontWeight="bold" mb={3} fontSize="md" color="brand.500">
                  📋 Vista previa del mensaje:
                </Text>
                <Box 
                  bg={modalInnerBoxBg} 
                  p={3} 
                  borderRadius="md"
                  fontSize="sm"
                  fontFamily="monospace"
                  whiteSpace="pre-wrap"
                  maxH="200px"
                  overflowY="auto"
                  css={{
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: scrollbarTrackBg,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: scrollbarThumbBg,
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: scrollbarThumbHoverBg,
                    },
                  }}
                >
                  👋 Hola! Me interesa el siguiente producto:
📦 {product?.name}
💰 ${Math.floor(product?.price).toLocaleString()}
                </Box>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter gap={3}>
            <Button
              colorScheme="brand"
              size="lg"
              leftIcon={<FaInstagram />}
              onClick={handleCopyAndOpenInstagram}
              flex={1}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'xl',
              }}
            >
              Copiar y abrir Instagram
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={onInstagramClose}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de consulta por Instagram para productos sin stock */}
      <Modal isOpen={isConsultOpen} onClose={onConsultClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg={modalBgColor} borderRadius="lg" boxShadow="xl">
          <ModalHeader color={modalHeaderColor} borderBottomWidth="1px" borderColor={dividerColor}>
            <Flex align="center" gap={2}>
              <Icon as={FaInstagram} />
              <Text>Consultar por Instagram</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <VStack spacing={4} align="start">
              <Text>
                Para consultar sobre este producto a través de Instagram, sigue estos pasos:
              </Text>
              <List spacing={3}>
                <ListItem display="flex" alignItems="center">
                  <Badge mr={2} colorScheme="brand" fontSize="sm" borderRadius="full" px={2}>1</Badge>
                  <Text>Haz clic en "Copiar y abrir Instagram"</Text>
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Badge mr={2} colorScheme="brand" fontSize="sm" borderRadius="full" px={2}>2</Badge>
                  <Text>Se copiará automáticamente un mensaje con el nombre del producto</Text>
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Badge mr={2} colorScheme="brand" fontSize="sm" borderRadius="full" px={2}>3</Badge>
                  <Text>Se abrirá Instagram en una nueva pestaña</Text>
                </ListItem>
                <ListItem display="flex" alignItems="center">
                  <Badge mr={2} colorScheme="brand" fontSize="sm" borderRadius="full" px={2}>4</Badge>
                  <Text>Pega el mensaje (Ctrl+V en PC o Cmd+V en MAC) en el chat</Text>
                </ListItem>
              </List>
              <Text fontWeight="bold" mt={2}>
                Mensaje que se copiará:
              </Text>
              <Box
                p={4}
                bg={modalBoxBgColor}
                borderRadius="md"
                width="100%"
                borderLeft="4px solid"
                borderColor="brand.500">
                <Text fontStyle="italic">
                  Hola, me interesa el producto: {product?.name} (actualmente sin stock)
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={dividerColor}>
            <Button
              colorScheme="brand"
              mr={3}
              leftIcon={<FaInstagram />}
              onClick={() => {
                try {
                  const message = `Hola, me interesa el producto: ${product.name} (actualmente sin stock)`;
                  
                  // Usar la API moderna de Clipboard
                  navigator.clipboard.writeText(message)
                    .then(() => {
                      // Mostrar notificación de éxito
                      toast({
                        title: "\u00a1Mensaje copiado!",
                        description: `"${message}" ha sido copiado. Pégalo en el chat de Instagram.`,
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                        position: "top"
                      });
                      
                      // Cerrar modal
                      onConsultClose();
                      
                      // Abrir Instagram después de un breve retraso
                      setTimeout(() => {
                        window.open("https://ig.me/m/arkya.store", "_blank");
                      }, 500);
                    })
                    .catch(err => {
                      console.error('Error al copiar con Clipboard API:', err);
                      // Fallback al método antiguo si la API moderna falla
                      const textArea = document.createElement("textarea");
                      textArea.value = message;
                      textArea.style.position = "fixed";
                      textArea.style.opacity = "0";
                      document.body.appendChild(textArea);
                      textArea.select();
                      document.execCommand('copy');
                      document.body.removeChild(textArea);
                      
                      toast({
                        title: "\u00a1Mensaje copiado!",
                        description: `"${message}" ha sido copiado. Pégalo en el chat de Instagram.`,
                        status: "success",
                        duration: 5000,
                        isClosable: true,
                        position: "top"
                      });
                      
                      onConsultClose();
                      
                      setTimeout(() => {
                        window.open("https://ig.me/m/arkya.store", "_blank");
                      }, 500);
                    });
                } catch (err) {
                  console.error('Error al copiar:', err);
                  toast({
                    title: "Error",
                    description: "No se pudo copiar el mensaje. Por favor, inténtalo de nuevo.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                    position: "top"
                  });
                }
              }}
              size="lg"
              borderRadius="md"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}>
              Copiar y abrir Instagram
            </Button>
            <Button variant="ghost" onClick={onConsultClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Container maxW={'7xl'} py={8}>
        {/* Botón de volver */}
        <Flex mb={6}>
          <Button
            as={RouterLink}
            to="/"
            leftIcon={<FaArrowLeft />}
            size={{ base: 'sm', md: 'md' }}
            colorScheme="brand"
            variant="outline"
            onClick={() => {
              // Restaurar la página anterior al volver a la tienda
              const lastPage = sessionStorage.getItem('lastViewedPage');
              if (lastPage) {
                sessionStorage.setItem('currentPage', lastPage);
              }
            }}
          >
            Volver a la tienda
          </Button>
        </Flex>

        <SimpleGrid 
          columns={{ base: 1, lg: 2 }} 
          spacing={{ base: 8, md: 10 }}
          justifyItems={{ base: 'center', md: 'start' }}
          bg={productCardBgColor}
          p={{ base: 4, md: 8 }}
          borderRadius="xl"
          boxShadow="lg"
          overflow="hidden">
          
          {/* Carrusel de imágenes del producto */}
          <VStack spacing={4}>
            {/* Imagen principal */}
            <Box position="relative" overflow="hidden" borderRadius="lg" w="100%">
              {product.isNew && (
                <Badge
                  position="absolute"
                  top={4}
                  right={4}
                  rounded="full"
                  px={3}
                  py={1}
                  fontSize="0.9em"
                  colorScheme="brand"
                  boxShadow="md"
                  zIndex="2"
                >
                  Nuevo
                </Badge>
              )}
              
              {(() => {
                // Usar images si existe, sino usar image como fallback
                const productImages = product.images && product.images.length > 0 
                  ? product.images.filter(img => img.trim() !== '') 
                  : [product.image];
                const currentImage = productImages[currentImageIndex] || product.image;
                
                // Funciones del carrusel
                const nextImage = () => {
                  setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
                };
                
                const prevImage = () => {
                  setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
                };
                
                return (
                  <>
                      <Image
                        alt={product.name}
                        src={currentImage}
                        fit={'cover'}
                        align={'center'}
                        w={'100%'}
                        h={{ base: '400px', sm: '500px', lg: '600px' }}
                        transition="transform 0.5s"
                        _hover={{ transform: 'scale(1.03)' }}
                        filter={product.adultContent && !isAgeVerified ? 'blur(15px) grayscale(0.5)' : 'none'}
                        loading="lazy"
                        decoding="async"
                      />
                      
                      {/* Overlay para contenido adulto */}
                      {product.adultContent && !isAgeVerified && (
                        <Center
                          position="absolute"
                          top="0"
                          left="0"
                          right="0"
                          bottom="0"
                          bg="blackAlpha.700"
                          zIndex="3"
                          flexDirection="column"
                          p={4}
                        >
                          <Icon as={FaExclamationTriangle} color="red.500" boxSize="50px" mb={4} />
                          <Text color="white" fontWeight="bold" fontSize="xl" textAlign="center" mb={2}>
                            Contenido para adultos (+18)
                          </Text>
                          <Text color="white" textAlign="center" mb={4}>
                            Este producto contiene contenido para adultos.
                          </Text>
                          <Button
                            colorScheme="red"
                            onClick={handleConfirmAge}
                            size="lg"
                            width="200px"
                            borderRadius="md"
                          >
                            Confirmar edad
                          </Button>
                        </Center>
                      )}
                    
                    {/* Controles del carrusel - solo mostrar si hay más de una imagen */}
                    {productImages.length > 1 && (
                      <>
                        <Button
                          position="absolute"
                          left="4"
                          top="50%"
                          transform="translateY(-50%)"
                          size="lg"
                          colorScheme="whiteAlpha"
                          bg="blackAlpha.600"
                          color="white"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={prevImage}
                          zIndex={2}
                          borderRadius="full"
                        >
                          <FaChevronLeft />
                        </Button>
                        <Button
                          position="absolute"
                          right="4"
                          top="50%"
                          transform="translateY(-50%)"
                          size="lg"
                          colorScheme="whiteAlpha"
                          bg="blackAlpha.600"
                          color="white"
                          _hover={{ bg: 'blackAlpha.800' }}
                          onClick={nextImage}
                          zIndex={2}
                          borderRadius="full"
                        >
                          <FaChevronRight />
                        </Button>
                        
                        {/* Indicadores de imagen */}
                        <Flex
                          position="absolute"
                          bottom="4"
                          left="50%"
                          transform="translateX(-50%)"
                          gap={2}
                          zIndex={2}
                        >
                          {productImages.map((_, index) => (
                            <Box
                              key={index}
                              w="12px"
                              h="12px"
                              borderRadius="full"
                              bg={index === currentImageIndex ? 'white' : 'whiteAlpha.500'}
                              cursor="pointer"
                              onClick={() => setCurrentImageIndex(index)}
                              transition="all 0.2s"
                              _hover={{ bg: 'white' }}
                            />
                          ))}
                        </Flex>
                      </>
                    )}
                  </>
                );
              })()}
            </Box>
            
            {/* Miniaturas de imágenes */}
            {(() => {
              const productImages = product.images && product.images.length > 0 
                ? product.images.filter(img => img.trim() !== '') 
                : [product.image];
              
              return productImages.length > 1 && (
                <Flex gap={2} overflowX="auto" overflowY="hidden" w="100%" justify="center" maxW="100%">
                  {productImages.map((img, index) => (
                    <Box
                      key={index}
                      cursor="pointer"
                      onClick={() => setCurrentImageIndex(index)}
                      borderRadius="md"
                      overflow="hidden"
                      border={index === currentImageIndex ? '3px solid' : '2px solid transparent'}
                      borderColor={index === currentImageIndex ? 'brand.500' : 'transparent'}
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                      flexShrink={0}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} - imagen ${index + 1}`}
                        w="80px"
                        h="80px"
                        objectFit="cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </Box>
                  ))}
                </Flex>
              );
            })()}
          </VStack>
          
          {/* Información del producto con diseño mejorado */}
          <Stack>
            <Box as={'header'}>
              <Heading
                lineHeight={1.1}
                fontWeight={600}
                fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                bgGradient="linear(to-r, brand.400, pink.400)"
                bgClip="text">
                {product.name}
              </Heading>
              <VStack align="start" spacing={2} width="100%">
                {product.isOnOffer ? (
                  <>
                    <Flex align="baseline" width="100%">
                      <Text
                        color="red.500"
                        fontWeight={500}
                        fontSize={'3xl'}
                        letterSpacing="tight">
                        ${parseInt(product.price)}
                      </Text>
                      <Text
                        color={textColor}
                        fontWeight={400}
                        textDecoration="line-through"
                        fontSize={'xl'}
                        ml={2}>
                        ${parseInt(product.originalPrice)}
                      </Text>
                      {!product.inStock && (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic" ml={2}>
                          (puede variar)
                        </Text>
                      )}
                    </Flex>
                    <Flex width="100%">
                      <Badge colorScheme="red" variant="solid" px={2} py={1} borderRadius="md" mr={2}>
                        {product.discountPercentage}% OFF
                      </Badge>
                      <Badge colorScheme={product.inStock ? "green" : "red"} variant="solid" px={2} py={1} borderRadius="md">
                        {product.inStock ? "DISPONIBLE" : "SIN STOCK"}
                      </Badge>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Flex align="baseline" width="100%">
                      <Text
                        color={textColor}
                        fontWeight={500}
                        fontSize={'3xl'}
                        letterSpacing="tight">
                        ${parseInt(product.price)}
                      </Text>
                      {!product.inStock && (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic" ml={2}>
                          (puede variar)
                        </Text>
                      )}
                    </Flex>
                    <Badge colorScheme={product.inStock ? "green" : "red"} variant="solid" px={2} py={1} borderRadius="md">
                      {product.inStock ? "DISPONIBLE" : "SIN STOCK"}
                    </Badge>
                  </>
                )}
              </VStack>
            </Box>

            <Stack
              spacing={{ base: 6, sm: 8 }}
              direction={'column'}
              divider={
                <StackDivider
                  borderColor={dividerColor}
                />
              }>
              <VStack spacing={{ base: 4, sm: 6 }} align="start">
                <Text 
                  fontSize={'lg'}
                  lineHeight="tall"
                  fontWeight="medium"
                  whiteSpace="pre-line">
                  {product.details || product.description}
                </Text>
                
                {/* Mostrar categorías del producto */}
                <Box>
                  <Text fontWeight="bold" mb={2}>Categorías:</Text>
                  <Flex gap={2} flexWrap="wrap">
                    {product.categories && product.categories.length > 0 ? (
                      product.categories.map((cat, index) => (
                        <Badge 
                          key={index} 
                          colorScheme="brand" 
                          variant="solid" 
                          px={2} 
                          py={1} 
                          borderRadius="md"
                        >
                          {cat}
                        </Badge>
                      ))
                    ) : (
                      <Badge 
                        colorScheme="brand" 
                        variant="solid" 
                        px={2} 
                        py={1} 
                        borderRadius="md"
                      >
                        {product.category}
                      </Badge>
                    )}
                  </Flex>
                </Box>
                
                <Text
                  fontSize={'md'}
                  color={descriptionColor}
                  lineHeight="tall">
                </Text>
              </VStack>
              
            </Stack>

            {/* Botones de acción con diseño mejorado */}
            <VStack spacing={4} >


              <Button
                rounded={'md'}
                size={'lg'}
                py={'7'}
                colorScheme={product.inStock ? "green" : "brand"}
                fontWeight="bold"
                w="full"
                bg={product.inStock ? likeBtnBg : instaBtnBg}
                color={product.inStock ? likeBtnColor : 'white'}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'xl',
                  bg: product.inStock ? undefined : instaBtnHoverBg,
                }}
                onClick={() => {
                  if (product.inStock) {
                    // Funcionalidad normal de agregar al carrito
                    const added = addToCart(product);
                    
                    if (added) {
                      // Si se agregó correctamente
                      toast({
                        title: "¡Producto agregado!",
                        description: `${product.name} se ha añadido al carrito.`,
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                        position: "top"
                      });
                    } else {
                      // Si el producto ya estaba en el carrito
                      toast({
                        title: "Producto ya en carrito",
                        description: `${product.name} ya está en tu carrito.`,
                        status: "info",
                        duration: 3000,
                        isClosable: true,
                        position: "top"
                      });
                    }
                  } else {
                    // Abrir modal de consulta por Instagram
                    onConsultOpen();
                  }
                }}
                leftIcon={product.inStock ? <FaShoppingBag /> : <FaInstagram />}>
                {product.inStock ? "Agregar al carrito" : "Consultar por Instagram"}
              </Button>

              {/* Mostrar el botón de comprar por Instagram solo si el producto tiene stock */}
              {product.inStock && (
                <Button
                  onClick={onInstagramOpen}
                  rounded={'md'}
                  size={'lg'}
                  py={'7'}
                  bg={instaBtnBg}
                  color={'white'}
                  fontWeight="bold"
                  w="full"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
                    bg: instaBtnHoverBg,
                  }}
                  leftIcon={<FaInstagram size={20} />}>
                  Comprar por Instagram
                </Button>
              )}
            </VStack>
          </Stack>
        </SimpleGrid>

        {/* Sección de Productos Similares */}
        {(() => {
          // Función para calcular similitud entre dos strings
          const calculateSimilarity = (str1, str2) => {
            const s1 = str1.toLowerCase();
            const s2 = str2.toLowerCase();
            
            // Eliminar caracteres especiales y normalizar
            const normalize = (str) => str.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
            const n1 = normalize(s1);
            const n2 = normalize(s2);
            
            // Palabras a ignorar
            const stopWords = ['vol', 'de', 'la', 'el', 'en', 'y', 'a', 'con', 'edicion', 'limitada', 'especial'];
            
            const words1 = n1.split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
            const words2 = n2.split(' ').filter(w => w.length > 2 && !stopWords.includes(w));
            
            if (words1.length === 0 || words2.length === 0) return 0;
            
            let matches = 0;
            
            // Contar coincidencias exactas
            words1.forEach(word => {
              if (words2.includes(word)) {
                matches += 1;
              }
            });
            
            // Retornar el ratio de coincidencias
            return matches / Math.min(words1.length, words2.length);
          };

          // Primero, calcular similitud para TODOS los productos (sin filtrar por categoría)
          const allProductsWithScore = products
            .filter(p => p.id !== product.id) // Solo excluir el producto actual
            .map(p => {
              let score = 0;
              
              // Similitud en el nombre (peso: 5 - más importante)
              const nameSimilarity = calculateSimilarity(product.name, p.name);
              score += nameSimilarity * 5;
              
              // Similitud en tags (peso: 2)
              // Comparar tags entre sí
              if (product.tags && p.tags && product.tags.length > 0 && p.tags.length > 0) {
                const commonTags = product.tags.filter(tag => 
                  p.tags.some(pTag => pTag.toLowerCase() === tag.toLowerCase())
                );
                score += (commonTags.length / Math.max(product.tags.length, p.tags.length)) * 2;
              }
              
              // Buscar palabras del nombre en los tags del otro producto (peso: 3)
              const productNameWords = product.name.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['vol', 'de', 'la', 'el', 'en', 'y', 'a', 'con', 'edicion', 'limitada', 'especial'].includes(w));
              
              if (p.tags && p.tags.length > 0) {
                const nameInTags = productNameWords.some(word =>
                  p.tags.some(tag => tag.toLowerCase().includes(word))
                );
                if (nameInTags) {
                  score += 3;
                }
              }
              
              // Buscar palabras del nombre del otro producto en los tags de este (peso: 3)
              const pNameWords = p.name.toLowerCase()
                .replace(/[^\w\s]/g, ' ')
                .split(/\s+/)
                .filter(w => w.length > 3 && !['vol', 'de', 'la', 'el', 'en', 'y', 'a', 'con', 'edicion', 'limitada', 'especial'].includes(w));
              
              if (product.tags && product.tags.length > 0) {
                const pNameInTags = pNameWords.some(word =>
                  product.tags.some(tag => tag.toLowerCase().includes(word))
                );
                if (pNameInTags) {
                  score += 3;
                }
              }
              
              // Bonus por misma categoría (peso: 1)
              let sameCategory = false;
              if (product.categories && product.categories.length > 0) {
                if (p.categories && p.categories.length > 0) {
                  sameCategory = p.categories.some(cat => product.categories.includes(cat));
                } else if (p.category) {
                  sameCategory = product.categories.includes(p.category);
                }
              } else if (product.category) {
                if (p.categories && p.categories.length > 0) {
                  sameCategory = p.categories.includes(product.category);
                } else if (p.category) {
                  sameCategory = p.category === product.category;
                }
              }
              
              if (sameCategory) {
                score += 1;
              }
              
              // Bonus por misma subcategoría (peso: 0.5)
              if (product.subcategory && p.subcategory && product.subcategory === p.subcategory) {
                score += 0.5;
              }
              
              return { ...p, similarityScore: score };
            });

          const productsWithScore = allProductsWithScore;

          // Ordenar por score de similitud
          productsWithScore.sort((a, b) => b.similarityScore - a.similarityScore);
          
          // Debug: mostrar los primeros 10 productos con sus scores
          console.log('Productos similares encontrados:', productsWithScore.slice(0, 10).map(p => ({
            name: p.name,
            score: p.similarityScore
          })));

          // Seleccionar productos similares
          let similarProducts = [];
          
          // Primero, tomar productos con score > 0 (tienen alguna similitud)
          const productsWithSimilarity = productsWithScore.filter(p => p.similarityScore > 0);
          
          if (productsWithSimilarity.length >= 4) {
            // Si hay 4 o más con similitud, tomar los 4 mejores
            similarProducts = productsWithSimilarity.slice(0, 4);
          } else if (productsWithSimilarity.length > 0) {
            // Si hay algunos con similitud, tomarlos todos y completar con aleatorios
            similarProducts = [...productsWithSimilarity];
            
            // Productos restantes (sin los que ya están seleccionados)
            const remainingProducts = productsWithScore.filter(
              p => !similarProducts.find(sp => sp.id === p.id)
            );
            
            // Mezclar aleatoriamente los productos restantes
            const shuffled = remainingProducts.sort(() => Math.random() - 0.5);
            
            // Completar hasta 4 productos
            const needed = 4 - similarProducts.length;
            similarProducts = [...similarProducts, ...shuffled.slice(0, needed)];
          } else {
            // Si no hay productos con similitud, tomar 4 aleatorios
            const shuffled = productsWithScore.sort(() => Math.random() - 0.5);
            similarProducts = shuffled.slice(0, 4);
          }

          // Aplicar ofertas globales a productos similares
          const similarProductsWithOffers = similarProducts.map(p => {
            const globalOffer = offers.find(offer => 
              offer.isActive && 
              offer.isGlobal && 
              offer.discountType === 'percentage'
            );
            
            if (!p.isOnOffer && globalOffer) {
              return {
                ...p,
                isOnOffer: true,
                discountPercentage: globalOffer.discountPercentage,
                originalPrice: p.price,
                price: Math.round(p.price * (1 - globalOffer.discountPercentage / 100))
              };
            }
            return p;
          });

          return similarProductsWithOffers.length > 0 && (
            <Box mt={16} mb={8}>
              <Heading
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="bold"
                mb={6}
                bgGradient="linear(to-r, brand.400, pink.400)"
                bgClip="text"
              >
                Productos Similares
              </Heading>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
                {similarProductsWithOffers.map((similarProduct) => (
                  <ProductCard
                    key={similarProduct.id}
                    product={similarProduct}
                  />
                ))}
              </SimpleGrid>
            </Box>
          );
        })()}
      </Container>
    </Box>
  );
}
