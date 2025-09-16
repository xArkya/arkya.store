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
} from '@chakra-ui/react';
import { FaInstagram } from 'react-icons/fa';

export default function Hero() {
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
                Tienda Online
              </Text>
            </Heading>
            <Text color={'gray.300'} fontSize={"md"}>
              Productos exclusivos de alta calidad. Encuentra lo que buscas en nuestra tienda
              y contáctanos directamente por Instagram para realizar tu compra.
              ¡Envíos a todo el país! @arkya.store
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: 'column', sm: 'row' }}>

              <Button
                as={'a'}
                href={'https://instagram.com/arkya.store'}
                target="_blank"
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
              href="https://www.instagram.com/p/DOra7bzD-Ls/"
              target="_blank"
              rel="noopener noreferrer"
              position={'relative'}
              rounded={'2xl'}
              boxShadow={'2xl'}
              width={'550px'}
              overflow={'hidden'}
              backgroundImage="linear-gradient(45deg, #241521, #3a2235)"
              transform={'perspective(1000px) rotateY(-5deg)'}
              transition={'all 0.5s ease'}
              cursor="pointer"
              _hover={{
                transform: 'perspective(1000px) rotateY(0deg)',
              }}>
              <Image
                alt={'Hero Image'}
                fit={'cover'}
                align={'center'}
                w={'100%'}
                h={'100%'}
                src={'./images/hero.png'} // Ruta relativa para GitHub Pages
              />
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
