import { useEffect } from 'react';
import { IconButton, Badge, Box, useDisclosure, Tooltip, VStack } from '@chakra-ui/react';
import { FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/useCart';
import { useLikes } from '../../hooks/useLikes';
import CartDrawer from './CartDrawer';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const FloatingCartButton = () => {
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { cartItemsCount } = useCart();
  const { likedProducts } = useLikes();

  useEffect(() => {
    const handleOpenCart = () => onOpen();
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [onOpen]);

  return (
    <>
      <MotionBox
        position="fixed"
        bottom={{ base: '20px', md: '30px' }}
        right={{ base: '20px', md: '30px' }}
        zIndex={1000}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <VStack spacing={3}>
          <Tooltip label="Ver carrito" placement="left" hasArrow>
            <Box position="relative">
              <IconButton
                aria-label="Carrito de compras"
                icon={<FaShoppingCart size="24px" />}
                size="lg"
                colorScheme="pink"
                borderRadius="full"
                boxShadow="2xl"
                onClick={onOpen}
                _hover={{
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
                width="60px"
                height="60px"
              />
              {cartItemsCount > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-5px"
                  right="-5px"
                  fontSize="0.9em"
                  minW="24px"
                  h="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </Badge>
              )}
            </Box>
          </Tooltip>

          <Tooltip label="Mis me gusta" placement="left" hasArrow>
            <Box position="relative">
              <IconButton
                aria-label="Mis me gusta"
                icon={<FaHeart size="22px" />}
                size="lg"
                colorScheme="pink"
                borderRadius="full"
                boxShadow="2xl"
                variant={likedProducts.length > 0 ? 'solid' : 'ghost'}
                bg={likedProducts.length > 0 ? 'pink.500' : '#241521'}
                onClick={() => {
                  navigate('/mis-me-gustas');
                }}
                _hover={{
                  transform: 'scale(1.1)',
                  boxShadow: '0 0 20px rgba(236, 72, 153, 0.6)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                transition="all 0.2s"
                width="60px"
                height="60px"
              />
              {likedProducts.length > 0 && (
                <Badge
                  colorScheme="red"
                  borderRadius="full"
                  position="absolute"
                  top="-5px"
                  right="-5px"
                  fontSize="0.9em"
                  minW="24px"
                  h="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {likedProducts.length > 99 ? '99+' : likedProducts.length}
                </Badge>
              )}
            </Box>
          </Tooltip>
        </VStack>
      </MotionBox>
      <CartDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default FloatingCartButton;
