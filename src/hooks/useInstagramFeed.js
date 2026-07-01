import { useState, useEffect } from 'react';
import {
  INSTAGRAM_POSTS,
  INSTAGRAM_MAX_POSTS,
} from '../data/instagramConfig';

export function useInstagramFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carga breve para que el skeleton se vea bien
    const timer = setTimeout(() => {
      if (INSTAGRAM_POSTS.length > 0) {
        setPosts(INSTAGRAM_POSTS.slice(0, INSTAGRAM_MAX_POSTS));
      }
      setLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const hasPosts = posts.length > 0;

  return { posts, loading, hasPosts };
}
