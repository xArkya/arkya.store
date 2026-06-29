import { Box, Container, Text, HStack, Badge, Button, Flex } from '@chakra-ui/react';
import { FaClock, FaTag } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const MotionBox = motion(Box);

export default function PromoBanner({ offer }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!offer.endDate) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const end = new Date(offer.endDate);
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('¡Oferta finalizada!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [offer.endDate]);

  if (!offer.isActive) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bg="linear-gradient(135deg, #d53f8c 0%, #b83280 100%)"
      py={4}
      position="relative"
      overflow="hidden"
    >
      {/* Efecto de brillo animado */}
      <Box
        position="absolute"
        top="-50%"
        left="-50%"
        width="200%"
        height="200%"
        bg="radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)"
        animation="pulse 3s ease-in-out infinite"
      />

      <Container maxW="container.xl" position="relative" zIndex={1}>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          align="center"
          justify="space-between"
          gap={4}
        >
          <HStack spacing={4} flex={1}>
            <FaTag size="24px" color="white" />
            <Box>
              <Text color="white" fontWeight="bold" fontSize={{ base: 'lg', md: 'xl' }}>
                {offer.title || 'descuentos en toda la tienda'}
              </Text>
              <Text color="whiteAlpha.900" fontSize={{ base: 'sm', md: 'md' }}>
                {offer.description || 'En productos seleccionados'}
              </Text>
            </Box>
          </HStack>

          {offer.endDate && timeLeft && timeLeft !== '¡Oferta finalizada!' && (
            <HStack
              spacing={3}
              bg="whiteAlpha.200"
              px={4}
              py={2}
              borderRadius="full"
              backdropFilter="blur(10px)"
            >
              <FaClock color="white" />
              <Box>
                <Text color="white" fontSize="xs" fontWeight="semibold">
                  Termina en:
                </Text>
                <Text color="white" fontSize="lg" fontWeight="bold" fontFamily="mono">
                  {timeLeft}
                </Text>
              </Box>
            </HStack>
          )}
        </Flex>
      </Container>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-10%, -10%) scale(1.1); }
          }
        `}
      </style>
    </MotionBox>
  );
}
