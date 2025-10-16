import { useState, useEffect } from 'react';
import { CartContext } from './CartContext';
import { useToast } from '@chakra-ui/react';

const CART_PLACEHOLDER_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80" fill="none"><rect width="80" height="80" rx="10" fill="#F1F1F1"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666666">Sin imagen</text></svg>'
)} `;

// Función para optimizar los datos del producto antes de guardarlos
const optimizeProductData = (product) => {
  // Extraer solo los campos absolutamente esenciales para el carrito
  // Reducimos al máximo para permitir muchos productos
  // Asegurarse de que siempre tengamos una imagen válida
  let imageValue;
  const numericPrice = Number(product.price) || 0;
  
  if (!product.image) {
    // Si no hay imagen, usar un placeholder
    imageValue = CART_PLACEHOLDER_IMAGE;
  } else if (typeof product.image === 'string') {
    // Guardar la cadena tal cual (puede ser data URL o una URL remota)
    imageValue = product.image;
  } else {
    // Para cualquier otro tipo, usar placeholder
    imageValue = CART_PLACEHOLDER_IMAGE;
  }
  
  // Asegurar que la imagen no sea undefined o null
  if (!imageValue) {
    imageValue = CART_PLACEHOLDER_IMAGE;
  }
  
  return {
    id: product.id,
    name: product.name,
    price: numericPrice,
    image: imageValue,
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
      p: Number(item.price ?? optimized.price) || 0, // precio
      q: typeof item.quantity === 'number' && !Number.isNaN(item.quantity) ? item.quantity : 1,
      n: optimized.name, // nombre completo
      img: item.image || optimized.image,
      ...(optimized.isOnOffer ? { o: optimized.discountPercentage } : {}) // descuento si hay oferta
    };
  });
};

// Descomprimir datos para uso en la aplicación
const decompressCartData = (compressedCart, productsCache) => {
  return compressedCart.map(item => {
    // Intentar recuperar datos completos desde cache si están disponibles
    const cachedProduct = productsCache[item.i];
    
    // Intentar obtener la imagen desde el caché o usar una URL de placeholder
    let imageUrl = item.img || CART_PLACEHOLDER_IMAGE;
    
    if (cachedProduct && cachedProduct.image) {
      imageUrl = cachedProduct.image;
    } else if (typeof item.i === 'string' && item.i.startsWith('img_')) {
      const productId = item.i.replace('img_', '');
      const cachedImage = productsCache[productId]?.image;
      if (cachedImage) {
        imageUrl = cachedImage;
      }
    }
    
    const quantity = typeof item.q === 'number' && !Number.isNaN(item.q) ? item.q : 1;
    const price = typeof item.p === 'number' && !Number.isNaN(item.p) ? item.p : Number(item.p) || 0;
    
    return {
      id: item.i,
      name: item.n || (cachedProduct ? cachedProduct.name : `Producto ${item.i}`),
      price,
      image: imageUrl, // Nunca será null
      quantity,
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
  }, [cart, storageError]);
  
  // Efecto separado para manejar las notificaciones
  useEffect(() => {
    // Solo mostrar notificación de error si realmente no se pudo guardar
    // después de todos los intentos de optimización
    if (storageError && !errorNotified) {
      // Usamos setTimeout para asegurarnos de que la notificación se muestre después del renderizado
      const timer = setTimeout(() => {
        toast({
          title: 'Advertencia de almacenamiento',
          description: 'Algunos datos del carrito podrían no guardarse completamente. Tus productos están seguros, pero considera finalizar tu compra pronto.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
          position: 'top'
        });
        setErrorNotified(true);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [storageError, errorNotified, toast]);
  
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
  const addToCart = (product) => {
    // Asegurarse de que el producto tenga una imagen válida antes de guardarlo en caché
    const safeImage = product.image || CART_PLACEHOLDER_IMAGE;
    const numericPrice = Number(product.price) || 0;
    
    // Agregar al cache de productos para mantener datos completos en memoria
    setProductsCache(prev => ({
      ...prev,
      [product.id]: {
        name: product.name,
        price: numericPrice,
        image: safeImage
      }
    }));
    
    // Verificar si el producto ya está en el carrito antes de intentar agregarlo
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    // Si el producto ya existe en el carrito, devolvemos false para indicar que no se agregó
    if (existingItemIndex >= 0) {
      return false;
    }
    
    // Si el producto no existe en el carrito, lo agregamos
    setCart(prevCart => {
      // Si el producto no existe, agregarlo al carrito con datos ultra-optimizados
      const optimizedProduct = optimizeProductData(product);
      const result = [...prevCart, { ...optimizedProduct, quantity: 1 }];
      
      return result;
    });
    
    // Devolvemos true para indicar que el producto se agregó correctamente
    return true;
  };

  // Eliminar un producto del carrito
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  // Ya no permitimos actualizar la cantidad de productos en el carrito

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
