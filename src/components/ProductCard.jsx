import {
  Box,
  useColorModeValue,
  Heading,
  Text,
  Image,
  Badge,
  Button,
  Flex,
  useToast,
  IconButton,
  VStack,
  HStack,
  LinkBox,
  LinkOverlay,
} from '@chakra-ui/react';
import { FaShoppingBag, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { id, name, price, image, images, category, isNew, description, isOnOffer, originalPrice, discountPercentage } = product;
  const { addToCart } = useCart();
  const toast = useToast();
  
  // Estado para el carrusel de imágenes
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Usar images si existe, sino usar image como fallback
  const productImages = images && images.length > 0 ? images.filter(img => img.trim() !== '') : [image];
  const currentImage = productImages[currentImageIndex] || image;
  
  // Define color variables
  const cardBg = useColorModeValue('white', '#2a1c29');
  const textColor = useColorModeValue('gray.700', 'white');
  const priceColor = useColorModeValue('#241521', 'brand.200');
  const categoryBg = useColorModeValue('#f8f6f7', 'whiteAlpha.200');
  const categoryColor = useColorModeValue('#241521', 'gray.200');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  
  // Funciones para el carrusel
  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };
  
  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };
  
  // Función para añadir al carrito
  const handleAddToCart = (e) => {
    e.preventDefault(); // Evitar navegación si se hace clic en el botón
    addToCart(product);
    toast({
      title: "¡Producto agregado!",
      description: `${name} se ha añadido al carrito.`,
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top"
    });
  };

  return (
    <LinkBox 
      as="article"
      w="100%"
      maxW="300px"
      borderRadius="lg"
      overflow="hidden"
      bg={cardBg}
      borderWidth="1px"
      borderColor={borderColor}
      transition="all 0.3s ease"
      _hover={{
        transform: 'translateY(-5px)',
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      mb={4}
      position="relative"
    >
      {/* Imagen con overlay para efectos */}
      <Box position="relative" overflow="hidden">
        <Image
          src={currentImage}
          alt={name}
          w="100%"
          h="220px"
          objectFit="cover"
          transition="transform 0.5s ease"
          _groupHover={{ transform: 'scale(1.05)' }}
        />
        
        {/* Controles del carrusel - solo mostrar si hay más de una imagen */}
        {productImages.length > 1 && (
          <>
            <IconButton
              icon={<FaChevronLeft />}
              position="absolute"
              left="2"
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              colorScheme="whiteAlpha"
              bg="blackAlpha.600"
              color="white"
              _hover={{ bg: 'blackAlpha.800' }}
              onClick={prevImage}
              zIndex={2}
            />
            <IconButton
              icon={<FaChevronRight />}
              position="absolute"
              right="2"
              top="50%"
              transform="translateY(-50%)"
              size="sm"
              colorScheme="whiteAlpha"
              bg="blackAlpha.600"
              color="white"
              _hover={{ bg: 'blackAlpha.800' }}
              onClick={nextImage}
              zIndex={2}
            />
            
            {/* Indicadores de imagen */}
            <HStack
              position="absolute"
              bottom="2"
              left="50%"
              transform="translateX(-50%)"
              spacing={1}
              zIndex={2}
            >
              {productImages.map((_, index) => (
                <Box
                  key={index}
                  w="6px"
                  h="6px"
                  borderRadius="full"
                  bg={index === currentImageIndex ? 'white' : 'whiteAlpha.500'}
                  cursor="pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </HStack>
          </>
        )}
        
        {/* Overlay con botones */}
        <Box 
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.600"
          opacity="0"
          transition="opacity 0.3s ease"
          _groupHover={{ opacity: 1 }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          className="product-overlay"
        >
          <HStack spacing={3}>
            <IconButton
              icon={<FaShoppingBag />}
              colorScheme="brand"
              variant="solid"
              rounded="full"
              size="md"
              onClick={handleAddToCart}
              aria-label="Añadir al carrito"
            />
            <IconButton
              as={RouterLink}
              to={`/product/${id}`}
              icon={<FaEye />}
              colorScheme="whiteAlpha"
              variant="solid"
              rounded="full"
              size="md"
              aria-label="Ver detalles"
            />
          </HStack>
        </Box>
        
        {/* Badges */}
        <Flex position="absolute" top={2} right={2} gap={2} direction="column">
          {isOnOffer && (
            <Badge 
              bg="red.500" 
              color="white" 
              borderRadius="full"
              px={2}
              py={1}
              fontWeight="bold"
              fontSize="xs"
              textTransform="uppercase"
              boxShadow="md"
            >
              -{discountPercentage}%
            </Badge>
          )}
          {isNew && (
            <Badge 
              bg="brand.500" 
              color="white" 
              borderRadius="full"
              px={2}
              py={1}
              fontWeight="bold"
              fontSize="xs"
              textTransform="uppercase"
              boxShadow="md"
            >
              Nuevo
            </Badge>
          )}
        </Flex>
      </Box>
      
      {/* Contenido */}
      <VStack p={4} align="start" spacing={2}>
        <Badge bg={categoryBg} color={categoryColor} borderRadius="md" px={2} py={0.5} fontSize="xs">
          {category}
        </Badge>
        
        <Heading 
          as="h3" 
          fontSize="lg" 
          fontWeight="600" 
          color={textColor}
          noOfLines={1}
          mt={1}
        >
          <LinkOverlay as={RouterLink} to={`/product/${id}`}>
            {name}
          </LinkOverlay>
        </Heading>
        
        <Text fontSize="sm" color={textColor} noOfLines={2} opacity={0.8}>
          {description}
        </Text>
        
        <Flex w="100%" justify="space-between" align="center" mt={2}>
          <VStack align="start" spacing={0}>
            {isOnOffer ? (
              <>
                <Text fontWeight="bold" fontSize="xl" color="red.500">
                  ${price.toLocaleString()}
                </Text>
                <Text 
                  fontSize="sm" 
                  color="gray.500" 
                  textDecoration="line-through"
                >
                  ${originalPrice?.toLocaleString()}
                </Text>
              </>
            ) : (
              <Text fontWeight="bold" fontSize="xl" color={priceColor}>
                ${price.toLocaleString()}
              </Text>
            )}
          </VStack>
          
          <Button
            size="sm"
            colorScheme="green"
            leftIcon={<FaShoppingBag />}
            onClick={handleAddToCart}
            borderRadius="md"
          >
            Agregar
          </Button>
        </Flex>
      </VStack>
    </LinkBox>
  );
}
