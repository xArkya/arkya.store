import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { useCart } from '../context/useCart';
import { useAgeVerification } from '../context/useAgeVerification.js';
import { useLikes, getLikeUser, setLikeUser } from '../hooks/useLikes';
import { SEO } from '../components/SEO';
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
  Input,
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
  IconButton,
} from '@chakra-ui/react';
import { FaInstagram, FaArrowLeft, FaHeart, FaShoppingBag, FaHome, FaStar, FaCheck, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaClipboard, FaCheckCircle, FaExpand, FaTimes, FaShareAlt } from 'react-icons/fa';
import { products } from '../data/products';
import { offers } from '../data/offers';
import ProductCard from '../components/ProductCard';
import { findProductBySlugOrId, getProductSlug } from '../utils/slugify';

export default function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const minSwipeDistance = 50;
  
  // Usar el contexto global de verificación de edad
  const { isAgeVerified, verifyAge } = useAgeVerification();
  const { isLiked, toggleLike } = useLikes();
  const [likeUserInput, setLikeUserInput] = useState(getLikeUser());
  const [pendingLike, setPendingLike] = useState(false);
  const { isOpen: isLikeModalOpen, onOpen: onLikeModalOpen, onClose: onLikeModalClose } = useDisclosure();
  
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
  const likeInputBg = useColorModeValue('gray.50', 'whiteAlpha.100');
  const likeInputBorder = useColorModeValue('gray.200', 'whiteAlpha.300');
  
  // Función para generar un número de vistas pseudoaleatorio basado en fecha + id del producto
  const getDailyViewers = (productId) => {
    const date = new Date().toISOString().split('T')[0];
    let hash = 0;
    const str = `${productId}-${date}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return 30 + (Math.abs(hash) % 121);
  };
  
  // Nuevos valores de color para el diseño mejorado
  const pageBgColor = useColorModeValue('gray.50', '#453641');
  const productCardBgColor = useColorModeValue('#241521', '#241521');

  useEffect(() => {
    // Scroll al top de la página cuando se carga el producto
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Función auxiliar para aplicar ofertas y establecer el producto
    const applyOffersAndSetProduct = (foundProduct) => {
      try {
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
            price: Math.round(foundProduct.price * (1 - globalOffer.discountPercentage / 100)),
            offerEndDate: globalOffer.endDate || null,
          };
        }
        
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
    };
    
    // Load product immediately without delay
    const timer = setTimeout(() => {
      try {
        if (!slug) {
          throw new Error('Slug no proporcionado');
        }
        
        // Buscar por slug o ID numérico (compatibilidad hacia atrás)
        let foundProduct = findProductBySlugOrId(slug, products);
        
        // Si no se encuentra, buscar en IndexedDB
        if (!foundProduct) {
          const dbRequest = indexedDB.open('ArkyaStoreDB', 1);
          
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
              const savedProducts = getAllRequest.result;
              const product = findProductBySlugOrId(slug, savedProducts);
              
              if (product) {
                applyOffersAndSetProduct(product);
              } else {
                setError(`Producto no encontrado: ${slug}`);
                setLoading(false);
              }
            };
            
            getAllRequest.onerror = () => {
              setError(`Producto no encontrado: ${slug}`);
              setLoading(false);
            };
          };
          
          dbRequest.onerror = () => {
            setError(`Producto no encontrado: ${slug}`);
            setLoading(false);
          };
          
          return;
        }
        
        applyOffersAndSetProduct(foundProduct);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [slug, isAgeVerified, onAgeModalOpen]);

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
            URL actual: /product/{slug}
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
      const productUrl = `https://arkya.store/product/${getProductSlug(product)}`;
      const message = `Hola! Me interesa el siguiente producto:\n ${product.name}\n $${Math.round(product.price).toLocaleString()}\n ${productUrl}`;
      
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
        .catch(() => {
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
    } catch {
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

  // Función para compartir el producto
  const handleShare = async () => {
    const shareUrl = `https://arkya.store/product/${getProductSlug(product)}`;
    const shareTitle = product?.name || 'Producto en Arkya Store';
    const shareText = `${shareTitle} — $${Math.floor(product?.price || 0).toLocaleString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareTitle}\n${shareUrl}`);
        toast({
          title: 'Link copiado',
          description: 'El link del producto se copió al portapapeles.',
          status: 'success',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      } catch {
        toast({
          title: 'No se pudo copiar',
          description: 'Por favor copiá el link manualmente.',
          status: 'error',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    }
  };

  // Las variables de color del modal ya están definidas al inicio del componente

  // Datos del carrusel de imágenes
  const productImages = product?.images && product.images.length > 0
    ? product.images.filter(img => img.trim() !== '')
    : [product?.image].filter(Boolean);
  const currentImage = productImages[currentImageIndex] || product?.image;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % (productImages.length || 1));
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + (productImages.length || 1)) % (productImages.length || 1));
  };

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) nextImage();
    if (distance < -minSwipeDistance) prevImage();
  };

  return (
    <>
      {(() => {
        const isJapanese = product?.categories?.some(c =>
          ['artbooks','mangas','revistas','doujinshis','guide-books','character-books','novela-ligera','cd-dvd'].includes(c.toLowerCase())
        ) || product?.tags?.some(t => t.toLowerCase().includes('japon') || t.toLowerCase().includes('japanese'));
        const priceStr = product?.price
          ? `ARS ${Math.floor(product.price).toLocaleString('es-AR')}`
          : '';
        const title = `Comprar ${product?.name} | Arkya Store`;
        const desc = product?.description || product?.details || 'Descubrí este producto exclusivo en Arkya Store';
        const description = isJapanese && !desc.toLowerCase().includes('japon')
          ? `${desc} Producto original importado de Japón.`
          : desc;
        const absoluteImage = product?.image?.startsWith('http')
          ? product.image
          : `https://arkya.store${product.image}`;
        const productDescription = product?.price
          ? `${description} Precio: ${priceStr}. Envíos a todo el país.`
          : `${description} Envíos a todo el país.`;
        return (
          <SEO
            title={title}
            description={productDescription}
            image={absoluteImage}
            url={`https://arkya.store/product/${product ? getProductSlug(product) : ''}`}
            type="product"
            price={product?.price || 0}
            currency="ARS"
            availability={product?.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}
          />
        );
      })()}
      {/* BreadcrumbList JSON-LD */}
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Inicio',
                  item: 'https://arkya.store/',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: (product.categories && product.categories.length > 0)
                    ? product.categories[0]
                    : (product.category || 'Productos'),
                  item: 'https://arkya.store/',
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: product.name,
                },
              ],
            }),
          }}
        />
      )}
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
              bg="pink.400"
              color="white"
              onClick={handleConfirmAge}
              size="lg"
              width="full"
              _hover={{
                bg: 'pink.500',
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
            Comprar por Instagram
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
                  {['Hola! Me interesa el siguiente producto:', product?.name, `$${Math.round(product?.price || 0).toLocaleString()}`, `https://arkya.store/product/${getProductSlug(product)}`].map((line, i, arr) => (
                    <>
                      {line}
                      {i < arr.length - 1 && <br />}
                    </>
                  ))}
                </Box>
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter gap={3} justifyContent="center">
            <Button 
              variant="ghost" 
              size="lg"
              onClick={onInstagramClose}
            >
              Cancelar
            </Button>
            <Button
              colorScheme="pink"
              size="lg"
              leftIcon={<FaInstagram />}
              onClick={handleCopyAndOpenInstagram}
              _hover={{
                bg: 'pink.500',
                transform: 'translateY(-2px)',
                boxShadow: 'xl',
              }}
            >
              Copiar y abrir Instagram
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

      {/* Modal para pedir Instagram/Email al dar like */}
      <Modal isOpen={isLikeModalOpen} onClose={onLikeModalClose} isCentered size="sm">
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent bg={modalBgColor} borderRadius="lg" boxShadow="xl">
          <ModalHeader borderBottomWidth="1px" borderColor={dividerColor}>
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
                bg={likeInputBg}
                borderColor={likeInputBorder}
                _focus={{ borderColor: 'pink.400' }}
              />
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="1px" borderColor={dividerColor}>
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
            <Box
              position="relative"
              overflow="hidden"
              borderRadius="lg"
              w="100%"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
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

              <Image
                alt={`${product.name} - imagen principal del producto - Arkya Store`}
                src={currentImage}
                fit={'cover'}
                align={'center'}
                w={'100%'}
                h={{ base: '400px', sm: '500px', lg: '600px' }}
                transition="transform 0.2s"
                _hover={{ transform: 'scale(1.03)', cursor: 'pointer' }}
                filter={product.adultContent && !isAgeVerified ? 'blur(15px) grayscale(0.5)' : 'none'}
                loading="eager"
                fetchpriority="high"
                decoding="async"
                draggable={false}
                userSelect="none"
                htmlWidth={800}
                htmlHeight={600}
                onClick={() => {
                  if (!product.adultContent || isAgeVerified) {
                    setIsLightboxOpen(true);
                  }
                }}
              />

              {/* Botón de expandir imagen */}
              {(!product.adultContent || isAgeVerified) && (
                <IconButton
                  icon={<FaExpand />}
                  position="absolute"
                  top={4}
                  left={4}
                  size="sm"
                  colorScheme="whiteAlpha"
                  bg="blackAlpha.600"
                  color="white"
                  _hover={{ bg: 'blackAlpha.800' }}
                  onClick={() => setIsLightboxOpen(true)}
                  zIndex={2}
                  borderRadius="full"
                  aria-label="Expandir imagen"
                />
              )}

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
                    bg="pink.400"
                    color="white"
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
                        transition="all 0.1s"
                        _hover={{ bg: 'white' }}
                      />
                    ))}
                  </Flex>
                </>
              )}
            </Box>
            
            {/* Miniaturas de imágenes */}
            {productImages.length > 1 && (
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
                    transition="all 0.1s"
                    _hover={{ transform: 'scale(1.05)' }}
                    flexShrink={0}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - miniatura ${index + 1} de ${productImages.length}`}
                      w="80px"
                      h="80px"
                      objectFit="cover"
                      loading="lazy"
                      decoding="async"
                      htmlWidth={80}
                      htmlHeight={80}
                    />
                  </Box>
                ))}
              </Flex>
            )}
          </VStack>
          
          {/* Información del producto con diseño mejorado */}
          <Stack>
            <Box as={'header'}>
              <Flex align="flex-start" gap={3} mb={2}>
                <Heading
                  as="h1"
                  lineHeight={1.1}
                  fontWeight={600}
                  fontSize={{ base: '2xl', sm: '4xl', lg: '5xl' }}
                  bgGradient="linear(to-r, brand.400, pink.400)"
                  bgClip="text"
                  flex={1}
                  wordBreak="break-word">
                  {product.name}
                </Heading>
                <Flex gap={2} ml="auto" align="center">
                  <IconButton
                    aria-label="Me gusta"
                    icon={<FaHeart />}
                    size="md"
                    colorScheme="pink"
                    bg={isLiked(product.id) ? 'pink.600' : 'transparent'}
                    color={isLiked(product.id) ? 'white' : 'white'}
                    variant={isLiked(product.id) ? "solid" : "ghost"}
                    borderRadius="full"
                    onClick={() => {
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
                  <IconButton
                    aria-label="Compartir producto"
                    icon={<FaShareAlt />}
                    size="md"
                    colorScheme="brand"
                    bg="whiteAlpha.200"
                    color="white"
                    variant="ghost"
                    borderRadius="full"
                    onClick={handleShare}
                    _hover={{ bg: 'whiteAlpha.300', transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                  />
                </Flex>
              </Flex>
              <VStack align="start" spacing={2} width="100%">
                {product.isOnOffer && product.discountPercentage > 0 ? (
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
                          (puede bajar o subir)
                        </Text>
                      )}
                    </Flex>
                    <Flex width="100%">
                      <Badge colorScheme="red" variant="solid" px={2} py={1} borderRadius="md" mr={2}>
                        {product.discountPercentage}% OFF (ahorrá ${Math.round(product.originalPrice - product.price).toLocaleString()})
                      </Badge>
                      <Badge colorScheme={product.inStock ? "orange" : "red"} variant="solid" px={2} py={1} borderRadius="md">
                        {product.inStock ? "ÚLTIMA UNIDAD" : "SIN STOCK"}
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
                          (puede bajar o subir)
                        </Text>
                      )}
                    </Flex>
                    <Badge colorScheme={product.inStock ? "orange" : "red"} variant="solid" px={2} py={1} borderRadius="md">
                      {product.inStock ? "ÚLTIMA UNIDAD" : "SIN STOCK"}
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
                
                <Text fontSize="sm" color={descriptionColor} fontWeight="medium">
                  👀 {getDailyViewers(product.id)} personas vieron este producto hoy
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
                  bg="pink.400"
                  color={'white'}
                  fontWeight="bold"
                  w="full"
                  _hover={{
                    bg: 'pink.500',
                    transform: 'translateY(-2px)',
                    boxShadow: 'xl',
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

    {/* Lightbox - Modal para ver imagen ampliada */}
    <Modal isOpen={isLightboxOpen} onClose={() => setIsLightboxOpen(false)} size="full" isCentered>
      <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(8px)" />
      <ModalContent bg="transparent" boxShadow="none" maxW="100vw" maxH="100vh" onClick={() => setIsLightboxOpen(false)}>
        <ModalCloseButton color="white" size="lg" zIndex={2} />
        <ModalBody
          p={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          position="relative"
          onTouchStart={(e) => {
            setTouchEnd(null);
            setTouchStart(e.targetTouches[0].clientX);
          }}
          onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
          onTouchEnd={() => {
            if (touchStart === null || touchEnd === null) return;
            const distance = touchStart - touchEnd;
            if (distance > 50 && currentImageIndex < productImages.length - 1) nextImage();
            if (distance < -50 && currentImageIndex > 0) prevImage();
            setTouchStart(null);
            setTouchEnd(null);
          }}
        >
          <Box onClick={(e) => e.stopPropagation()} display="flex" alignItems="center" justifyContent="center" w="100%" h="100%">
            <Image
              src={currentImage}
              alt={product?.name}
              maxH="90vh"
              maxW="90vw"
              objectFit="contain"
              borderRadius="md"
              draggable={false}
              userSelect="none"
            />

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
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
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
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  zIndex={2}
                  borderRadius="full"
                >
                  <FaChevronRight />
                </Button>
              </>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
    </>
  );
}
