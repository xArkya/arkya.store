// Cupones de descuento disponibles
// Los cupones se gestionan desde el panel de administración
const loadCoupons = () => {
  try {
    const savedCoupons = localStorage.getItem('coupons');
    return savedCoupons ? JSON.parse(savedCoupons) : [];
  } catch (error) {
    console.error('Error al cargar cupones:', error);
    return [];
  }
};

export const coupons = loadCoupons();

// Función para validar un cupón
export const validateCoupon = (code, cartTotal) => {
  // Recargar cupones desde localStorage para obtener los más recientes
  const currentCoupons = loadCoupons();
  const coupon = currentCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());
  
  if (!coupon) {
    return { valid: false, message: 'Cupón no válido' };
  }
  
  if (!coupon.isActive) {
    return { valid: false, message: 'Este cupón ya no está activo' };
  }
  
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Este cupón ha alcanzado su límite de uso' };
  }
  
  if (cartTotal < coupon.minPurchase) {
    return { 
      valid: false, 
      message: `Compra mínima de $${coupon.minPurchase.toLocaleString()} requerida` 
    };
  }
  
  const now = new Date();
  const expiry = new Date(coupon.expiryDate);
  if (now > expiry) {
    return { valid: false, message: 'Este cupón ha expirado' };
  }
  
  return { 
    valid: true, 
    coupon,
    discount: Math.round(cartTotal * (coupon.discountPercentage / 100))
  };
};
