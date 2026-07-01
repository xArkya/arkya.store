import { useState, useCallback } from 'react';

const STORAGE_KEY = 'arkya_recently_viewed';
const MAX_ITEMS = 20;

function getStoredItems() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function setStoredItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewedState] = useState(getStoredItems);

  const addRecentlyViewed = useCallback((product) => {
    if (!product || !product.id) return;

    const current = getStoredItems();
    const existingIndex = current.findIndex(item => item.id === product.id);

    let next;
    if (existingIndex !== -1) {
      // Mover al principio si ya existe
      next = [
        current[existingIndex],
        ...current.slice(0, existingIndex),
        ...current.slice(existingIndex + 1),
      ];
    } else {
      // Agregar al principio, guardar solo datos necesarios
      const minimalProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        slug: product.slug,
        category: product.category,
        inStock: product.inStock,
        viewedAt: new Date().toISOString(),
      };
      next = [minimalProduct, ...current].slice(0, MAX_ITEMS);
    }

    setStoredItems(next);
    setRecentlyViewedState(next);
  }, []);

  const clearRecentlyViewed = useCallback(() => {
    setStoredItems([]);
    setRecentlyViewedState([]);
  }, []);

  const removeRecentlyViewed = useCallback((productId) => {
    const current = getStoredItems();
    const next = current.filter(item => item.id !== productId);
    setStoredItems(next);
    setRecentlyViewedState(next);
  }, []);

  return { recentlyViewed, addRecentlyViewed, clearRecentlyViewed, removeRecentlyViewed };
}
