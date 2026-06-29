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
  Center,
  Input,
  Icon,
  List,
  ListItem
} from '@chakra-ui/react';
import { FaShoppingBag, FaEye, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaInstagram, FaShareAlt, FaHeart } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useCart } from '../context/useCart';
import { useAgeVerification } from '../context/useAgeVerification.js';
import { useLikes, getLikeUser, setLikeUser } from '../hooks/useLikes';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getProductSlug } from '../utils/slugify';

const MotionBox = motion(Box);

export default function ProductCard({ product }) {
  const { id, name, price, image, images, category, isNew, description, isOnOffer, originalPrice, discountPercentage, inStock = true, adultContent = false } = product;
  const { addToCart } = useCart();
  const { isLiked, toggleLike } = useLikes();
  const toast = useToast();
  // Modal para verificación de edad
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Modal para consulta por Instagram
  const { isOpen: isConsultOpen, onOpen: onConsultOpen, onClose: onConsultClose } = useDisclosure();
  // Modal para pedir Instagram/email al dar like
  const { isOpen: isLikeModalOpen, onOpen: onLikeModalOpen, onClose: onLikeModalClose } = useDisclosure();
  const [likeUserInput, setLikeUserInput] = useState(getLikeUser());
  const [pendingLike, setPendingLike] = useState(false);
  
  // Usar el contexto global de verificación de edad
  const { isAgeVerified, verifyAge } = useAgeVerification();
  
  // Estado para el carrusel de imágenes
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const containerRef = useRef(null);
  const carouselRef = useRef(null);
  const [slideWidth, setSlideWidth] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const shouldPreventClick = useRef(false);

  // Medir ancho del contenedor para el carrusel
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const updateWidth = () => setSlideWidth(el.offsetWidth);
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Usar images si existe, sino usar image como fallback
  const productImages = images && images.length > 0 ? images.filter(img => img.trim() !== '') : [image];
  
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
    } else {
      // Guardar la página actual y la posición de scroll antes de navegar al producto
      const currentPage = sessionStorage.getItem('currentPage');
      if (currentPage) {
        sessionStorage.setItem('lastViewedPage', currentPage);
      }
      sessionStorage.setItem('homeScrollPosition', window.scrollY);
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
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  const onCarouselTouchStart = (e) => {
    shouldPreventClick.current = false;
    dragStartX.current = e.touches[0].clientX;
    setDragOffset(0);
    setIsDragging(true);
  };

  const onCarouselTouchMove = (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStartX.current;
    setDragOffset(delta);
    if (Math.abs(delta) > 10) {
      shouldPreventClick.current = true;
    }
  };

  const onCarouselTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    const threshold = slideWidth * 0.2;

    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset < 0 && currentImageIndex < productImages.length - 1) {
        nextImage();
      } else if (dragOffset > 0 && currentImageIndex > 0) {
        prevImage();
      }
    }
    setDragOffset(0);
    setTimeout(() => { shouldPreventClick.current = false; }, 50);
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
    
    // addToCart ahora devuelve true si se agregó el producto, false si ya estaba en el carrito
    const added = addToCart(product);
    
    if (added) {
      // Si se agregó correctamente
      toast({
        title: "¡Producto agregado!",
        description: `${name} se ha añadido al carrito`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    } else {
      // Si el producto ya estaba en el carrito
      toast({
        title: "Producto ya en carrito",
        description: `${name} ya está en tu carrito`,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    }
  };

  return (
    <>
      <MotionBox
        as={LinkBox}
        w="100%"
        borderRadius="lg"
        overflow="hidden"
        bg={cardBg}
        boxShadow="md"
        role="group"
        position="relative"
        opacity={inStock ? 1 : 0.7}
        filter={inStock ? 'none' : 'grayscale(30%)'}
        onClick={(e) => {
          if (shouldPreventClick.current) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          handleContentClick(e);
        }}
        whileHover={{ 
          y: inStock ? -8 : 0,
          boxShadow: inStock ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined
        }}
        transition={{ duration: 0.2 }}
      >
      {/* Imagen con overlay para efectos */}
      <Box
        position="relative"
        overflow="hidden"
        ref={(node) => {
          containerRef.current = node;
          carouselRef.current = node;
        }}
        onTouchStart={onCarouselTouchStart}
        onTouchMove={onCarouselTouchMove}
        onTouchEnd={onCarouselTouchEnd}
        sx={{ touchAction: 'pan-y' }}
      >
        <Box
          display="flex"
          transform={`translateX(calc(-${currentImageIndex * (100 / productImages.length)}% + ${dragOffset}px))`}
          transition={isDragging ? 'none' : 'transform 0.25s ease-out'}
          width={`${productImages.length * 100}%`}
        >
          {productImages.map((img, i) => (
            <Box key={i} width={`${100 / productImages.length}%`} flexShrink={0}>
              <Image
                src={img}
                alt={`${name} - imagen ${i + 1} de ${productImages.length} - Arkya Store`}
                w="100%"
                h="220px"
                objectFit="cover"
                filter={adultContent && !isAgeVerified ? 'blur(15px) grayscale(0.5)' : 'none'}
                loading="lazy"
                decoding="async"
                draggable={false}
                userSelect="none"
                htmlWidth={300}
                htmlHeight={400}
                style={{ pointerEvents: 'none' }}
              />
            </Box>
          ))}
        </Box>
        
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
            justifyContent="end"
            p={5}
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
            <Text color="white" fontWeight="bold" fontSize="lg" mt={2}>
              Contenido +18
            </Text>
            <Text color="white" fontSize="sm" mt={2}>
              Haz clic para verificar tu edad
            </Text>
            <Button 
              mt={3} 
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
          pointerEvents="none"
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
          {isOnOffer && discountPercentage > 0 && (
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
              -{discountPercentage}% (ahorrá ${Math.round(originalPrice - price).toLocaleString()})
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
          {inStock && (
            <Badge 
              bg="orange.400" 
              color="white" 
              borderRadius="full"
              px={2}
              py={1}
              fontWeight="bold"
              fontSize="xs"
              textTransform="uppercase"
              boxShadow="md"
            >
              Última unidad
            </Badge>
          )}
        </Flex>

        {/* Botón de like — sobre la imagen, abajo a la derecha, sin fondo */}
        <Box position="absolute" bottom={2} right={2} zIndex={4}>
          <IconButton
            size="sm"
            icon={<FaHeart />}
            aria-label="Me gusta"
            variant="ghost"
            bg="transparent"
            color={isLiked(id) ? 'pink.400' : 'white'}
            _hover={{ bg: 'blackAlpha.400' }}
            onClick={(e) => {
              e?.preventDefault();
              e?.stopPropagation();
              if (!getLikeUser()) {
                setPendingLike(true);
                onLikeModalOpen();
                return;
              }
              const liked = toggleLike(product);
              toast({
                title: liked ? '¡Me gusta!' : 'Like removido',
                status: liked ? 'success' : 'info',
                duration: 2000,
                isClosable: true,
              });
            }}
          />
        </Box>
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
          <LinkOverlay as={RouterLink} to={`/product/${getProductSlug(product)}/`}>
            {name}
          </LinkOverlay>
        </Heading>
        
        {/* Botón de compartir (copiar link) */}
        <Box position="absolute" top={2} left={2} zIndex={2}>
          <IconButton
            icon={<FaShareAlt />}
            size="xs"
            variant="ghost"
            aria-label="Copiar enlace"
            opacity={0.7}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.2s"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const url = `${window.location.origin}/product/${getProductSlug(product)}/`;
              navigator.clipboard.writeText(url).then(() => {
                toast({
                  title: '¡Enlace copiado!',
                  description: 'El enlace del producto se copió al portapapeles',
                  status: 'success',
                  duration: 2000,
                  isClosable: true,
                  position: 'bottom-right',
                });
              });
            }}
          />
        </Box>
        
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
            {isOnOffer && discountPercentage > 0 ? (
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
            {!inStock && (
              <Text fontSize="xs" color="gray.500" fontStyle="italic">
                (puede bajar o subir)
              </Text>
            )}
          </VStack>
          
          <HStack spacing={2}>
            <Button
              size="sm"
              colorScheme={inStock ? "green" : "brand"}
              leftIcon={inStock ? <FaShoppingBag /> : <FaInstagram />}
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();

                if (inStock) {
                  // Funcionalidad normal de agregar al carrito
                  handleAddToCart(e);
                } else {
                  // Abrir modal de consulta por Instagram
                  onConsultOpen();
                }
              }}
              borderRadius="md"
              _hover={{
                bg: inStock ? "green.500" : "brand.500",
                transform: !inStock ? 'translateY(-2px)' : 'none',
                boxShadow: !inStock ? 'md' : 'none'
              }}
            >
              {inStock ? "Agregar" : "Consultar"}
            </Button>
          </HStack>
        </Flex>
      </VStack>
    </MotionBox>

      {/* Modal de confirmación de edad */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={false} size="md">
        <ModalOverlay 
          bg="blackAlpha.800" 
          backdropFilter="blur(12px)" 
        />
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
          <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
          
          <ModalBody py={8} px={6}>
            <VStack spacing={6} align="center">
              <Box position="relative">
                <Box
                  bg="yellow.500"
                  borderRadius="full"
                  p={6}
                  boxShadow="0 0 30px rgba(251, 191, 36, 0.4)"
                >
                  <FaExclamationTriangle size="3em" color="#1A1A1A" />
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
            gap={3} 
            pb={6}
            px={6}
            flexDirection={{ base: 'column', sm: 'row' }}
          >
            <Button 
              colorScheme="red" 
              size="lg" 
              onClick={onClose} 
              flex={1}
              width={{ base: 'full', sm: 'auto' }}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
            >
              No, salir
            </Button>
            <Button 
              colorScheme="green" 
              size="lg" 
              onClick={handleConfirmAge} 
              flex={1}
              width={{ base: 'full', sm: 'auto' }}
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
      
      {/* Modal de consulta por Instagram */}
      <Modal isOpen={isConsultOpen} onClose={onConsultClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg="#241521" color="white" borderRadius="lg" boxShadow="xl">
          <ModalHeader borderBottomWidth="1px" borderColor="whiteAlpha.300">
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
                bg="whiteAlpha.100"
                borderRadius="md"
                width="100%"
                borderLeft="4px solid"
                borderColor="brand.500">
                <Text fontStyle="italic">
                  Hola, me interesa el producto: {name} (actualmente sin stock)
                </Text>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter borderTopWidth="1px" borderColor="whiteAlpha.300">
            <Button
              colorScheme="brand"
              mr={3}
              leftIcon={<FaInstagram />}
              onClick={() => {
                try {
                  const message = `Hola, me interesa el producto: ${name} (actualmente sin stock)`;
                  
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
                        position: "top-right"
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
                        position: "top-right"
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
                    position: "top-right"
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

      {/* Modal para pedir Instagram/Email al dar like */}
      <Modal isOpen={isLikeModalOpen} onClose={onLikeModalClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg="#241521" color="white" borderRadius="lg" boxShadow="xl">
          <ModalHeader borderBottomWidth="1px" borderColor="whiteAlpha.300">
            <Flex align="center" gap={2}>
              <FaHeart />
              <Text>Dejanos tu contacto</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} pt={4}>
            <VStack spacing={4} align="start">
              <Text fontSize="sm">
                Dejanos tu Instagram o email y te avisamos cuando vuelva a estar en stock o cuando hagamos un pedido. Solo te lo pedimos una vez.
              </Text>
              <Input
                placeholder="@instagram o email@gmail.com"
                value={likeUserInput}
                onChange={(e) => setLikeUserInput(e.target.value)}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.300"
                _focus={{ borderColor: 'pink.400' }}
                color="white"
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor="whiteAlpha.300">
            <Button
              colorScheme="pink"
              mr={3}
              onClick={() => {
                if (!likeUserInput.trim()) {
                  toast({
                    title: 'Campo vacio',
                    description: 'Por favor ingresa tu Instagram o email',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                setLikeUser(likeUserInput.trim());
                onLikeModalClose();
                if (pendingLike) {
                  const liked = toggleLike(product);
                  toast({
                    title: liked ? '¡Me gusta!' : 'Like removido',
                    status: liked ? 'success' : 'info',
                    duration: 2000,
                    isClosable: true,
                  });
                  setPendingLike(false);
                }
              }}
            >
              Guardar
            </Button>
            <Button variant="ghost" onClick={() => { setPendingLike(false); onLikeModalClose(); }}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
