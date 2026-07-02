import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Flex,
  Box,
  Heading,
  Text,
  Button,
  Image,
  Icon,
  HStack,
} from '@chakra-ui/react';
import { FaInstagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  '/images/hero1.webp',
  '/images/hero2.webp',
  '/images/hero3.webp',
  '/images/hero5.webp',
  '/images/hero4.webp',
];

const MotionImage = motion(Image);

export default function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + HERO_IMAGES.length) % HERO_IMAGES.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box bg="#453641" w="full" color="white">
      <Container maxW={'7xl'} >
        <Stack
          align={'center'}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 10, md: 10 }}
          direction={{ base: 'column', md: 'row' }}>
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              as="h1"
              lineHeight={1.1}
              fontWeight={700}
              fontSize={{ base: '3xl', sm: '4xl', lg: '5xl' }}>
              <Text
                as={'span'}
                position={'relative'}
                color="white">
                Arkya Store
              </Text>
              <br />
              <Text as={'span'} color={'pink.300'} fontStyle="italic">
                Artículos Importados de Japón
              </Text>
            </Heading>
            <Text color={'gray.300'} fontSize={"md"}>
              Descubrí Artbooks, Dōjinshi (Doujinshi), Mangas, Guías oficiales, Novelas Ligeras,
              Revistas (Jump, etc.), Figuras y merchandising exclusivo importado directamente desde
              Japón. Productos originales de calidad que no encontrás en ningún otro lado.
              Hacemos envíos a todo el país y también traemos artículos a pedido.
              Contactanos por Instagram @arkya.store
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}>

              <Button
                as={'a'}
                href={'https://instagram.com/arkya.store'}
                target="_blank"
                rel="noopener noreferrer"
                rounded={'md'}
                size={'md'}
                fontWeight={'medium'}
                px={6}
                leftIcon={<Icon as={FaInstagram} h={4} w={4} />}
                colorScheme={'gray'}
                bg={'transparent'}
                border="1px"
                borderColor="white"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}>
                Instagram
              </Button>
            </Stack>
          </Stack>
          <Flex
            flex={1}
            justify={'center'}
            align={'center'}
            position={'relative'}
            w={'full'}>
            <Box
              as="a"
              href="https://www.instagram.com/arkya.store/"
              target="_blank"
              rel="noopener noreferrer"
              position={'relative'}
              rounded={'2xl'}
              boxShadow={'2xl'}
              width={'400px'}
              height={'400px'}
              overflow={'hidden'}
              backgroundImage="linear-gradient(45deg, #241521, #3a2235)"
              transform={'perspective(1000px) rotateY(-5deg)'}
              transition={'all 0.5s ease'}
              cursor="pointer"
              _hover={{
                transform: 'perspective(1000px) rotateY(0deg)',
              }}>
              <AnimatePresence mode="wait" initial={false}>
                <MotionImage
                  key={currentIndex}
                  alt={'Artículos importados de Japón - Arkya Store'}
                  fit={'cover'}
                  align={'center'}
                  w={'100%'}
                  h={'100%'}
                  src={HERO_IMAGES[currentIndex]}
                  htmlWidth={500}
                  htmlHeight={500}
                  fetchpriority="high"
                  loading="eager"
                  decoding="async"
                  initial={{ opacity: 0, x: direction * 80, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: direction * -80, scale: 0.95 }}
                  transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </AnimatePresence>

              {/* Overlay rosa por encima de la imagen */}
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bgGradient="linear(to-tr, pink.600, purple.600)"
                opacity={0.45}
                mixBlendMode="overlay"
                pointerEvents="none"
                zIndex={1}
              />

              {/* Flecha izquierda */}
              <Box
                position="absolute"
                left={2}
                top="50%"
                transform="translateY(-50%)"
                zIndex={3}
                cursor="pointer"
                _hover={{ transform: 'translateY(-50%) scale(1.2)' }}
                transition="all 0.2s ease"
                p={2}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); goPrev(); }}
              >
                <Icon as={FaChevronLeft} color="white" boxSize={6} />
              </Box>

              {/* Flecha derecha */}
              <Box
                position="absolute"
                right={2}
                top="50%"
                transform="translateY(-50%)"
                zIndex={3}
                cursor="pointer"
                _hover={{ transform: 'translateY(-50%) scale(1.2)' }}
                transition="all 0.2s ease"
                p={2}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); goNext(); }}
              >
                <Icon as={FaChevronRight} color="white" boxSize={6} />
              </Box>
              {/* Indicadores de imagen */}
              <HStack
                position="absolute"
                bottom={3}
                left="50%"
                transform="translateX(-50%)"
                spacing={2}
                zIndex={2}
              >
                {HERO_IMAGES.map((_, idx) => (
                  <Box
                    key={idx}
                    w={idx === currentIndex ? 6 : 2}
                    h={2}
                    borderRadius="full"
                    bg={idx === currentIndex ? 'pink.400' : 'whiteAlpha.500'}
                    transition="all 0.3s ease"
                    cursor="pointer"
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentIndex(idx); }}
                  />
                ))}
              </HStack>
            </Box>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}

const Blob = (props) => {
  return (
    <Icon
      width={'100%'}
      viewBox="0 0 578 440"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M239.184 439.443c-55.13-5.419-110.241-21.365-151.074-58.767C42.307 338.722-7.478 282.729.938 221.217c8.433-61.644 78.896-91.048 126.871-130.712 34.337-28.388 70.198-51.348 112.004-66.78C282.34 8.024 325.382-3.369 370.518.904c54.019 5.115 112.774 10.886 150.881 49.482 39.916 40.427 49.421 100.753 53.385 157.402 4.13 59.015 11.255 128.44-30.444 170.44-41.383 41.683-111.6 19.106-169.213 30.663-46.68 9.364-88.56 35.21-135.943 30.551z"
        fill="currentColor"
      />
    </Icon>
  );
};
