import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Image,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  FormHelperText,
  Textarea,
  Divider,
  Badge,
  Icon,
  Progress,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Switch,
} from '@chakra-ui/react';
import { FaInstagram, FaDownload, FaExclamationTriangle, FaCheckCircle, FaPython, FaTerminal, FaServer } from 'react-icons/fa';

const InstaloaderImporter = ({ onProductDataExtracted }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Estado para la configuración del servidor
  const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown', 'running', 'stopped'

  // Función para validar URL de Instagram
  const isValidInstagramUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    // Solo permitir URLs de Instagram válidas
    const regex = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/i;
    return regex.test(url.trim());
  };

  // Función para extraer el shortcode del URL de Instagram
  const extractShortcode = (url) => {
    if (!isValidInstagramUrl(url)) {
      return null;
    }
    const regex = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  // Verificar si el servidor backend está corriendo
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/instagram/scrape', {
        method: 'GET',
        timeout: 3000,
      });
      setServerStatus(response.ok ? 'running' : 'stopped');
      return response.ok;
    } catch {
      setServerStatus('stopped');
      return false;
    }
  };

  // Método 1: Usar servidor backend con Instaloader
  const extractWithServer = async (shortcode) => {
    try {
      const response = await fetch('http://localhost:3001/api/instagram/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: `https://www.instagram.com/p/${shortcode}/`,
        }),
      });

      if (!response.ok) {
        throw new Error('Error en el servidor backend');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'No se pudieron extraer los datos');
      }

      return {
        images: data.images || [],
        description: data.description || '',
        author: data.author || '',
        publishedDate: data.date || '',
        likes: data.likes || 0,
        url: data.url || '',
        extractedWith: 'Instaloader Server',
      };
    } catch (error) {
      console.error('Error con servidor:', error);
      throw error;
    }
  };

  
  // Función principal para extraer datos
  const handleExtractData = async () => {
    if (!url.trim()) {
      setError('Por favor, ingresa una URL válida de Instagram');
      return;
    }

    const shortcode = extractShortcode(url);
    if (!shortcode) {
      setError('URL de Instagram no válida. Debe ser del tipo: https://www.instagram.com/p/CODIGO/');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      let data;

      // Verificar que el servidor esté corriendo
      const isServerRunning = await checkServerStatus();
      if (!isServerRunning) {
        throw new Error('El servidor backend no está corriendo. Inícialo con: npm run server');
      }
      
      data = await extractWithServer(shortcode);
      
      setExtractedData(data);
      onOpen();
      
      const isDemo = data.is_demo;
      
      toast({
        title: isDemo ? 'Datos de demostración cargados' : 'Datos extraídos exitosamente',
        description: isDemo 
          ? `Instagram bloqueó el acceso. Se generaron ${data.images.length} imágenes de demostración.`
          : `Se encontraron ${data.images.length} imágenes usando ${data.extractedWith}`,
        status: isDemo ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      setError(error.message);
      toast({
        title: 'Error al extraer datos',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para parsear descripción y extraer datos
  const parseInstagramDescription = (description) => {
    // Limpiar líneas vacías y puntos sueltos
    let cleanedDesc = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '.' && line !== '...' && line !== '....' && line !== '.....')
      .join('\n');

    // Extraer hashtags
    const hashtagRegex = /#[\w]+/g;
    const hashtags = cleanedDesc.match(hashtagRegex) || [];
    const uniqueHashtags = [...new Set(hashtags)].map(tag => tag.replace('#', ''));

    // Remover hashtags de la descripción
    cleanedDesc = cleanedDesc.replace(hashtagRegex, '').trim();

    // Extraer precio (buscar patrón $número)
    const priceRegex = /\$\s*([\d,]+(?:\.\d{2})?)/;
    const priceMatch = cleanedDesc.match(priceRegex);
    let price = 10000;
    let title = '';

    if (priceMatch) {
      // Convertir precio a número (remover comas)
      price = Math.round(parseFloat(priceMatch[1].replace(/,/g, '')) * 1000);
      
      // Extraer título (lo que va antes del $)
      const priceIndex = cleanedDesc.indexOf('$');
      title = cleanedDesc.substring(0, priceIndex).trim();
      
      // Remover el precio de la descripción
      cleanedDesc = cleanedDesc.replace(priceRegex, '').trim();
    }

    // Si no hay título, usar las primeras palabras de la descripción
    if (!title) {
      const words = cleanedDesc.split(' ');
      title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
    }

    return {
      title,
      description: cleanedDesc,
      price,
      tags: uniqueHashtags
    };
  };

  // Función para convertir los datos extraídos a formato de producto
  const convertToProduct = () => {
    if (!extractedData) return;

    const parsed = parseInstagramDescription(extractedData.description);

    const productData = {
      id: Date.now(),
      image: extractedData.images[0] || '',
      images: extractedData.images,
      name: parsed.title,
      description: parsed.description,
      price: parsed.price,
      category: '',
      subcategory: '',
      inStock: true,
      isNew: true,
      isOnOffer: false,
      tags: parsed.tags,
      instagramUrl: url,
      extractedFrom: 'instagram',
      extractedWith: extractedData.extractedWith,
      extractionDate: new Date().toISOString(),
    };

    onProductDataExtracted(productData);
    onClose();
    
    toast({
      title: 'Producto creado',
      description: `Los datos del post de Instagram han sido importados usando ${extractedData.extractedWith}.`,
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  };

  // Verificar estado del servidor al montar el componente
  React.useEffect(() => {
    checkServerStatus();
  }, []);

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <Alert status="info" borderRadius="md">
          <AlertIcon as={FaServer} />
          <Box>
            <AlertTitle>Importador con Selenium + Brave Browser</AlertTitle>
            <AlertDescription fontSize="sm">
              Usa Selenium con Brave Browser para extraer datos reales de Instagram.
              <strong>Requiere Brave Browser instalado</strong> - no usa Chrome.
              <br />
              <code>npm run server</code> para iniciar el backend.
              <br />
              <code>npm run install-selenium</code> para instalar dependencias.
            </AlertDescription>
          </Box>
        </Alert>

        <HStack spacing={4} mb={4}>
          <Badge 
            colorScheme={serverStatus === 'running' ? 'green' : serverStatus === 'stopped' ? 'red' : 'yellow'}
          >
            Servidor: {serverStatus === 'running' ? '✅ Corriendo' : serverStatus === 'stopped' ? '❌ Detenido' : '⏳ Verificando...'}
          </Badge>
          {serverStatus === 'stopped' && (
            <Button size="sm" colorScheme="blue" onClick={checkServerStatus}>
              Verificar
            </Button>
          )}
        </HStack>
        
        <HStack spacing={2}>
          <Input
            placeholder="https://www.instagram.com/p/DZ3QE10lFQH/"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleExtractData()}
            isDisabled={isLoading || serverStatus !== 'running'}
          />
          <Button
            leftIcon={<FaPython />}
            colorScheme="green"
            onClick={handleExtractData}
            isLoading={isLoading}
            isDisabled={!url.trim() || serverStatus !== 'running'}
          >
            Extraer con Selenium
          </Button>
        </HStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon as={FaExclamationTriangle} />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        )}

        {isLoading && (
          <VStack spacing={2} py={4}>
            <Spinner size="lg" color="green.500" />
            <Text fontSize="sm" color="gray.600">
              Extrayendo datos con Instaloader...
            </Text>
            <Progress size="xs" isIndeterminate colorScheme="green" w="full" />
          </VStack>
        )}
      </VStack>

      {/* Modal de vista previa */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FaPython} color="green.500" />
              <Text>Vista previa - {extractedData?.extractedWith}</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {extractedData && (
              <VStack spacing={4} align="stretch">
                {/* Imágenes encontradas */}
                <Box>
                  <FormLabel mb={2}>
                    <HStack spacing={2}>
                      <Text fontWeight="bold">Imágenes encontradas</Text>
                      <Badge colorScheme="green">{extractedData.images.length}</Badge>
                    </HStack>
                  </FormLabel>
                  <Box 
                    display="grid" 
                    gridTemplateColumns="repeat(auto-fit, minmax(100px, 1fr))" 
                    gap={2}
                    maxH="200px"
                    overflowY="auto"
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    {extractedData.images.map((img, index) => (
                      <Image
                        key={index}
                        src={img}
                        alt={`Imagen ${index + 1}`}
                        boxSize="100px"
                        objectFit="cover"
                        borderRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                      />
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Descripción extraída */}
                <FormControl>
                  <FormLabel fontWeight="bold">Descripción extraída</FormLabel>
                  <Textarea
                    value={extractedData.description}
                    readOnly
                    rows={4}
                    resize="none"
                    bg="gray.50"
                  />
                </FormControl>

                {/* Información adicional */}
                <HStack spacing={4} fontSize="sm" color="gray.600">
                  {extractedData.author && (
                    <Text>Autor: @{extractedData.author}</Text>
                  )}
                  {extractedData.likes > 0 && (
                    <Text>❤️ {extractedData.likes.toLocaleString()} likes</Text>
                  )}
                  {extractedData.extractedWith && (
                    <Badge colorScheme="purple" fontSize="xs">
                      {extractedData.extractedWith}
                    </Badge>
                  )}
                </HStack>

                <Divider />

                {/* Acciones */}
                <HStack spacing={3} justify="space-between">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="green"
                    onClick={convertToProduct}
                  >
                    Crear producto con estos datos
                  </Button>
                </HStack>

                {extractedData.is_demo ? (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Modo demostración</AlertTitle>
                      <AlertDescription fontSize="xs">
                        Instagram bloqueó el acceso. Estos son datos de demostración para que puedas probar la funcionalidad.
                        Puedes reemplazar las imágenes y descripción manualmente.
                      </AlertDescription>
                    </Box>
                  </Alert>
                ) : (
                  <Alert status="success" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">¡Datos reales extraídos!</AlertTitle>
                      <AlertDescription fontSize="xs">
                        Estos son los datos reales del post de Instagram usando Instaloader.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InstaloaderImporter;
