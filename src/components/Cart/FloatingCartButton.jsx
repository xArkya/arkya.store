import { IconButton, Badge, Box, useDisclosure, Tooltip } from '@chakra-ui/react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/useCart';
import CartDrawer from './CartDrawer';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const FloatingCartButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { cartItemsCount } = useCart();

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
      </MotionBox>
      <CartDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default FloatingCartButton;
