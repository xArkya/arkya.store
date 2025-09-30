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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Center
} from '@chakra-ui/react';
import { FaShoppingBag, FaEye, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { useAgeVerification } from '../context/useAgeVerification.js';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { id, name, price, image, images, category, isNew, description, isOnOffer, originalPrice, discountPercentage, inStock = true, adultContent = false } = product;
  const { addToCart } = useCart();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Usar el contexto global de verificación de edad
  const { isAgeVerified, verifyAge } = useAgeVerification();
  
  // Estado para el carrusel de imágenes
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Usar images si existe, sino usar image como fallback
  const productImages = images && images.length > 0 ? images.filter(img => img.trim() !== '') : [image];
  const currentImage = productImages[currentImageIndex] || image;
  
  // Función para confirmar edad usando el contexto global
  const handleConfirmAge = () => {
    // Usar la función del contexto para verificar la edad globalmente
    verifyAge();
    onClose();
  };
  
  // Función para manejar el clic en la imagen o el enlace
  const handleContentClick = (e) => {
    if (adultContent && !isAgeVerified) {
      e.preventDefault();
      onOpen();
    }
  };
  
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
    <>
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
        onClick={handleContentClick}
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
          filter={adultContent && !isAgeVerified ? 'blur(15px) grayscale(0.5)' : 'none'}
        />
        
        {/* Overlay para contenido adulto */}
        {adultContent && !isAgeVerified && (
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
            textAlign="center"
            borderWidth="3px"
            borderColor="red.500"
            borderStyle="solid"
          >
            <Box
              position="absolute"
              top="0"
              left="0"
              right="0"
              py={1}
              bg="red.600"
              textAlign="center"
              fontWeight="bold"
            >
              CONTENIDO PARA ADULTOS
            </Box>
            <FaExclamationTriangle size="2.5em" color="#FFC107" />
            <Text color="white" fontWeight="bold" fontSize="lg" mt={3}>
              Contenido +18
            </Text>
            <Text color="white" fontSize="sm" mt={2}>
              Haz clic para verificar tu edad
            </Text>
            <Button 
              mt={4} 
              size="sm" 
              colorScheme="red"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpen();
              }}
            >
              Verificar edad
            </Button>
          </Center>
        )}
        
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
          {adultContent && (
            <Badge 
              bg="red.600" 
              color="white" 
              borderRadius="full"
              px={2}
              py={1}
              fontWeight="bold"
              fontSize="sm"
              textTransform="uppercase"
              boxShadow="md"
              zIndex="2"
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FaExclamationTriangle size="0.9em" />
              +18
            </Badge>
          )}
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

      {/* Modal de confirmación de edad */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false}>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="#241521" color="white" borderRadius="lg" borderWidth="2px" borderColor="red.500">
          <ModalHeader bg="red.600" borderTopRadius="lg" textAlign="center">
            VERIFICACIÓN DE EDAD
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pt={6}>
            <VStack spacing={4} align="center">
              <Box position="relative" p={2}>
                <FaExclamationTriangle size="4em" color="#FFC107" />
                <Box 
                  position="absolute" 
                  top="0" 
                  right="-10px" 
                  bg="red.600" 
                  color="white" 
                  borderRadius="full" 
                  width="30px" 
                  height="30px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                >
                  18+
                </Box>
              </Box>
              <Text fontSize="lg" textAlign="center">
                Este producto contiene contenido exclusivo para adultos.
              </Text>
              <Text fontWeight="bold" fontSize="xl" textAlign="center">
                ¿Confirmas que eres mayor de 18 años?
              </Text>
              <Text fontSize="sm" color="gray.300" textAlign="center">
                Al confirmar, declaras que tienes la edad legal para ver este contenido.
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter justifyContent="center" gap={4}>
            <Button colorScheme="red" size="lg" onClick={onClose} flex={1}>
              No, salir
            </Button>
            <Button colorScheme="green" size="lg" onClick={handleConfirmAge} flex={1}>
              Sí, soy mayor de 18
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
