import { useContext } from 'react';
import { AgeVerificationContext } from './AgeVerificationContext';

// Hook personalizado para usar el contexto
export const useAgeVerification = () => {
  const context = useContext(AgeVerificationContext);
  if (!context) {
    throw new Error('useAgeVerification debe ser usado dentro de un AgeVerificationProvider');
  }
  return context;
};
