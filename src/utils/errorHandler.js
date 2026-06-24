// Manejador de errores seguro que no expone detalles técnicos
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const safeErrorMessage = (error) => {
  // En desarrollo, mostrar el error completo
  if (isDevelopment) {
    console.error('Error técnico:', error);
  }

  // Mensajes seguros para el usuario
  const errorMessages = {
    'NetworkError': 'Error de conexión. Por favor, intenta de nuevo.',
    'TypeError': 'Hubo un error procesando tu solicitud.',
    'ReferenceError': 'Error interno de la aplicación.',
    'SyntaxError': 'Error procesando datos.',
    'RangeError': 'Valor fuera de rango permitido.',
  };

  // Obtener tipo de error
  const errorType = error?.name || 'Error';
  
  // Retornar mensaje seguro o genérico
  return errorMessages[errorType] || 'Algo salió mal. Por favor, intenta de nuevo más tarde.';
};

// Interceptar console.error en producción
export const setupErrorHandling = () => {
  if (!isDevelopment) {
    // Reemplazar console.error para no mostrar detalles técnicos
    // eslint-disable-next-line no-console
    console.error = () => {
      // Solo loguear en servidor, no mostrar al usuario
      // En producción, podrías enviar a un servicio de logging
    };

    // Manejar errores no capturados
    window.addEventListener('error', (event) => {
      // Prevenir que el error se muestre en consola
      event.preventDefault();
    });

    // Manejar promesas rechazadas no capturadas
    window.addEventListener('unhandledrejection', (event) => {
      event.preventDefault();
    });
  }
};

// Función para loguear errores de forma segura
export const logError = (error, context = '') => {
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, error);
  } else {
    // En producción, podrías enviar a un servicio de logging externo
    // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ error, context }) });
  }
};
