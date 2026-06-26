import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-GN008QQ3L2', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
}
