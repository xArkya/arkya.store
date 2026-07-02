import { useState, useEffect } from 'react';

function getNextTargetDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based
  const currentDate = now.getDate();

  let target;
  if (currentDate < 3) {
    // Aún no llegamos al día 3 de este mes
    target = new Date(currentYear, currentMonth, 3, 0, 0, 0);
  } else {
    // Ya pasó el día 3, apuntar al 3 del mes siguiente
    target = new Date(currentYear, currentMonth + 1, 3, 0, 0, 0);
  }
  return target;
}

export function useGameCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = getNextTargetDate();
      const diff = target - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('¡Se acabó!');
        return;
      }

      setIsExpired(false);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return { timeLeft, isExpired };
}
