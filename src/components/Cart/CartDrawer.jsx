import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  Flex,
  IconButton,
  Box,
  Divider,
  useColorModeValue,
  Badge,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  List,
  ListItem,
  ListIcon,
  Input,
  InputGroup,
  InputRightElement
} from '@chakra-ui/react';
import { FaTrash, FaInstagram, FaClipboard, FaCheckCircle, FaExclamationCircle, FaTag, FaTimes } from 'react-icons/fa';
import { useCart } from '../../context/useCart';
import { Link as RouterLink } from 'react-router-dom';
import { validateCoupon } from '../../data/coupons';

const CART_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none"><rect width="80" height="80" rx="10" fill="#F1F1F1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666666">Sin imagen</text></svg>'
)} `;

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, cartTotal, productsCache, appliedCoupon, couponDiscount, applyCoupon, removeCoupon, finalTotal } = useCart();
  const toast = useToast();
  const { isOpen: isInstructionsOpen, onOpen: onInstructionsOpen, onClose: onInstructionsClose } = useDisclosure();
  const [couponCode, setCouponCode] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  // Color mode values
  const bgColor = useColorModeValue('white', '#241521');
  const textColor = useColorModeValue('gray.900', 'gray.100');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const itemBgColor = useColorModeValue('gray.50', 'whiteAlpha.100');
  const modalBgColor = useColorModeValue('white', '#241521');
  const modalTextColor = useColorModeValue('gray.800', 'gray.100');
  const modalHighlightColor = useColorModeValue('brand.500', 'brand.300');
  
  // Función para generar el mensaje para Instagram
  const generateInstagramMessage = () => {
    if (cart.length === 0) return '';
    
    let message = '🛍️ Hola! Me interesan los siguientes productos:\n';
    message += '━━━━━━━━━━━━━━━━━━━━\n\n';
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n`;
      message += `   💰 $${item.price.toLocaleString()} x ${item.quantity}\n\n`;
    });
    
    message += '━━━━━━━━━━━━━━━━━━━━\n';
    
    if (appliedCoupon) {
      message += `🎟️ Cupón ${appliedCoupon.code}: -$${couponDiscount.toLocaleString()}\n`;
      message += `━━━━━━━━━━━━━━━━━━━━\n`;
      message += `✨ TOTAL: $${finalTotal.toLocaleString()}`;
    } else {
      message += `✨ TOTAL: $${cartTotal.toLocaleString()}`;
    }
    
    return message;
  };
  
  // Función para aplicar cupón
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast({
        title: "Ingresa un cupón",
        description: "Por favor ingresa un código de cupón válido",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      return;
    }
    
    setIsApplyingCoupon(true);
    
    const validation = validateCoupon(couponCode, cartTotal);
    
    if (validation.valid) {
      applyCoupon(validation.coupon, validation.discount);
      toast({
        title: "¡Cupón aplicado!",
        description: `Descuento de $${validation.discount.toLocaleString()} aplicado`,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      setCouponCode('');
    } else {
      toast({
        title: "Cupón inválido",
        description: validation.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
    }
    
    setIsApplyingCoupon(false);
  };
  
  // Función para remover cupón
  const handleRemoveCoupon = () => {
    removeCoupon();
    toast({
      title: "Cupón removido",
      status: "info",
      duration: 2000,
      isClosable: true,
      position: "top"
    });
  };
  
  // Función para abrir el modal instructivo
  const handleBuyClick = () => {
    onInstructionsOpen();
  };

  // Función para copiar el mensaje y abrir Instagram
  const handleCopyAndOpenInstagram = async () => {
    try {
      const message = generateInstagramMessage();
      
      // Usar la API moderna del Clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        // Fallback para navegadores que no soportan la API moderna
        const textArea = document.createElement("textarea");
        textArea.value = message;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      
      // Mostrar notificación de éxito
      toast({
        title: "¡Mensaje copiado!",
        description: "El resumen de tu carrito ha sido copiado. Pégalo en el chat de Instagram.",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top"
      });
      
      // Cerrar modal y drawer
      onInstructionsClose();
      onClose();
      
      // Abrir Instagram después de un breve retraso
      setTimeout(() => {
        window.open("https://ig.me/m/arkya.store", "_blank");
      }, 500);
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

  return (
    <>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay />
        <DrawerContent bg={bgColor}>
          <DrawerCloseButton color={textColor} />
          <DrawerHeader borderBottomWidth="1px" borderColor={borderColor} color={textColor}>
            Tu Carrito de Compras
            {cart.length > 0 && (
              <Badge ml={2} colorScheme="brand" fontSize="sm">
                {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </Badge>
            )}
          </DrawerHeader>

          <DrawerBody>
            {cart.length === 0 ? (
              <Flex direction="column" align="center" justify="center" h="100%">
                <Text color={textColor} fontSize="lg" mb={4}>Tu carrito está vacío</Text>
                <Button variant="outline" onClick={onClose}>
                  Seguir comprando
                </Button>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch" divider={<Divider />}>
                {cart.map((item) => {
                  const resolveImage = () => {
                    if (!item) return CART_PLACEHOLDER_IMAGE;

                    if (item.image && typeof item.image === 'string') {
                      if (item.image.startsWith('data:')) {
                        return item.image;
                      }

                      if (item.image.startsWith('http')) {
                        return item.image;
                      }

                      if (item.image.startsWith('img_')) {
                        const cachedImage = productsCache?.[item.id]?.image;
                        if (cachedImage) {
                          return cachedImage;
                        }
                      } else {
                        return item.image;
                      }
                    }

                    const cachedImage = productsCache?.[item.id]?.image;
                    if (cachedImage) {
                      return cachedImage;
                    }

                    return CART_PLACEHOLDER_IMAGE;
                  };

                  const imageSrc = resolveImage();

                  return (
                    <Box key={item.id} p={3} borderRadius="md" bg={itemBgColor}>
                      <Flex align="stretch" gap={3}>
                        <RouterLink to={`/product/${item.id}`} style={{ display: 'flex' }} onClick={onClose}>
                          <Image
                            src={imageSrc}
                            alt={item.name}
                            boxSize="80px"
                            objectFit="cover"
                            borderRadius="md"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = CART_PLACEHOLDER_IMAGE;
                            }}
                          />
                        </RouterLink>
                        <Flex flex="1" direction="column" justify="space-between">
                          <RouterLink to={`/product/${item.id}`} onClick={onClose}>
                            <Text fontWeight="bold" color={textColor} _hover={{ textDecoration: 'underline' }}>
                              {item.name}
                            </Text>
                          </RouterLink>
                          <Text color={textColor}>${item.price.toLocaleString()}</Text>
                          <Flex justify="flex-end" align="center" w="100%">
                            <IconButton
                              icon={<FaTrash />}
                              size="xs"
                              aria-label="Remove item"
                              onClick={() => removeFromCart(item.id)}
                            />
                          </Flex>
                        </Flex>
                      </Flex>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </DrawerBody>

          {cart.length > 0 && (
            <DrawerFooter borderTopWidth="1px" borderColor={borderColor} flexDirection="column" gap={3}>
              {/* Campo de cupón */}
              {!appliedCoupon ? (
                <VStack w="100%" spacing={2}>
                  <InputGroup size="sm">
                    <Input
                      placeholder="Código de cupón"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                      color={textColor}
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        h="1.75rem"
                        size="sm"
                        onClick={handleApplyCoupon}
                        isLoading={isApplyingCoupon}
                        colorScheme="brand"
                      >
                        Aplicar
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </VStack>
              ) : (
                <Flex
                  w="100%"
                  bg="green.50"
                  _dark={{ bg: "green.900" }}
                  p={2}
                  borderRadius="md"
                  align="center"
                  justify="space-between"
                >
                  <HStack>
                    <FaTag color="green" />
                    <Text fontSize="sm" fontWeight="bold" color="green.700" _dark={{ color: "green.200" }}>
                      {appliedCoupon.code} - {appliedCoupon.discountPercentage}% OFF
                    </Text>
                  </HStack>
                  <IconButton
                    icon={<FaTimes />}
                    size="xs"
                    variant="ghost"
                    colorScheme="red"
                    onClick={handleRemoveCoupon}
                    aria-label="Remover cupón"
                  />
                </Flex>
              )}
              
              {/* Resumen de precios */}
              <VStack w="100%" spacing={2}>

                {appliedCoupon && (
                  <Flex w="100%" justify="space-between" color="green.600" _dark={{ color: "green.300" }}>
                    <Text>Descuento ({appliedCoupon.discountPercentage}%):</Text>
                    <Text>-${couponDiscount.toLocaleString()}</Text>
                  </Flex>
                )}
                <Divider />
                <Flex w="100%" justify="space-between">
                  <Text fontWeight="bold" fontSize="lg" color={textColor}>Total:</Text>
                  <Text fontWeight="bold" fontSize="lg" color={textColor}>${finalTotal.toLocaleString()}</Text>
                </Flex>
              </VStack>
              
              <HStack spacing={4} w="100%">
                <Button variant="outline" onClick={clearCart} size="sm">
                  Vaciar carrito
                </Button>
                <Button 
                  colorScheme="brand" 
                  leftIcon={<FaInstagram />} 
                  onClick={handleBuyClick}
                  flex="1"
                >
                  Comprar por Instagram
                </Button>
              </HStack>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>

      {/* Modal de instrucciones para compra por Instagram */}
      <Modal isOpen={isInstructionsOpen} onClose={onInstructionsClose} isCentered size="lg">
        <ModalOverlay backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} color={modalTextColor} mx={4}>
          <ModalHeader fontSize="2xl" fontWeight="bold" pb={2}>
            🛍️ Comprar por Instagram
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              <Text fontSize="md" color={useColorModeValue('gray.600', 'gray.300')}>
                Estás a punto de realizar tu compra a través de Instagram. Sigue estos sencillos pasos:
              </Text>
              
              <List spacing={4}>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaClipboard} color={modalHighlightColor} mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 1: Copiar mensaje</Text>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Al hacer clic en el botón, el mensaje con tu pedido se copiará automáticamente.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaInstagram} color={modalHighlightColor} mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 2: Abrir Instagram</Text>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Se abrirá automáticamente el chat de @arkya.store en una nueva pestaña.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCheckCircle} color={modalHighlightColor} mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 3: Pegar y enviar</Text>
                    <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
                      Pega el mensaje en el chat (Ctrl+V en PC o Cmd+V en MAC) y envíalo para completar tu pedido.
                    </Text>
                  </Box>
                </ListItem>
              </List>
              
              <Box 
                bg={useColorModeValue('gray.50', 'whiteAlpha.100')} 
                p={4} 
                borderRadius="lg" 
                borderWidth="1px"
                borderColor={useColorModeValue('gray.200', 'whiteAlpha.200')}
              >
                <Text fontWeight="bold" mb={3} fontSize="md" color={modalHighlightColor}>
                  📋 Vista previa del mensaje:
                </Text>
                <Box 
                  bg={useColorModeValue('white', 'gray.800')} 
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
                      background: useColorModeValue('white', '#1a202c'),
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: useColorModeValue('#cbd5e0', '#4a5568'),
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb:hover': {
                      background: useColorModeValue('#a0aec0', '#718096'),
                    },
                  }}
                >
                  {generateInstagramMessage()}
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
            >
              Copiar y abrir Instagram
            </Button>
            <Button 
              variant="ghost" 
              size="lg"
              onClick={onInstructionsClose}
            >
              Cancelar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CartDrawer;
