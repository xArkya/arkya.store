import React from 'react';
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
  ListIcon
} from '@chakra-ui/react';
import { FaTrash, FaInstagram, FaClipboard, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { useCart } from '../../context/useCart';
import { Link as RouterLink } from 'react-router-dom';

const CART_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none"><rect width="80" height="80" rx="10" fill="#F1F1F1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666666">Sin imagen</text></svg>'
)} `;

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, clearCart, cartTotal, productsCache } = useCart();
  const toast = useToast();
  const { isOpen: isInstructionsOpen, onOpen: onInstructionsOpen, onClose: onInstructionsClose } = useDisclosure();
  
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
    
    let message = 'Hola, me interesan los siguientes productos:\n\n';
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} - Cantidad: ${item.quantity}\n`;
    });
    
    message += `\nTotal: $${cartTotal.toLocaleString()}`;
    
    return message;
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
            <DrawerFooter borderTopWidth="1px" borderColor={borderColor} flexDirection="column">
              <Flex w="100%" justify="space-between" mb={4}>
                <Text fontWeight="bold" color={textColor}>Total:</Text>
                <Text fontWeight="bold" color={textColor}>${cartTotal.toLocaleString()}</Text>
              </Flex>
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
      <Modal isOpen={isInstructionsOpen} onClose={onInstructionsClose} isCentered>
        <ModalOverlay />
        <ModalContent bg={modalBgColor} color={modalTextColor}>
          <ModalHeader>Comprar por Instagram</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                Estás a punto de realizar tu compra a través de Instagram. Sigue estos pasos:
              </Text>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={FaClipboard} color={modalHighlightColor} />
                  Al hacer clic en "Copiar y abrir Instagram", el mensaje con tu carrito se copiará automáticamente.
                </ListItem>
                <ListItem>
                  <ListIcon as={FaInstagram} color={modalHighlightColor} />
                  Se abrirá el chat de Instagram de @arkya.store en una nueva pestaña.
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color={modalHighlightColor} />
                  Pega el mensaje en el chat (Ctrl+V o mantén presionado y selecciona "Pegar").
                </ListItem>
              </List>
              <Box bg="whiteAlpha.200" p={3} borderRadius="md" mt={2}>
                <Text fontWeight="bold">Resumen del carrito:</Text>
                <Text fontSize="sm" mt={2}>{generateInstagramMessage()}</Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="brand"
              mr={3}
              leftIcon={<FaInstagram />}
              onClick={handleCopyAndOpenInstagram}>
              Copiar y abrir Instagram
            </Button>
            <Button variant="ghost" onClick={onInstructionsClose}>Cancelar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default CartDrawer;
