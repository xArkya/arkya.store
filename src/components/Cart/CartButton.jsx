import React, { useEffect } from 'react';
import { IconButton, Badge, Box, useDisclosure } from '@chakra-ui/react';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/useCart';
import CartDrawer from './CartDrawer';

const CartButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { cartItemsCount } = useCart();

  useEffect(() => {
    const handleOpenCart = () => onOpen();
    window.addEventListener('open-cart', handleOpenCart);
    return () => window.removeEventListener('open-cart', handleOpenCart);
  }, [onOpen]);

  return (
    <>
      <Box position="relative" display="inline-block">
        <IconButton
          aria-label="Carrito de compras"
          icon={<FaShoppingCart />}
          variant="ghost"
          onClick={onOpen}
        />
        {cartItemsCount > 0 && (
          <Badge
            colorScheme="brand"
            borderRadius="full"
            position="absolute"
            top="-2px"
            right="-2px"
            fontSize="0.8em"
          >
            {cartItemsCount}
          </Badge>
        )}
      </Box>
      <CartDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
};

export default CartButton;
