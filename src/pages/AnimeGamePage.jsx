import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Progress,
  Badge,
  SimpleGrid,
  useToast,
  Card,
  CardBody,
  Flex,
  Icon,
  Divider,
  Input,
  Link,
  Image,
  Select,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaGamepad,
  FaTrophy,
  FaRedo,
  FaHome,
  FaPaperPlane,
  FaCheckCircle,
  FaInstagram,
} from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { useGameCountdown } from '../hooks/useGameCountdown';
import {
  GAME_LEVELS,
  GAME_CONFIG,
  GAME_HISTORY,
  PAST_ROUND_ANSWERS,
  saveGameProgress,
  loadGameProgress,
  saveGameSubmission,
  getGameUser,
  setGameUser,
  submitToGoogleForm,
  hasGameBeenPlayed,
  markGameAsPlayed,
  clearGameIfNewRound,
} from '../data/animeGame';

const MotionBox = motion(Box);
const MotionVStack = motion(VStack);

// Componente que renderiza una imagen pixelada usando canvas
const PixelatedImage = ({ src, pixelSize, reveal = false }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = src;

    img.onload = () => {
      // Calcular dimensiones manteniendo aspect ratio
      const containerWidth = container.offsetWidth;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      const canvasWidth = containerWidth;
      const canvasHeight = containerWidth / aspectRatio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      if (reveal) {
        // Si se revela, mostrar imagen normal
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      } else {
        // Efecto pixelado: dibujar en canvas pequeño y escalar
        const smallWidth = Math.max(1, Math.floor(canvasWidth / pixelSize));
        const smallHeight = Math.max(1, Math.floor(canvasHeight / pixelSize));

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = smallWidth;
        tempCanvas.height = smallHeight;
        const tempCtx = tempCanvas.getContext('2d');

        // Dibujar imagen reducida
        tempCtx.drawImage(img, 0, 0, smallWidth, smallHeight);

        // Dibujar la imagen reducida escalada al canvas principal (sin suavizado)
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(tempCanvas, 0, 0, smallWidth, smallHeight, 0, 0, canvasWidth, canvasHeight);
      }
    };

    img.onerror = () => {
      // Dibujar placeholder si falla la carga
      ctx.fillStyle = '#2D3748';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#A0AEC0';
      ctx.textAlign = 'center';
      ctx.font = '16px sans-serif';
      ctx.fillText('Imagen no disponible', canvas.width / 2, canvas.height / 2);
    };
  }, [src, pixelSize, reveal]);

  return (
    <Box
      ref={containerRef}
      w="100%"
      maxW="500px"
      mx="auto"
      borderRadius="xl"
      overflow="hidden"
      border="4px solid"
      borderColor={reveal ? 'green.400' : 'pink.400'}
      boxShadow="0 0 20px rgba(236, 72, 153, 0.3)"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
        }}
      />
    </Box>
  );
};

const PixelatedImageCanvas = ({ src, width, height, pixelSize = 12 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const img = new window.Image();
    img.onload = () => {
      const w = Math.max(1, Math.ceil(width / pixelSize));
      const h = Math.max(1, Math.ceil(height / pixelSize));
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
    };
    img.src = src;
  }, [src, width, height, pixelSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: 'block',
        imageRendering: 'pixelated',
      }}
    />
  );
};

const RotatingName = ({ primary, secondary }) => {
  const [showPrimary, setShowPrimary] = useState(true);
  useEffect(() => {
    if (!secondary) return;
    const interval = setInterval(() => setShowPrimary((p) => !p), 3000);
    return () => clearInterval(interval);
  }, [secondary]);
  if (!secondary) {
    return (
      <Text fontSize="sm" color="white" fontWeight="bold" mt={1}>
        {primary}
      </Text>
    );
  }
  return (
    <Box position="relative" h="60px" mt={1}>
      <Text
        position="absolute"
        top="0"
        left="0"
        right="0"
        fontSize="xs"
        color="white"
        fontWeight="bold"
        wordBreak="break-word"
        opacity={showPrimary ? 1 : 0}
        transition="opacity 0.5s ease"
      >
        {primary}
      </Text>
      <Text
        position="absolute"
        top="0"
        left="0"
        right="0"
        fontSize="xs"
        color="white"
        fontWeight="bold"
        wordBreak="break-word"
        opacity={showPrimary ? 0 : 1}
        transition="opacity 0.5s ease"
      >
        {secondary}
      </Text>
    </Box>
  );
};

export default function AnimeGamePage() {
  const toast = useToast();
  const { timeLeft, isExpired } = useGameCountdown();
  const [gameState, setGameState] = useState('intro'); // intro, playing, review, submitted
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState([]); // { level, answer, levelName }
  const [userInstagram, setUserInstagram] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [hasPlayed, setHasPlayed] = useState(() => hasGameBeenPlayed());

  const userName = [
    userInstagram.trim() && `Instagram: ${userInstagram.trim()}`,
    userEmail.trim() && `Email: ${userEmail.trim()}`,
  ].filter(Boolean).join(' / ');

  const sortedHistory = [...GAME_HISTORY].sort((a, b) => new Date(b.deadline) - new Date(a.deadline));
  const [selectedRoundId, setSelectedRoundId] = useState(() => sortedHistory[0]?.id || '');
  const selectedRound = sortedHistory.find(r => r.id === selectedRoundId) || sortedHistory[0];
  const currentAnswers = selectedRound ? selectedRound.answers : PAST_ROUND_ANSWERS;

  const currentLevel = GAME_LEVELS[currentLevelIndex];

  // Cargar progreso previo y limpiar si cambió la ronda
  useEffect(() => {
    const savedContact = getGameUser();
    if (savedContact) {
      const igMatch = savedContact.match(/Instagram:\s*([^/]+)/);
      const emailMatch = savedContact.match(/Email:\s*([^/]+)/);
      if (igMatch) setUserInstagram(igMatch[1].trim());
      if (emailMatch) setUserEmail(emailMatch[1].trim());
      if (!igMatch && !emailMatch) setUserInstagram(savedContact);
    }
    const wasCleared = clearGameIfNewRound();
    if (wasCleared) {
      setHasPlayed(false);
      setAnswers([]);
      setCurrentLevelIndex(0);
      setGameState('intro');
      return;
    }
    const saved = loadGameProgress();
    if (saved && saved.answers) {
      setAnswers(saved.answers);
      setCurrentLevelIndex(saved.currentLevelIndex || 0);
      if (saved.completed) {
        setGameState('review');
      }
    }
  }, []);

  // Scroll al top al entrar a la página del juego
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const startGame = () => {
    if (isExpired) {
      toast({
        title: 'El juego terminó',
        description: 'Esta ronda ya finalizó. Esperá la próxima para participar.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    if (hasGameBeenPlayed()) {
      setHasPlayed(true);
      toast({
        title: 'Ya jugaste',
        description: 'Solo se permite una participación por persona.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      return;
    }
    setGameState('playing');
    setCurrentLevelIndex(0);
    setAnswers([]);
    setTextAnswer('');
    saveGameProgress({ currentLevelIndex: 0, answers: [] });
  };

  const handleSubmitAnswer = () => {
    if (!textAnswer.trim()) {
      toast({
        title: 'Escribe una respuesta',
        description: 'Ingresa el nombre del anime que crees que es',
        status: 'warning',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      return;
    }

    const newAnswer = {
      level: currentLevel.id,
      answer: textAnswer.trim(),
      levelName: currentLevel.name,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setTextAnswer('');

    if (currentLevelIndex < GAME_LEVELS.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      saveGameProgress({ currentLevelIndex: nextIndex, answers: newAnswers });
    } else {
      saveGameProgress({ currentLevelIndex: GAME_LEVELS.length, answers: newAnswers, completed: true });
      autoSubmitOnFinish(newAnswers);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  const handleSkipLevel = () => {
    const newAnswer = {
      level: currentLevel.id,
      answer: 'No sé',
      levelName: currentLevel.name,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setTextAnswer('');

    if (currentLevelIndex < GAME_LEVELS.length - 1) {
      const nextIndex = currentLevelIndex + 1;
      setCurrentLevelIndex(nextIndex);
      saveGameProgress({ currentLevelIndex: nextIndex, answers: newAnswers });
    } else {
      saveGameProgress({ currentLevelIndex: GAME_LEVELS.length, answers: newAnswers, completed: true });
      autoSubmitOnFinish(newAnswers);
    }
  };

  const doSubmit = (finalAnswers, user) => {
    setGameUser(user.trim());
    const submission = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user: user.trim(),
      timestamp: new Date().toISOString(),
      answers: finalAnswers.map(a => ({
        level: a.level,
        levelName: a.levelName,
        answer: a.answer,
      })),
    };
    saveGameSubmission(submission);
    submitToGoogleForm(finalAnswers, user.trim());
    markGameAsPlayed();
    toast({
      title: '¡Respuestas enviadas!',
      description: 'El admin revisará tus respuestas y te contactará con el descuento correspondiente.',
      status: 'success',
      duration: 5000,
      isClosable: true,
      position: 'top',
    });
  };

  const autoSubmitOnFinish = (finalAnswers) => {
    if (!userName.trim()) {
      setGameState('review');
      return;
    }
    doSubmit(finalAnswers, userName);
    setGameState('submitted');
  };

  const progressValue = ((currentLevelIndex) / GAME_LEVELS.length) * 100;

  // --- Bloques compartidos entre ronda activa y ronda terminada ---
  const gameInfoTexts = (
    <>
      <Text fontSize="md" color="gray.300">
        Organizamos juegos cada cierto tiempo donde podes ganar descuentos de
        hasta el <strong>{GAME_CONFIG.maxDiscount}% OFF</strong> para usar en
        pedidos y productos de la tienda.
      </Text>
      <Text fontSize="md" color="gray.300">
        Los animes elegidos fueron vistos por mí,{" "}
        <strong>
          no busco animes que no conozca nadie a propósito para que no ganen.
        </strong>
      </Text>
      <Text fontSize="md" color="pink.300">
        El <strong>descuento ganado</strong> será aplicable
        durante <strong>todo el mes en el que se realice la ronda.</strong>.
      </Text>
    </>
  );

  const instagramFollowBox = (
    <>
      <Box
        bg="pink.900"
        p={4}
        borderRadius="xl"
        border="2px solid"
        borderColor="pink.400"
        w="100%"
        maxW="400px"
      >
        <Link
          href="https://www.instagram.com/arkya.store/"
          isExternal
          _hover={{ textDecoration: "none", opacity: 0.8 }}
        >
          <HStack justify="center" spacing={2} mb={2} cursor="pointer">
            <Icon as={FaInstagram} fontSize="2xl" color="pink.300" />
            <Text fontWeight="bold" color="pink.300" fontSize="lg">
              @arkya.store
            </Text>
          </HStack>
        </Link>
        <Text color="white" fontSize="sm">
          Avisamos por historias de Instagram cuando activamos los juegos con
          descuentos.
        </Text>
      </Box>
      <Text fontSize="sm" color="pink.600">
        Seguinos en Instagram para no perderte la próxima ronda.
      </Text>
    </>
  );

  const pastRoundsSection = (
    <Box w="100%">
      <VStack spacing={3} mb={4} align="center">
        <Heading size="md" color="pink.300" textAlign="center">
          Respuestas de rondas anteriores
        </Heading>
        {sortedHistory.length > 0 && (
          <Select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            bg="#241521"
            borderColor="pink.400"
            color="white"
            maxW="400px"
            _focus={{ borderColor: "pink.300" }}
          >
            {sortedHistory.map((round) => (
              <option
                key={round.id}
                value={round.id}
                style={{ background: "#241521", color: "white" }}
              >
                {round.name}
              </option>
            ))}
          </Select>
        )}
      </VStack>
      <Flex
        flexWrap="wrap"
        justifyContent="center"
        gap={4}
        w="100%"
        align="stretch"
      >
        {currentAnswers.map((item, idx) => {
          return (
            <Box
              key={idx}
              role="group"
              borderRadius="xl"
              borderTop="4px solid"
              borderTopColor={`${item.color}.400`}
              bg="#241521"
              overflow="hidden"
              textAlign="center"
              w="170px"
              transition="transform 0.3s ease"
              _hover={{ transform: "scale(1.04)" }}
            >
              <Box position="relative" w="100%" h="200px" overflow="hidden">
                <Image
                  src={item.image}
                  alt={item.answer}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </Box>
              <Box p={3}>
                <Text
                  fontSize="xs"
                  color={`${item.color}.300`}
                  fontWeight="bold"
                >
                  {item.level}
                </Text>
                <Text
                  fontSize="sm"
                  color="white"
                  fontWeight="bold"
                  mt={1}
                  noOfLines={2}
                >
                  {item.answer}
                </Text>
                {item.answerAlt && (
                  <Text fontSize="xs" color="gray.400" mt={1} lineHeight="1.4">
                    {item.answerAlt}
                  </Text>
                )}
                {item.malUrl && (
                  <Link
                    href={item.malUrl}
                    isExternal
                    fontSize="xs"
                    color="pink.300"
                    mt={1}
                    display="inline-block"
                    _hover={{ color: "pink.600", textDecoration: "underline" }}
                  >
                    Ver en MyAnimeList ↗
                  </Link>
                )}
              </Box>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );

  return (
    <>
      <SEO
        title="Adiviná el Anime - Minijuego y Descuentos | Arkya Store"
        description="Jugá a adivinar el anime pixelado y ganá descuentos en artbooks, doujinshi, mangas, guías, novelas ligeras, revistas Jump y merchandising importado de Japón. 5 niveles."
        url="https://arkya.store/adivina-el-anime"
        keywords="adivina el anime, minijuego, descuentos, artbooks, doujinshi, manga, japón, anime, juego, pixelado, arkya store"
      />
      <Box bg="#453641" flex="1">
        <Container maxW="1100px" py={8} px={{ base: 4, md: 8 }}>
          <VStack spacing={8} align="stretch">
            {/* Header del juego */}
            <Box textAlign="center">
              <HStack justify="center" spacing={3} mb={3}>
                <Icon as={FaGamepad} fontSize="3xl" color="pink.400" />
                <Heading
                  as="h1"
                  size="xl"
                  bgGradient="linear(to-r, pink.400, purple.400)"
                  bgClip="text"
                >
                  Adivina el Anime
                </Heading>
              </HStack>
              <Text color="gray.400" fontSize="md">
                ¿Qué tan buen ojo tienes? Adivina el anime a través de las
                imágenes pixeladas.
              </Text>
            </Box>

            {/* Pantalla de introducción */}
            {gameState === "intro" && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  bg="#241521"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <CardBody p={{ base: 6, md: 10 }}>
                    <VStack spacing={6} textAlign="center">
                      {isExpired ? (
                        <>
                          <Icon
                            as={FaTrophy}
                            fontSize="5xl"
                            color="yellow.400"
                          />
                          <Heading size="xl" color="white">
                            El juego ha terminado
                          </Heading>
                          <Text fontSize="md" color="gray.300">
                            Esta ronda de <strong>Adivina el Anime</strong> ya
                            finalizó.
                          </Text>
                          {gameInfoTexts}
                          {instagramFollowBox}
                          <Divider borderColor="whiteAlpha.200" />

                          {/* Respuestas del historial de rondas */}
                          {pastRoundsSection}

                          <Button
                            leftIcon={<FaHome />}
                            as={RouterLink}
                            to="/"
                            size="lg"
                            bg="pink.500"
                            color="white"
                            px={8}
                            _hover={{
                              bg: "pink.400",
                              transform: "translateY(-2px)",
                              boxShadow: "0 0 20px rgba(236, 72, 153, 0.4)",
                            }}
                          >
                            Volver al inicio
                          </Button>
                        </>
                      ) : (
                        <>
                          <Box
                            bg="pink.900"
                            p={3}
                            borderRadius="xl"
                            border="1px solid"
                            borderColor="pink.400"
                            w="100%"
                            maxW="300px"
                          >
                            <Text
                              fontSize="sm"
                              color="pink.300"
                              fontWeight="bold"
                            >
                              Tiempo restante para jugar
                            </Text>
                            <Text
                              color="white"
                              fontSize="xl"
                              fontWeight="extrabold"
                              mt={1}
                            >
                              {timeLeft}
                            </Text>
                          </Box>
                          <Text fontSize="lg" color="gray.200">
                            Te presentaremos <strong>5 niveles</strong> de
                            imágenes pixeladas de distintos animes. Cada nivel
                            será más difícil que el anterior.
                          </Text>

                          <Flex
                            flexWrap="wrap"
                            justifyContent="center"
                            gap={3}
                            w="100%"
                          >
                            {GAME_LEVELS.map((level, idx) => {
                              const schemes = [
                                "green",
                                "teal",
                                "yellow",
                                "orange",
                                "red",
                              ];
                              const scheme = schemes[idx] || "pink";
                              return (
                                <Box
                                  key={level.id}
                                  bg="#453641"
                                  p={3}
                                  borderRadius="xl"
                                  border="2px solid"
                                  borderColor="pink.400"
                                  textAlign="center"
                                  boxShadow="0 0 15px rgba(236, 72, 153, 0.2)"
                                  transition="all 0.2s ease"
                                  _hover={{
                                    boxShadow:
                                      "0 0 25px rgba(236, 72, 153, 0.5)",
                                  }}
                                  minW="120px"
                                  flex="1 1 140px"
                                  maxW="200px"
                                >
                                  <Badge
                                    colorScheme={scheme}
                                    mb={2}
                                    borderRadius="full"
                                    px={2}
                                    py={0.5}
                                    fontSize="0.65rem"
                                    fontWeight="bold"
                                    textTransform="uppercase"
                                  >
                                    {level.name.replace(
                                      "Nivel " + level.id + " - ",
                                      "",
                                    )}
                                  </Badge>
                                  <Text
                                    fontSize="sm"
                                    fontWeight="bold"
                                    color="white"
                                  >
                                    {level.name.replace(
                                      "Nivel " + level.id + " - ",
                                      "",
                                    )}
                                  </Text>
                                  <Text
                                    fontSize="md"
                                    fontWeight="extrabold"
                                    color={`${scheme}.300`}
                                    mt={1}
                                  >
                                    +{level.discount || 0}% OFF
                                  </Text>
                                </Box>
                              );
                            })}
                          </Flex>

                          <Box>
                            <Text fontSize="sm" color="gray.400" mb={1}>
                              <Icon as={FaTrophy} mr={1} color="yellow.400" />
                              Máximo descuento posible
                              <Icon as={FaTrophy} ml={1} color="yellow.400" />
                            </Text>
                            <Heading size="lg" color="green.400">
                              {GAME_CONFIG.maxDiscount}% OFF
                            </Heading>
                          </Box>

                          {hasPlayed ? (
                            <Box
                              bg="red.900"
                              p={4}
                              borderRadius="xl"
                              border="2px solid"
                              borderColor="red.500"
                              w="100%"
                              maxW="400px"
                            >
                              <Text
                                fontWeight="bold"
                                color="red.300"
                                fontSize="lg"
                              >
                                Ya participaste
                              </Text>
                              <Text color="gray.300" fontSize="sm" mt={1}>
                                Solo se permite una participación por persona.
                                Gracias por jugar.
                              </Text>
                            </Box>
                          ) : (
                            <VStack spacing={4} w="100%" maxW="400px">
                              <Box w="100%">
                                <Text
                                  fontSize="sm"
                                  color="gray.400"
                                  mb={2}
                                  textAlign="left"
                                >
                                  Tu correo:
                                </Text>
                                <Input
                                  type="email"
                                  placeholder="Ej: mail@ejemplo.com"
                                  value={userEmail}
                                  onChange={(e) => setUserEmail(e.target.value)}
                                  size="lg"
                                  bg="#241521"
                                  borderColor="pink.400"
                                  color="white"
                                  _placeholder={{ color: "gray.500" }}
                                  _focus={{
                                    borderColor: "pink.300",
                                    boxShadow: "0 0 0 1px pink.300",
                                  }}
                                />
                              </Box>
                              <Box w="100%">
                                <Text
                                  fontSize="sm"
                                  color="gray.400"
                                  mb={2}
                                  textAlign="left"
                                >
                                  Tu Instagram (opcional):
                                </Text>
                                <Input
                                  placeholder="Ej: @tu_usuario"
                                  value={userInstagram}
                                  onChange={(e) =>
                                    setUserInstagram(e.target.value)
                                  }
                                  size="lg"
                                  bg="#241521"
                                  borderColor="pink.400"
                                  color="white"
                                  _placeholder={{ color: "gray.500" }}
                                  _focus={{
                                    borderColor: "pink.300",
                                    boxShadow: "0 0 0 1px pink.300",
                                  }}
                                />
                              </Box>

                              <Text fontSize="xs" color="gray.500">
                                Completá al menos uno para empezar.
                              </Text>
                              <Button
                                size="lg"
                                bgGradient="linear(to-r, #b83280, #d53f8c)"
                                color="white"
                                leftIcon={<FaGamepad />}
                                onClick={startGame}
                                px={10}
                                py={7}
                                fontSize="xl"
                                w="100%"
                                borderRadius="2xl"
                                border="2px solid"
                                borderColor="pink.300"
                                boxShadow="0 0 25px rgba(236, 72, 153, 0.5)"
                                isDisabled={
                                  !userInstagram.trim() && !userEmail.trim()
                                }
                                _hover={{
                                  bgGradient: "linear(to-r, #d53f8c, #ed64a6)",
                                  transform: "translateY(-3px) scale(1.02)",
                                  boxShadow: "0 0 35px rgba(236, 72, 153, 0.7)",
                                }}
                                _active={{
                                  transform: "translateY(0) scale(0.98)",
                                  boxShadow: "0 0 15px rgba(236, 72, 153, 0.4)",
                                }}
                                transition="all 0.2s ease"
                                fontWeight="extrabold"
                                letterSpacing="wide"
                              >
                                ¡Empezar!
                              </Button>
                            </VStack>
                          )}

                          <Divider borderColor="whiteAlpha.200" />
                          <Text fontSize="lg" color="pink.300" fontWeight="bold">
                            INFORMACIÓN
                          </Text>
                          {gameInfoTexts}
                          {instagramFollowBox}
                          {pastRoundsSection}
                        </>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}

            {/* Pantalla de juego */}
            {gameState === "playing" && (
              <AnimatePresence mode="wait">
                <MotionVStack
                  key={currentLevel.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  spacing={6}
                  align="stretch"
                >
                  {/* Barra de progreso */}
                  <Box>
                    <Flex justify="space-between" mb={2}>
                      <Text color="gray.400" fontSize="sm">
                        Nivel {currentLevelIndex + 1} de {GAME_LEVELS.length}
                      </Text>
                      <Text color="pink.300" fontSize="sm" fontWeight="bold">
                        Escribí el nombre del anime
                      </Text>
                    </Flex>
                    <Progress
                      value={progressValue}
                      size="sm"
                      colorScheme="pink"
                      borderRadius="full"
                      bg="gray.700"
                    />
                  </Box>

                  {/* Info del nivel */}
                  <Box textAlign="center">
                    <Badge
                      colorScheme={['green', 'teal', 'yellow', 'orange', 'red'][currentLevelIndex] || 'purple'}
                      fontSize="md"
                      px={4}
                      py={1}
                      borderRadius="full"
                    >
                      {currentLevel.name}
                    </Badge>
                    <Text fontSize="sm" color="gray.500" mt={2}>
                      Dificultad:{" "}
                      {"⭐".repeat(Math.min(currentLevelIndex + 1, 5))}
                    </Text>
                  </Box>

                  {/* Imagen pixelada */}
                  <PixelatedImage
                    src={currentLevel.image}
                    pixelSize={currentLevel.pixelSize}
                  />

                  {/* Input de respuesta libre */}
                  <VStack spacing={4} align="stretch">
                    <Input
                      placeholder="¿Qué anime es? Escribí el nombre..."
                      value={textAnswer}
                      onChange={(e) => setTextAnswer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      size="lg"
                      bg="#241521"
                      borderColor="pink.400"
                      color="white"
                      _placeholder={{ color: "gray.500" }}
                      _focus={{
                        borderColor: "pink.300",
                        boxShadow: "0 0 0 1px pink.300",
                      }}
                      fontSize="md"
                      py={6}
                    />
                    <Flex
                      direction={{ base: "column-reverse", md: "row" }}
                      gap={3}
                      w="100%"
                      align="center"
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        color="gray.400"
                        onClick={handleSkipLevel}
                        px={4}
                        flexShrink={0}
                      >
                        No sé →
                      </Button>
                      <Button
                        size="lg"
                        bg="pink.500"
                        color="white"
                        onClick={handleSubmitAnswer}
                        px={10}
                        py={{ base: 6, md: 5 }}
                        flex={1}
                        w="100%"
                        fontSize={{ base: "lg", md: "md" }}
                        fontWeight="bold"
                        _hover={{ bg: "pink.400" }}
                        _active={{ bg: "pink.600" }}
                      >
                        {currentLevelIndex < GAME_LEVELS.length - 1
                          ? "Confirmar y siguiente →"
                          : "Confirmar y enviar"}
                      </Button>
                    </Flex>
                  </VStack>
                </MotionVStack>
              </AnimatePresence>
            )}

            {/* Pantalla de confirmación (después de envío automático) */}
            {(gameState === "review" || gameState === "submitted") && (
              <MotionBox
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Card
                  bg="#241521"
                  borderRadius="2xl"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  overflow="hidden"
                >
                  <CardBody p={{ base: 6, md: 10 }}>
                    <VStack spacing={6}>
                      <Icon as={FaTrophy} fontSize="5xl" color="yellow.400" />

                      <Heading size="xl" textAlign="center">
                        ¡Juego Completado!
                      </Heading>

                      <Text fontSize="md" color="gray.300" textAlign="center">
                        Tus respuestas fueron enviadas. El admin las revisará y
                        te contactará con el descuento que te corresponda.
                      </Text>

                      {/* Resumen de respuestas */}
                      <Box w="100%">
                        <Heading size="sm" mb={4} color="gray.300">
                          Tus respuestas:
                        </Heading>
                        <VStack spacing={3} align="stretch">
                          {answers.map((ans, idx) => {
                            const schemes = [
                              "green",
                              "teal",
                              "yellow",
                              "orange",
                              "red",
                            ];
                            const scheme = schemes[idx] || "pink";
                            return (
                              <Flex
                                key={idx}
                                bg="#453641"
                                p={3}
                                borderRadius="lg"
                                border="1px solid"
                                borderColor={`${scheme}.400`}
                                align="center"
                                justify="space-between"
                              >
                                <HStack spacing={3}>
                                  <Badge
                                    colorScheme={scheme}
                                    variant="solid"
                                    px={2}
                                    py={1}
                                    borderRadius="md"
                                  >
                                    {ans.levelName}
                                  </Badge>
                                  <Box>
                                    <Text fontSize="s" color="gray.400">
                                      Respuesta: {ans.answer}
                                    </Text>
                                  </Box>
                                </HStack>
                              </Flex>
                            );
                          })}
                        </VStack>
                      </Box>

                      <Box
                        bg="green.900"
                        p={6}
                        borderRadius="xl"
                        w="100%"
                        border="2px dashed"
                        borderColor="green.400"
                        textAlign="center"
                      >
                        <Icon
                          as={FaCheckCircle}
                          fontSize="3xl"
                          color="green.400"
                          mb={3}
                        />
                        <Heading size="md" color="green.300" mb={2}>
                          ¡Respuestas enviadas!
                        </Heading>
                        <Text color="gray.300">
                          Gracias por participar. Te contactaremos por{" "}
                          {userName} cuando se revelen las respuestas.
                        </Text>
                      </Box>

                      <Divider borderColor="whiteAlpha.200" />

                      <Text fontSize="lg" color="pink.300" fontWeight="bold">
                        INFORMACIÓN
                      </Text>
                      {gameInfoTexts}
                      {instagramFollowBox}
                      {pastRoundsSection}

                      <Divider borderColor="whiteAlpha.200" />

                      {/* Botones de acción */}
                      <HStack
                        spacing={4}
                        w="100%"
                        justify="center"
                        flexWrap="wrap"
                      >
                        <Button
                          leftIcon={<FaHome />}
                          as={RouterLink}
                          to="/"
                          size="lg"
                          bg="pink.500"
                          color="white"
                          px={8}
                          _hover={{
                            bg: "pink.400",
                            transform: "translateY(-2px)",
                            boxShadow: "0 0 20px rgba(236, 72, 153, 0.4)",
                          }}
                        >
                          Volver al inicio
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </MotionBox>
            )}
          </VStack>
        </Container>
      </Box>
    </>
  );
}
