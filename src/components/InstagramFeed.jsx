import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Flex,
  Button,
  Skeleton,
  VStack,
  Code,
} from '@chakra-ui/react';
import { FaInstagram, FaHeart, FaComment } from 'react-icons/fa';
import { useInstagramFeed } from '../hooks/useInstagramFeed';

export default function InstagramFeed() {
  const { posts, loading, hasPosts } = useInstagramFeed();

  const bgColor = '#241521';
  const cardBg = '#2d1e2a';

  return (
    <Box bg={bgColor} py={16} borderTopWidth="1px" borderColor="whiteAlpha.100">
      <Container maxW="6xl">
        <VStack spacing={2} mb={10} textAlign="center">
          <Flex align="center" gap={2}>
            <FaInstagram color="#ec4899" size={24} />
            <Heading
              as="h2"
              color="white"
              fontSize={{ base: 'xl', md: '3xl' }}
              fontWeight={600}
            >
              Seguinos en Instagram
            </Heading>
          </Flex>
          <Text color="whiteAlpha.600" fontSize="md" maxW="xl">
            Enterate de los últimos ingresos, restocks y ofertas exclusivas antes que nadie.
          </Text>
          <Button
            as="a"
            href="https://instagram.com/arkya.store"
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="pink"
            variant="outline"
            size="sm"
            leftIcon={<FaInstagram />}
            mt={2}
          >
            @arkya.store
          </Button>
        </VStack>

        {!loading && !hasPosts ? (
          <VStack py={12} spacing={4} textAlign="center">
            <FaInstagram color="whiteAlpha.300" size={48} />
            <Text color="whiteAlpha.600" fontSize="lg">
              Pronto vas a ver tus posts reales de Instagram acá.
            </Text>
            <Text color="whiteAlpha.500" fontSize="sm" maxW="md">
              Para configurarlos, editá el archivo <Code bg="whiteAlpha.200" color="pink.300">src/data/instagramConfig.js</Code> y seguí las instrucciones.
            </Text>
            <Button
              as="a"
              href="https://instagram.com/arkya.store"
              target="_blank"
              rel="noopener noreferrer"
              colorScheme="pink"
              size="sm"
            >
              Ver perfil de Instagram
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    height="200px"
                    borderRadius="lg"
                    startColor="whiteAlpha.100"
                    endColor="whiteAlpha.300"
                  />
                ))
              : posts.map((post) => (
                  <Box
                    key={post.id}
                    as="a"
                    href={post.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    position="relative"
                    borderRadius="lg"
                    overflow="hidden"
                    bg={cardBg}
                    cursor="pointer"
                    role="group"
                  >
                    <Image
                      src={post.image}
                      alt={post.caption}
                      objectFit="cover"
                      w="100%"
                      h="200px"
                      transition="transform 0.3s"
                      _groupHover={{ transform: 'scale(1.05)' }}
                    />
                    <Box
                      position="absolute"
                      inset={0}
                      bg="rgba(0,0,0,0.5)"
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      transition="opacity 0.3s"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      gap={2}
                      p={3}
                    >
                      <FaInstagram color="white" size={24} />
                      <Text
                        color="white"
                        fontSize="xs"
                        textAlign="center"
                        noOfLines={2}
                        fontWeight="medium"
                      >
                        {post.caption}
                      </Text>
                      <Flex gap={3} color="white" fontSize="xs">
                        <Flex align="center" gap={1}>
                          <FaHeart size={12} />
                          <Text>{post.likes}</Text>
                        </Flex>
                        <Flex align="center" gap={1}>
                          <FaComment size={12} />
                          <Text>{post.comments}</Text>
                        </Flex>
                      </Flex>
                    </Box>
                  </Box>
                ))}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
