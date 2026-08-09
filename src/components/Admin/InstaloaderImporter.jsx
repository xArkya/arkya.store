import React, { useState, useEffect } from 'react';
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

const InstaloaderImporter = ({ onProductDataExtracted, onEditMultipleProducts }) => {
  const [urls, setUrls] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractionResults, setExtractionResults] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  
  // Estado para la configuración del servidor
  const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown', 'running', 'stopped'

  // Listener para cerrar el modal con Escape
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        // Cerrar el modal de Chakra
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => window.removeEventListener('keydown', handleEscapeKey);
  }, [onClose]);

  // Función para limpiar URL de Instagram (remover parámetros)
  const cleanInstagramUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    // Remover todo después del ? (parámetros)
    return url.split('?')[0].trim();
  };

  // Función para validar URL de Instagram
  const isValidInstagramUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    // Limpiar la URL primero
    const cleanUrl = cleanInstagramUrl(url);
    // Solo permitir URLs de Instagram válidas
    const regex = /^https?:\/\/(www\.)?instagram\.com\/p\/[A-Za-z0-9_-]+\/?$/i;
    return regex.test(cleanUrl);
  };

  // Función para extraer el shortcode del URL de Instagram
  const extractShortcode = (url) => {
    if (!url || typeof url !== 'string') return null;
    // Limpiar la URL primero
    const cleanUrl = cleanInstagramUrl(url);
    if (!isValidInstagramUrl(cleanUrl)) {
      return null;
    }
    const regex = /instagram\.com\/p\/([A-Za-z0-9_-]+)/i;
    const match = cleanUrl.match(regex);
    return match ? match[1] : null;
  };

  // Extraer datos de un solo post vía servidor
  const extractSinglePost = async (singleUrl) => {
    const shortcode = extractShortcode(singleUrl);
    if (!shortcode) {
      return { url: singleUrl, error: 'URL inválida', data: null };
    }

    try {
      const response = await fetch('http://localhost:3001/api/instagram/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://www.instagram.com/p/${shortcode}/` }),
      });

      if (!response.ok) throw new Error('Error en el servidor backend');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'No se pudieron extraer los datos');

      return {
        url: singleUrl,
        data: {
          images: data.images || [],
          description: data.description || '',
          author: data.author || '',
          publishedDate: data.date || '',
          likes: data.likes || 0,
          url: data.url || '',
          extractedWith: 'Instaloader Server',
          is_demo: data.is_demo || false,
        },
        error: null,
      };
    } catch (err) {
      return { url: singleUrl, error: err.message, data: null };
    }
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

  // Función principal para extraer datos de múltiples URLs EN PARALELO
  const handleExtractData = async () => {
    const urlList = urls.split(/\n|,/).map(u => u.trim()).filter(u => u.length > 0);

    if (urlList.length === 0) {
      setError('Por favor, ingresa al menos una URL válida de Instagram');
      return;
    }

    // Verificar que el servidor esté corriendo
    const isServerRunning = await checkServerStatus();
    if (!isServerRunning) {
      setError('El servidor backend no está corriendo. Inícialo con: npm run server');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractionResults([]);

    // Procesar TODAS las URLs al mismo tiempo (paralelo)
    const promises = urlList.map(async (singleUrl, index) => {
      const result = await extractSinglePost(singleUrl);
      // Actualizar resultados en tiempo real
      setExtractionResults(prev => {
        const updated = [...prev];
        updated[index] = result;
        return updated;
      });
      return result;
    });

    const results = await Promise.all(promises);

    setIsLoading(false);
    onOpen();

    const successCount = results.filter(r => r.data).length;
    if (successCount > 0) {
      toast({
        title: `${successCount} de ${urlList.length} posts extraídos`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    } else {
      toast({
        title: 'No se pudieron extraer datos',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Función para parsear descripción y extraer datos
  const parseInstagramDescription = (description) => {
    if (!description) description = '';
    // Limpiar líneas vacías y puntos sueltos
    let cleanedDesc = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line !== '.' && line !== '...' && line !== '....' && line !== '.....')
      .join('\n');

    // Borrar contenido entre corchetes [texto]
    cleanedDesc = cleanedDesc.replace(/\[.*?\]/g, '').trim();

    // Limpiar comillas dobles del inicio/final y punto colgado
    cleanedDesc = cleanedDesc.trim().replace(/^"+|"+$/g, '').trim();
    cleanedDesc = cleanedDesc.replace(/\.$/, '').trim();

    // Filtrar líneas que sean solo nombre de usuario o timestamp de Instagram
    cleanedDesc = cleanedDesc
      .split('\n')
      .filter(line => {
        const trimmed = line.trim();
        if (!trimmed) return false;
        // Ignorar líneas que son solo username (todo minúscula/puntos/números, sin espacios)
        if (/^[a-z0-9_.]+$/.test(trimmed) && trimmed.length < 30 && !trimmed.includes(' ')) return false;
        // Ignorar líneas que parezcan timestamp (número + unidad de tiempo)
        if (/^\d+\s*(sem|semanas?|d|días?|h|horas?|min|minutos?|s|seg)$/.test(trimmed.toLowerCase())) return false;
        // Ignorar líneas que sean solo 'Instagram' o variantes
        if (/^instagram$/i.test(trimmed)) return false;
        return true;
      })
      .join('\n');

    // Extraer hashtags
    const hashtagRegex = /#[\w]+/g;
    const hashtags = cleanedDesc.match(hashtagRegex) || [];
    const uniqueHashtags = [...new Set(hashtags)].map(tag => tag.replace('#', ''));

    // Remover hashtags de la descripción
    cleanedDesc = cleanedDesc.replace(hashtagRegex, '').trim();

    // Extraer precio (buscar patrón $número)
    const priceRegex = /\$\s*([\d.,]+)/;
    const priceMatch = cleanedDesc.match(priceRegex);
    let price = 10000;
    let title = '';

    if (priceMatch) {
      const priceRaw = priceMatch[1];
      let priceNum;

      // Detectar formato: 36.999,00 (punto miles + coma decimal) o 36,999 (coma miles) o 36999 (sin separador)
      const hasCommaDecimal = /,\d{2}$/.test(priceRaw); // termina en ,xx → coma es decimal
      if (hasCommaDecimal) {
        // Formato europeo/latino: 36.999,00 → punto=miles, coma=decimal
        priceNum = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.'));
      } else if (priceRaw.includes('.') && priceRaw.includes(',')) {
        // Ambos presentes: 1.234,56 → punto=miles, coma=decimal
        priceNum = parseFloat(priceRaw.replace(/\./g, '').replace(',', '.'));
      } else if (priceRaw.includes('.') && !priceRaw.includes(',')) {
        // Solo punto: puede ser 36.999 (miles) o 36.99 (decimal)
        const parts = priceRaw.split('.');
        if (parts.length === 2 && parts[1].length === 3) {
          // 36.999 → punto separador de miles
          priceNum = parseFloat(priceRaw.replace(/\./g, ''));
        } else {
          // 36.99 → punto decimal
          priceNum = parseFloat(priceRaw);
        }
      } else if (priceRaw.includes(',')) {
        // Solo coma: 36,999 → coma separador de miles (formato argentino)
        priceNum = parseFloat(priceRaw.replace(/,/g, ''));
      } else {
        // Sin separadores
        priceNum = parseFloat(priceRaw);
      }

      price = Math.round(priceNum);
      
      // Extraer título (lo que va antes del $)
      const priceIndex = cleanedDesc.indexOf('$');
      title = cleanedDesc.substring(0, priceIndex).trim();
      
      // Remover título y precio de la descripción
      cleanedDesc = cleanedDesc.substring(priceIndex);
      cleanedDesc = cleanedDesc.replace(priceRegex, '').trim();
      
      // Limpiar caracteres sueltos al inicio de la descripción
      while (cleanedDesc.startsWith(')') || cleanedDesc.startsWith(']') || cleanedDesc.startsWith('}') ||
             cleanedDesc.startsWith('(') || cleanedDesc.startsWith('[') || cleanedDesc.startsWith('{') ||
             cleanedDesc.startsWith('-') || cleanedDesc.startsWith('–') || cleanedDesc.startsWith('—')) {
        cleanedDesc = cleanedDesc.slice(1).trim();
      }
    }

    // Limpiar título: remover paréntesis, corchetes y caracteres sueltos al inicio y final
    while (title.startsWith('(') || title.startsWith('[') || title.startsWith('{') ||
           title.startsWith('-') || title.startsWith('–') || title.startsWith('—')) {
      title = title.slice(1).trim();
    }
    while (title.endsWith('(') || title.endsWith('[') || title.endsWith('{') ||
           title.endsWith(')') || title.endsWith(']') || title.endsWith('}') ||
           title.endsWith('-') || title.endsWith('–') || title.endsWith('—')) {
      title = title.slice(0, -1).trim();
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

  // Función para procesar imágenes externas y convertirlas a rutas locales
  const processImageUrls = (images, productId) => {
    // Convertir URLs externas a rutas locales con .webp
    return images.map((imageUrl, index) => {
      if (imageUrl.startsWith('http')) {
        // Convertir URL externa a ruta local
        // Formato: /images/products/product-{productId}-{index}.webp
        return `/images/products/product-${productId}-${index}.webp`;
      }
      return imageUrl;
    });
  };

  // Crear producto desde un resultado individual
  const addSingleProduct = (result) => {
    if (!result.data) return;

    const parsed = parseInstagramDescription(result.data.description);
    // Rechazar productos con descripción inválida (ej: scraper falló y devolvió 'Instagram')
    if (!parsed.title || parsed.title.toLowerCase() === 'instagram' || parsed.description?.toLowerCase() === 'instagram') {
      toast({
        title: 'Extracción fallida',
        description: `No se pudo extraer la descripción de ${result.url}. Intentá de nuevo.`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    const productId = Date.now() + Math.floor(Math.random() * 1000);
    const processedImages = processImageUrls(result.data.images, productId);
    
    const productData = {
      id: productId,
      image: processedImages[0] || '',
      images: processedImages,
      name: parsed.title,
      description: parsed.description,
      details: parsed.description,
      price: parsed.price,
      category: '',
      subcategory: '',
      inStock: true,
      isNew: true,
      isOnOffer: false,
      tags: parsed.tags,
      instagramUrl: result.url,
      extractedFrom: 'instagram',
      extractedWith: result.data.extractedWith,
      extractionDate: new Date().toISOString(),
    };

    onProductDataExtracted(productData);
    onClose();
    // Restaurar scroll del body que Chakra UI bloquea al cerrar modal
    document.body.style.overflow = '';
    toast({
      title: 'Producto agregado',
      description: `Importado desde ${result.url}`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Agregar todos los productos extraídos de una sola vez (sin abrir formulario)
  const addAllProducts = () => {
    const successful = extractionResults.filter(r => r && r.data);
    const productsToAdd = successful
      .map(result => {
        const parsed = parseInstagramDescription(result.data.description);
        // Saltear productos con descripción inválida
        if (!parsed.title || parsed.title.toLowerCase() === 'instagram' || parsed.description?.toLowerCase() === 'instagram') {
          return null;
        }
        
        const productId = Date.now() + Math.floor(Math.random() * 1000);
        const processedImages = processImageUrls(result.data.images, productId);
        
        return {
        id: productId,
        image: processedImages[0] || '',
        images: processedImages,
        name: parsed.title,
        description: parsed.description,
        details: parsed.description,
        price: parsed.price,
        category: '',
        subcategory: '',
        inStock: true,
        isNew: true,
        isOnOffer: false,
        tags: parsed.tags,
        instagramUrl: result.url,
        extractedFrom: 'instagram',
        extractedWith: result.data.extractedWith,
        extractionDate: new Date().toISOString(),
      };
      })
      .filter(Boolean);

    if (onEditMultipleProducts) {
      onEditMultipleProducts(productsToAdd);
    } else {
      // Fallback: agregar uno por uno si no hay handler de edición múltiple
      productsToAdd.forEach(product => onProductDataExtracted(product));
    }

    onClose();
    toast({
      title: `${successful.length} productos agregados`,
      description: 'Todos los posts fueron importados correctamente.',
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

        <VStack spacing={2} align="stretch">
          <Textarea
            placeholder="Pega los links de Instagram, uno por línea:&#10;https://www.instagram.com/p/ABC123/&#10;https://www.instagram.com/p/DEF456/"
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            isDisabled={isLoading || serverStatus !== 'running'}
            rows={5}
            resize="vertical"
          />
          <Button
            leftIcon={<FaPython />}
            colorScheme="green"
            onClick={handleExtractData}
            isLoading={isLoading}
            isDisabled={!urls.trim() || serverStatus !== 'running'}
            alignSelf="flex-start"
          >
            Extraer con Selenium {urls.trim() && urls.split(/\n|,/).filter(u => u.trim().length > 0).length > 0 ? `(${urls.split(/\n|,/).filter(u => u.trim().length > 0).length})` : ''}
          </Button>
        </VStack>

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
          <VStack spacing={2} py={4} align="stretch">
            <HStack spacing={3} justify="center">
              <Spinner size="md" color="green.500" />
              <Text fontSize="sm" color="gray.600">
                Extrayendo {urls.split(/\n|,/).filter(u => u.trim().length > 0).length} posts en paralelo...
              </Text>
            </HStack>
            <Progress size="xs" colorScheme="green" w="full" isIndeterminate />
            <Text fontSize="xs" color="gray.500" textAlign="center">
              Todos los posts se procesan al mismo tiempo para mayor velocidad
            </Text>
          </VStack>
        )}
      </VStack>

      {/* Modal de resultados múltiples */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxH="80vh">
          <ModalHeader>
            <HStack spacing={2}>
              <Icon as={FaPython} color="green.500" />
              <Text>Resultados de extracción</Text>
              <Badge colorScheme="green">{extractionResults.filter(r => r && r.data).length}/{extractionResults.length} exitosos</Badge>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={6} align="stretch">
              {extractionResults.map((result, index) => (
                result ? (
                <Box key={index} p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200">
                  <HStack justify="space-between" mb={3}>
                    <Text fontWeight="bold" fontSize="sm" noOfLines={1} flex={1}>
                      {index + 1}. {result.url}
                    </Text>
                    <Badge colorScheme={result.error ? 'red' : result.data?.is_demo ? 'yellow' : 'green'}>
                      {result.error ? 'Error' : result.data?.is_demo ? 'Demo' : 'OK'}
                    </Badge>
                  </HStack>

                  {result.data ? (
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="semibold">{result.data.images.length} imágenes</Text>
                        {result.data.description && (
                          <Text fontSize="sm" color="gray.600" noOfLines={1}>
                            {result.data.description.substring(0, 60)}...
                          </Text>
                        )}
                      </HStack>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<FaCheckCircle />}
                        onClick={() => addSingleProduct(result)}
                      >
                        Agregar producto
                      </Button>
                    </VStack>
                  ) : (
                    <Alert status="error" size="sm" borderRadius="md">
                      <AlertIcon boxSize="16px" />
                      <Text fontSize="xs">{result.error || 'No se pudieron extraer datos'}</Text>
                    </Alert>
                  )}
                </Box>
                ) : null
              ))}

              {extractionResults.filter(r => r && r.data).length > 1 && (
                <Button
                  leftIcon={<FaCheckCircle />}
                  colorScheme="green"
                  size="lg"
                  onClick={addAllProducts}
                >
                  Agregar todos los productos ({extractionResults.filter(r => r && r.data).length})
                </Button>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InstaloaderImporter;
