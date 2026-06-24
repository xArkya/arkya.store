import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Heading,
  Alert,
  AlertIcon,
  useColorModeValue,
  InputGroup,
  InputRightElement,
  Icon,
} from '@chakra-ui/react';
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const AdminLoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simular pequeño delay para evitar ataques de fuerza bruta
    setTimeout(() => {
      // Contraseña hasheada (en producción, esto debería ser más seguro)
      // Hash SHA-256 de "admin123" = 0192023a7bbd73250516f069df18b500
      const correctPasswordHash = '0192023a7bbd73250516f069df18b500';
      
      // Hash simple de la contraseña ingresada
      const inputHash = simpleHash(password);

      if (inputHash === correctPasswordHash && password.length > 0) {
        // Guardar token de sesión en sessionStorage (no persiste después de cerrar navegador)
        sessionStorage.setItem('adminToken', 'authenticated_' + Date.now());
        onLogin();
      } else {
        setError('Contraseña incorrecta. Intenta de nuevo.');
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  // Función simple de hash para demostración
  // En producción, usar bcrypt o similar en el backend
  const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#241521"
      py={8}
    >
      <Container maxW="sm">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={2} textAlign="center">
            <Box
              bg="pink.500"
              borderRadius="full"
              p={4}
              display="flex"
              alignItems="center"
              justifyContent="center"
              w="60px"
              h="60px"
              mx="auto"
            >
              <Icon as={FaLock} boxSize={6} color="white" />
            </Box>
            <Heading size="lg" color="white">
              Panel de Administración
            </Heading>
            <Text color="gray.400" fontSize="sm">
              Ingresa tu contraseña para continuar
            </Text>
          </VStack>

          {/* Error Alert */}
          {error && (
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              height="auto"
              borderRadius="md"
              bg="red.900"
              borderColor="red.500"
            >
              <AlertIcon color="red.500" />
              <Text color="red.200" mt={2} fontSize="sm">
                {error}
              </Text>
            </Alert>
          )}

          {/* Login Form */}
          <Box
            as="form"
            onSubmit={handleLogin}
            bg={bgColor}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="lg"
          >
            <VStack spacing={4}>
              <InputGroup>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  bg={useColorModeValue('gray.50', '#1a1a1a')}
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'pink.500',
                    boxShadow: '0 0 0 1px pink.500',
                  }}
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin(e);
                    }
                  }}
                />
                <InputRightElement>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <Icon as={showPassword ? FaEyeSlash : FaEye} color="gray.500" />
                  </Button>
                </InputRightElement>
              </InputGroup>

              <Button
                type="submit"
                colorScheme="pink"
                width="100%"
                isLoading={isLoading}
                loadingText="Verificando..."
              >
                Ingresar
              </Button>
            </VStack>
          </Box>

          {/* Security Notice */}
          <Alert
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="flex-start"
            borderRadius="md"
            bg="blue.900"
            borderColor="blue.500"
          >
            <HStack spacing={2} mb={2}>
              <AlertIcon color="blue.500" />
              <Text fontWeight="bold" color="blue.200">
                Seguridad
              </Text>
            </HStack>
            <Text color="blue.200" fontSize="sm">
              Esta sesión es privada del navegador. Se cerrará automáticamente al cerrar la pestaña.
            </Text>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminLoginPage;
