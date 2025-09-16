import React from 'react';
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
  const { id, name, price, image, images, category, isNew, description, isOnOffer, originalPrice, discountPercentage, inStock = true } = product;
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
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!inStock) {
      toast({
        title: "Producto sin stock",
        description: `${name} no está disponible en este momento.`,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
      return;
    }
    
    addToCart(product);
    toast({
      title: "¡Producto agregado!",
      description: `${name} se ha añadido al carrito.`,
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top-right"
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
      boxShadow="md"
      transition="all 0.3s"
      _hover={{ transform: inStock ? 'translateY(-5px)' : 'none', boxShadow: inStock ? 'lg' : 'md' }}
      role="group"
      position="relative"
      opacity={inStock ? 1 : 0.7}
      filter={inStock ? 'none' : 'grayscale(30%)'}
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
        
        {/* Overlay sutil al hacer hover */}
        <Box 
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="blackAlpha.300"
          opacity="0"
          transition="opacity 0.3s ease"
          _groupHover={{ opacity: 1 }}
          className="product-overlay"
        />
        
        {/* Badges */}
        <Flex position="absolute" top={2} right={2} gap={2} alignItems="flex-end" direction="column">
          {isOnOffer && (
            <Badge 
              bg="pink.400" 
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
          {!inStock && (
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
              Sin Stock
            </Badge>
          )}
        </Flex>
      </Box>
      
      {/* Contenido */}
      <VStack p={4} align="start" spacing={2}>
        {/* Mostrar múltiples categorías si existen */}
        <Flex gap={1} flexWrap="wrap">
          {product.categories && product.categories.length > 0 ? (
            product.categories.map((cat, index) => (
              <Badge 
                key={index} 
                bg={categoryBg} 
                color={categoryColor} 
                borderRadius="md" 
                px={2} 
                py={0.5} 
                fontSize="xs"
              >
                {cat}
              </Badge>
            ))
          ) : (
            <Badge bg={categoryBg} color={categoryColor} borderRadius="md" px={2} py={0.5} fontSize="xs">
              {category}
            </Badge>
          )}
        </Flex>
        
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
          {description && description.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i < description.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </Text>
        
        <Flex w="100%" justify="space-between" align="center" mt={2}>
          <VStack align="start" spacing={0}>
            {isOnOffer ? (
              <>
                <Text fontWeight="bold" fontSize="xl" color="pink.400">
                  ${parseInt(price).toLocaleString()}
                </Text>
                <Text 
                  fontSize="sm" 
                  color="gray.500" 
                  textDecoration="line-through"
                >
                  ${parseInt(originalPrice || 0).toLocaleString()}
                </Text>
              </>
            ) : (
              <Text fontWeight="bold" fontSize="xl" color={priceColor}>
                ${parseInt(price).toLocaleString()}
              </Text>
            )}
          </VStack>
          
          <Button
            size="sm"
            colorScheme={inStock ? "green" : "gray"}
            leftIcon={<FaShoppingBag />}
            onClick={handleAddToCart}
            borderRadius="md"
            isDisabled={!inStock}
            _hover={{
              bg: inStock ? "green.500" : "gray.400"
            }}
          >
            {inStock ? "Agregar" : "Sin Stock"}
          </Button>
        </Flex>
      </VStack>
    </LinkBox>
  );
}
