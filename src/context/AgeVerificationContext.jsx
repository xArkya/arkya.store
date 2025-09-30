import React, { createContext, useState } from 'react';

// Crear el contexto
const AgeVerificationContext = createContext();

// Exportar el contexto para que pueda ser importado en otros archivos
export { AgeVerificationContext };

// Proveedor del contexto
export const AgeVerificationProvider = ({ children }) => {
  // Estado para controlar si el usuario ha verificado su edad
  const [isAgeVerified, setIsAgeVerified] = useState(() => {
    // Verificar si hay una confirmación global de edad en localStorage
    return localStorage.getItem('globalAgeConfirmed') === 'true';
  });

  // Función para verificar la edad
  const verifyAge = () => {
    setIsAgeVerified(true);
    localStorage.setItem('globalAgeConfirmed', 'true');
  };

  // Exponer el estado y las funciones a través del contexto
  const value = {
    isAgeVerified,
    verifyAge
  };

  return (
    <AgeVerificationContext.Provider value={value}>
      {children}
    </AgeVerificationContext.Provider>
  );
};
