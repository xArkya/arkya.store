import { useState, useEffect } from 'react';
import { CartContext } from './CartContext';
import { useToast } from '@chakra-ui/react';

// Función para optimizar los datos del producto antes de guardarlos
const optimizeProductData = (product) => {
  // Extraer solo los campos absolutamente esenciales para el carrito
  // Reducimos al máximo para permitir muchos productos
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    // Guardar solo la primera imagen o una referencia mínima
    image: typeof product.image === 'string' && product.image.startsWith('data:') 
      ? 'img_' + product.id // Para imágenes data:URL, solo guardar una referencia
      : product.image,
    // Solo guardar flags booleanos y valores numéricos esenciales
    ...(product.isOnOffer ? { isOnOffer: true } : {}),
    ...(product.discountPercentage ? { discountPercentage: product.discountPercentage } : {})
  };
};

// Comprimir datos para reducir el tamaño de almacenamiento
const compressCartData = (cart) => {
  // Crear una versión ultra-optimizada del carrito
  // Formato: [{id,q,p,i}] donde id=id, q=quantity, p=price, i=imageRef
  return cart.map(item => {
    const optimized = optimizeProductData(item);
    return {
      i: optimized.id, // id del producto
      q: item.quantity, // cantidad
      p: optimized.price, // precio
      n: optimized.name.substring(0, 20), // nombre truncado
      ...(optimized.isOnOffer ? { o: optimized.discountPercentage } : {}) // descuento si hay oferta
    };
  });
};

// Descomprimir datos para uso en la aplicación
const decompressCartData = (compressedCart, productsCache) => {
  return compressedCart.map(item => {
    // Intentar recuperar datos completos desde cache si están disponibles
    const cachedProduct = productsCache[item.i];
    
    return {
      id: item.i,
      name: item.n || (cachedProduct ? cachedProduct.name : `Producto ${item.i}`),
      price: item.p,
      image: cachedProduct ? cachedProduct.image : null,
      quantity: item.q,
      ...(item.o ? { isOnOffer: true, discountPercentage: item.o } : {})
    };
  });
};

// Función para guardar el carrito en localStorage con manejo de errores
const saveCartToStorage = (cart) => {
  try {
    // Comprimir el carrito para máxima eficiencia de almacenamiento
    const compressedCart = compressCartData(cart);
    
    // Guardar versión comprimida
    localStorage.setItem('cart', JSON.stringify(compressedCart));
    return true;
  } catch (error) {
    console.error('Error al guardar el carrito en localStorage:', error);
    
    // Intentar limpiar otros datos menos importantes si hay error de cuota
    if (error.name === 'QuotaExceededError') {
      try {
        // Eliminar todos los datos no esenciales para liberar espacio
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== 'cart' && key !== 'globalAgeConfirmed') {
            localStorage.removeItem(key);
          }
        }
        
        // Intentar guardar de nuevo con compresión máxima
        const compressedCart = compressCartData(cart);
        localStorage.setItem('cart', JSON.stringify(compressedCart));
        return true;
      } catch (innerError) {
        console.error('No se pudo liberar espacio en localStorage:', innerError);
        return false;
      }
    }
    return false;
  }
};

// Proveedor del contexto
export const CartProvider = ({ children }) => {
  // Inicializar toast para notificaciones
  const toast = useToast();
  
  // Cache para almacenar datos completos de productos
  const [productsCache, setProductsCache] = useState({});
  
  // Intentar cargar el carrito desde localStorage al iniciar
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        // Intentar parsear el carrito comprimido
        const compressedCart = JSON.parse(savedCart);
        // Si es formato antiguo (con id completo), usarlo directamente
        if (compressedCart.length > 0 && compressedCart[0].id) {
          return compressedCart;
        }
        // Si es formato nuevo comprimido, descomprimirlo
        return decompressCartData(compressedCart, {});
      }
      return [];
    } catch (error) {
      console.error('Error al cargar el carrito desde localStorage:', error);
      return [];
    }
  });
  
  // Estado para controlar si hubo error de almacenamiento
  const [storageError, setStorageError] = useState(false);
  
  // Estado para evitar mostrar múltiples notificaciones
  const [errorNotified, setErrorNotified] = useState(false);

  // Guardar el carrito en localStorage cada vez que cambie
  useEffect(() => {
    if (cart.length > 0) {
      const success = saveCartToStorage(cart);
      const newErrorState = !success;
      
      // Actualizar el estado de error solo si hay un cambio
      if (newErrorState !== storageError) {
        setStorageError(newErrorState);
      }
      
      // Solo mostrar notificación de error si realmente no se pudo guardar
      // después de todos los intentos de optimización
      if (newErrorState && !errorNotified) {
        toast({
          title: 'Advertencia de almacenamiento',
          description: 'Algunos datos del carrito podrían no guardarse completamente. Tus productos están seguros, pero considera finalizar tu compra pronto.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        setErrorNotified(true);
      }
    } else {
      // Si el carrito está vacío, simplemente limpiarlo
      try {
        localStorage.removeItem('cart');
        setStorageError(false);
        setErrorNotified(false); // Resetear el estado de notificación
      } catch (error) {
        console.error('Error al limpiar el carrito en localStorage:', error);
      }
    }
  }, [cart, storageError, errorNotified, toast]);
  
  // Actualizar cache de productos cuando se agregan al carrito
  useEffect(() => {
    // Extraer datos completos de productos para cache
    const newCache = {...productsCache};
    let hasChanges = false;
    
    cart.forEach(item => {
      if (item.id && !newCache[item.id]) {
        newCache[item.id] = {
          name: item.name,
          price: item.price,
          image: item.image
        };
        hasChanges = true;
      }
    });
    
    // Solo actualizar el cache si hay cambios para evitar bucles
    if (hasChanges) {
      setProductsCache(newCache);
    }
  }, [cart, productsCache]);

  // Agregar un producto al carrito
  const addToCart = (product, quantity = 1) => {
    // Agregar al cache de productos para mantener datos completos en memoria
    setProductsCache(prev => ({
      ...prev,
      [product.id]: {
        name: product.name,
        price: product.price,
        image: product.image
      }
    }));
    
    setCart(prevCart => {
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = prevCart.findIndex(item => item.id === product.id);
      
      if (existingItemIndex >= 0) {
        // Si el producto ya existe, actualizar la cantidad
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + quantity
        };
        return updatedCart;
      } else {
        // Si el producto no existe, agregarlo al carrito con datos ultra-optimizados
        const optimizedProduct = optimizeProductData(product);
        const result = [...prevCart, { ...optimizedProduct, quantity }];
        
        // Mostrar notificación de éxito
        toast({
          title: 'Producto agregado',
          description: `${product.name} se ha agregado al carrito`,
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top-right'
        });
        
        return result;
      }
    });
  };

  // Eliminar un producto del carrito
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Actualizar la cantidad de un producto
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Limpiar el carrito
  const clearCart = () => {
    setCart([]);
  };

  // Calcular el total de productos en el carrito
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Calcular el precio total del carrito
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

  // Valores y funciones que se proporcionarán a través del contexto
  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartItemsCount,
    cartTotal,
    productsCache // Proporcionar el cache para acceso a datos completos
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
