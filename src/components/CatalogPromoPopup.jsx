import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  VStack,
  Heading,
  Text,
  Button,
  Badge,
} from '@chakra-ui/react';
import { FaBookOpen } from 'react-icons/fa';

// Popup promocional del catálogo a pedido. Se muestra una sola vez por
// visitante (localStorage) y solo durante el mes de lanzamiento.
const PROMO_END = new Date('2026-10-23T23:59:59');
const STORAGE_KEY = 'arkya_catalog_promo_seen';

export default function CatalogPromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (new Date() > PROMO_END) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      const t = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(t);
    } catch {
      // storage bloqueado — no mostrar
    }
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
  };

  return (
    <Modal isOpen={open} onClose={close} isCentered size="md">
      <ModalOverlay bg="rgba(36, 21, 33, 0.85)" backdropFilter="blur(6px)" />
      <ModalContent bg="#2d1e2a" color="white" mx={4} borderRadius="xl">
        <ModalCloseButton />
        <ModalBody py={10} px={8}>
          <VStack spacing={5} textAlign="center">
            <Badge colorScheme="pink" borderRadius="full" px={3} py={1} fontSize="sm">
              Nuevo
            </Badge>
            <Heading size="lg" lineHeight="1.3">
              Catálogo a pedido desde Japón
            </Heading>
            <Text color="whiteAlpha.800" fontSize="md">
              Ahora podés buscar entre miles de libros y
              doujinshi de Japón y pedirlos directamente por Instagram!
            </Text>
            <Button
              as={RouterLink}
              to="/catalogo"
              colorScheme="pink"
              size="lg"
              borderRadius="full"
              leftIcon={<FaBookOpen />}
              onClick={close}
              w="full"
            >
              Explorar el catálogo
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
