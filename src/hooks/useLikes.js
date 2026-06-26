import { useState, useCallback } from 'react';

const LIKES_KEY = 'arkya_liked_products';

// CONFIGURACIÓN GOOGLE FORMS
// 1. Creá un Google Form con estos campos: Producto, Precio, Fecha
// 2. Hacé clic en los 3 puntos > Obtener enlace para enviar prellenado
// 3. Elegí "Obtener enlace" y copiá la URL. Ejemplo:
//    https://docs.google.com/forms/d/e/FORM_ID/formResponse?usp=pp_url&entry.123=PRODUCTO&entry.456=PRECIO
// 4. Reemplazá FORM_ID, entry.123 y entry.456 con tus valores reales
// 5. Poné esa URL base acá abajo (sin los parámetros de entry):

const GOOGLE_FORM_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSeTtHuiqiyC8SSsxvGxTR3YjZ71JeEgibmvHIHqPHpZiekonw/formResponse';
const ENTRY_PRODUCT = 'entry.1114527237';
const ENTRY_ACTION = 'entry.358415071';
const ENTRY_PRICE = 'entry.1004601232';
const ENTRY_USER = 'entry.886898421';

const USER_KEY = 'arkya_like_user';

export function getLikeUser() {
  try {
    return localStorage.getItem(USER_KEY) || '';
  } catch {
    return '';
  }
}

export function setLikeUser(user) {
  localStorage.setItem(USER_KEY, user);
}

function getLikedProducts() {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY)) || [];
  } catch {
    return [];
  }
}

function setLikedProducts(list) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(list));
}

export function useLikes() {
  const [likedProducts, setLikedProductsState] = useState(getLikedProducts());

  const isLiked = useCallback((productId) => {
    return likedProducts.includes(String(productId));
  }, [likedProducts]);

  const toggleLike = useCallback((product) => {
    const productId = String(product.id);
    const current = getLikedProducts();
    let next;

    const isAdding = !current.includes(productId);
    if (isAdding) {
      next = [...current, productId];
    } else {
      next = current.filter(id => id !== productId);
    }

    // Enviar a Google Form si está configurado
    const user = getLikeUser();
    if (GOOGLE_FORM_BASE_URL && ENTRY_PRODUCT && ENTRY_PRICE && user) {
      const url = new URL(GOOGLE_FORM_BASE_URL);
      url.searchParams.set(ENTRY_PRODUCT, product.name);
      url.searchParams.set(ENTRY_ACTION, isAdding ? 'Añadido' : 'Removido');
      url.searchParams.set(ENTRY_PRICE, `$${product.price?.toLocaleString() || product.price}`);
      url.searchParams.set(ENTRY_USER, user);
      // Enviar sin esperar respuesta (no-cors para evitar CORS en GitHub Pages)
      fetch(url.toString(), { mode: 'no-cors', method: 'GET' }).catch(() => {});
    }

    setLikedProducts(next);
    setLikedProductsState(next);
    return !current.includes(productId);
  }, []);

  return { likedProducts, isLiked, toggleLike };
}
