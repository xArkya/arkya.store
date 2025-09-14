import { useContext } from 'react';
import { CartContext } from './CartContext';

// Hook personalizado para usar el contexto
export const useCart = () => {
  return useContext(CartContext);
};
