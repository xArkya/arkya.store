import { useState, useEffect } from 'react';
import { GAME_DEADLINE } from '../data/animeGame';

function getTargetDate() {
  return new Date(GAME_DEADLINE);
}

export function useGameCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const target = getTargetDate();
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
