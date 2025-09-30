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
  Badge,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
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
import { FaInstagram, FaArrowLeft, FaHeart, FaShoppingBag, FaHome, FaStar, FaCheck, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { products } from '../data/products';
import { offers } from '../data/offers';

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Usar el contexto global de verificación de edad
  const { isAgeVerified, verifyAge } = useAgeVerification();
  
  const toast = useToast();
  // Modal para compra por Instagram
  const { isOpen: isInstagramOpen, onOpen: onInstagramOpen, onClose: onInstagramClose } = useDisclosure();
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
  const breadcrumbBgColor = useColorModeValue('#241521', '#241521');
  const breadcrumbTextColor = useColorModeValue('gray.600', 'gray.400');
  const productCardBgColor = useColorModeValue('#241521', '#241521');

  useEffect(() => {
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
          <Button as={RouterLink} to="/" leftIcon={<FaArrowLeft />} colorScheme="brand">
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
      const message = `Hola, me interesa el producto: ${product.name}`;
      
      // Usar la API moderna de Clipboard
      navigator.clipboard.writeText(message)
        .then(() => {
          // Mostrar notificación de éxito
          toast({
            title: "¡Mensaje copiado!",
            description: `"${message}" ha sido copiado. Pégalo en el chat de Instagram.`,
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
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
        <ModalContent bg={modalBgColor} borderRadius="lg" boxShadow="xl">
          <ModalHeader color={modalHeaderColor} borderBottomWidth="1px" borderColor={dividerColor}>
            <Flex align="center" gap={2}>
              <Icon as={FaExclamationTriangle} color="red.500" />
              <Text>Verificación de edad requerida</Text>
            </Flex>
          </ModalHeader>
          <ModalBody pb={6} pt={4}>
            <VStack spacing={4} align="center">
              <Icon as={FaExclamationTriangle} color="red.500" boxSize="50px" />
              <Text fontWeight="bold" fontSize="xl" textAlign="center">
                Contenido para adultos (+18)
              </Text>
              <Text textAlign="center">
                El producto que intentas ver contiene contenido para adultos.
                Debes confirmar que eres mayor de 18 años para continuar.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={dividerColor} justifyContent="center">
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleConfirmAge}
              size="lg"
              width="full"
              borderRadius="md"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}>
              Confirmar que soy mayor de 18 años
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Modal de instrucciones */}
      <Modal isOpen={isInstagramOpen} onClose={onInstagramClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg={modalBgColor} borderRadius="lg" boxShadow="xl">
          <ModalHeader color={modalHeaderColor} borderBottomWidth="1px" borderColor={dividerColor}>
            <Flex align="center" gap={2}>
              <Icon as={FaInstagram} />
              <Text>Comprar por Instagram</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <VStack spacing={4} align="start">
              <Text>
                Para comprar este producto a través de Instagram, sigue estos pasos:
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
                  <Text>Pega el mensaje (Ctrl+V o Cmd+V) en el chat</Text>
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
                  Hola, me interesa el producto: {product?.name}
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor={dividerColor}>
            <Button
              colorScheme="brand"
              mr={3}
              leftIcon={<FaInstagram />}
              onClick={handleCopyAndOpenInstagram}
              size="lg"
              borderRadius="md"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}>
              Copiar y abrir Instagram
            </Button>
            <Button variant="ghost" onClick={onInstagramClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Container maxW={'7xl'} py={8}>
        {/* Migas de pan con estilo mejorado */}
        <Breadcrumb 
          mb={6} 
          fontSize="sm" 
          separator="/" 
          color={breadcrumbTextColor}
          bg={breadcrumbBgColor}
          p={3}
          borderRadius="md"
          boxShadow="sm">
          <BreadcrumbItem>
            <BreadcrumbLink as={RouterLink} to="/" _hover={{ color: 'brand.500' }}>
              <Icon as={FaHome} mr={1} />
              Inicio
            </BreadcrumbLink>
          </BreadcrumbItem>
          {/* Mostrar todas las categorías en el breadcrumb */}
          {product.categories && product.categories.length > 0 ? (
            product.categories.map((cat, index) => (
              <BreadcrumbItem key={index}>
                <BreadcrumbLink 
                  as={RouterLink} 
                  to={`/#category-${cat.toLowerCase()}`}
                  _hover={{ color: 'brand.500' }}>
                  {cat}
                </BreadcrumbLink>
                {index < product.categories.length - 1 && " / "}
              </BreadcrumbItem>
            ))
          ) : (
            <BreadcrumbItem>
              <BreadcrumbLink 
                as={RouterLink} 
                to={`/#category-${product.category.toLowerCase()}`}
                _hover={{ color: 'brand.500' }}>
                {product.category}
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink fontWeight="semibold">{product.name}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

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
                    </Flex>
                    <Flex width="100%">
                      <Badge colorScheme="red" variant="solid" px={2} py={1} borderRadius="md" mr={2}>
                        {product.discountPercentage}% OFF
                      </Badge>
                      <Badge colorScheme="green" variant="solid" px={2} py={1} borderRadius="md">
                        DISPONIBLE
                      </Badge>
                    </Flex>
                  </>
                ) : (
                  <>
                    <Text
                      color={textColor}
                      fontWeight={500}
                      fontSize={'3xl'}
                      letterSpacing="tight">
                      ${parseInt(product.price)}
                    </Text>
                    <Badge colorScheme="green" variant="solid" px={2} py={1} borderRadius="md">
                      DISPONIBLE
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
                  {product.description}
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
                colorScheme="green"
                fontWeight="bold"
                w="full"
                bg={likeBtnBg}
                color={likeBtnColor}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'xl',
                }}
                onClick={() => {
                  addToCart(product);
                  toast({
                    title: "¡Producto agregado!",
                    description: `${product.name} se ha añadido al carrito.`,
                    status: "success",
                    duration: 3000,
                    isClosable: true,
                    position: "top"
                  });
                }}
                leftIcon={<FaShoppingBag />}>
                Agregar al carrito
              </Button>

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
            </VStack>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
