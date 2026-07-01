import {
  Box,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Text,
  IconButton,
  VStack,
  HStack,
  Image,
  Button,
  Badge,
  Flex,
  useDisclosure,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { FaHistory, FaHeart, FaTrash, FaShoppingBag, FaEye } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { useLikes } from '../hooks/useLikes';

export default function RecentlyViewedDrawer() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { recentlyViewed, clearRecentlyViewed, removeRecentlyViewed } = useRecentlyViewed();
  const { isLiked, toggleLike } = useLikes();

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hoy';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} d`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <Tooltip label="Visto recientemente" hasArrow placement="bottom">
        <IconButton
          aria-label="Visto recientemente"
          icon={<FaHistory />}
          variant="ghost"
          color="white"
          size="md"
          onClick={onOpen}
          position="relative"
        />
      </Tooltip>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
        <DrawerOverlay backdropFilter="blur(2px)" />
        <DrawerContent bg="#241521" color="white" borderLeftColor="whiteAlpha.100">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.100">
            <HStack spacing={3}>
              <FaEye color="#ec4899" />
              <Text>Visto recientemente</Text>
              {recentlyViewed.length > 0 && (
                <Badge colorScheme="pink" borderRadius="full" px={2}>
                  {recentlyViewed.length}
                </Badge>
              )}
            </HStack>
          </DrawerHeader>

          <DrawerBody p={0}>
            {recentlyViewed.length === 0 ? (
              <VStack py={20} spacing={4} px={6}>
                <FaEye size={48} color="rgba(255,255,255,0.2)" />
                <Text color="whiteAlpha.600" textAlign="center">
                  Todavía no visitaste ningún producto.
                </Text>
                <Button
                  as={RouterLink}
                  to="/"
                  colorScheme="pink"
                  leftIcon={<FaShoppingBag />}
                  onClick={onClose}
                >
                  Ver productos
                </Button>
              </VStack>
            ) : (
              <VStack spacing={0} align="stretch">
                {recentlyViewed.map((product) => (
                  <Box key={product.id}>
                    <Flex
                      p={4}
                      gap={4}
                      align="flex-start"
                      _hover={{ bg: 'whiteAlpha.50' }}
                      transition="background 0.2s"
                    >
                      <Box
                        as={RouterLink}
                        to={`/product/${product.slug || product.id}`}
                        onClick={onClose}
                        flexShrink={0}
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          boxSize="80px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="/images/logo2.webp"
                        />
                      </Box>

                      <Box flex="1" minW={0}>
                        <Text
                          as={RouterLink}
                          to={`/product/${product.slug || product.id}`}
                          onClick={onClose}
                          fontSize="sm"
                          fontWeight="semibold"
                          color="white"
                          noOfLines={2}
                          _hover={{ color: 'pink.300' }}
                          transition="color 0.2s"
                          display="block"
                          mb={1}
                        >
                          {product.name}
                        </Text>

                        <HStack spacing={2} mb={1}>
                          <Text fontSize="sm" fontWeight="bold" color="pink.400">
                            ${Math.round(product.price).toLocaleString()}
                          </Text>
                          <Text fontSize="xs" color="whiteAlpha.500">
                            {formatDate(product.viewedAt)}
                          </Text>
                        </HStack>

                        <Badge
                          size="sm"
                          colorScheme={product.inStock !== false ? 'green' : 'red'}
                          variant="subtle"
                        >
                          {product.inStock !== false ? 'En stock' : 'Sin stock'}
                        </Badge>
                      </Box>

                      <VStack spacing={1} align="center">
                        <IconButton
                          aria-label="Eliminar del historial"
                          icon={<FaTrash />}
                          size="xs"
                          variant="ghost"
                          color="whiteAlpha.400"
                          _hover={{ color: 'red.400' }}
                          onClick={() => removeRecentlyViewed(product.id)}
                        />
                        <IconButton
                          aria-label={isLiked(product.id) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                          icon={<FaHeart />}
                          size="xs"
                          variant="ghost"
                          color={isLiked(product.id) ? 'pink.400' : 'whiteAlpha.400'}
                          _hover={{ color: 'pink.400' }}
                          onClick={() => {
                            // Necesitamos reconstruir el producto mínimo para toggleLike
                            toggleLike({ id: product.id, name: product.name, price: product.price });
                          }}
                        />
                      </VStack>
                    </Flex>
                    <Divider borderColor="whiteAlpha.50" />
                  </Box>
                ))}

                <Flex justify="center" py={4}>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="whiteAlpha.500"
                    leftIcon={<FaTrash />}
                    onClick={clearRecentlyViewed}
                    _hover={{ color: 'red.300' }}
                  >
                    Limpiar historial
                  </Button>
                </Flex>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
