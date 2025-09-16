import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaPlus, FaEdit, FaTrash, FaDownload, FaUpload, FaTag } from 'react-icons/fa';
import ProductForm from '../components/Admin/ProductForm';
import OfferForm from '../components/Admin/OfferForm';
import ProductOfferManager from '../components/Admin/ProductOfferManager';
import { products as initialProducts } from '../data/products';
import { offers as initialOffers } from '../data/offers';

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(50); // Mostrar 50 productos por página
  const [offers, setOffers] = useState(() => {
    try {
      const savedOffers = localStorage.getItem('offers');
      return savedOffers ? JSON.parse(savedOffers) : initialOffers;
    } catch (error) {
      console.error('Error al cargar ofertas desde localStorage:', error);
      return initialOffers;
    }
  });
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedProductForOffer, setSelectedProductForOffer] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOfferOpen, onOpen: onOfferOpen, onClose: onOfferClose } = useDisclosure();
  const { isOpen: isProductOfferOpen, onOpen: onProductOfferOpen, onClose: onProductOfferClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const textColor = useColorModeValue('gray.700', 'white');
  
  // Cargar productos y ofertas iniciales
  useEffect(() => {
    // Cargar productos iniciales
    setProducts(initialProducts);
    
    // Intentar cargar ofertas desde localStorage
    try {
      const savedOffers = localStorage.getItem('adminOffers');
      if (savedOffers) {
        setOffers(JSON.parse(savedOffers));
      }
    } catch (e) {
      console.error('Error al cargar ofertas:', e);
    }
  }, []);
  
  // Guardar ofertas en localStorage cuando cambian
  useEffect(() => {
    if (offers.length > 0) {
      try {
        localStorage.setItem('adminOffers', JSON.stringify(offers));
      } catch (error) {
        console.error('Error al guardar ofertas en localStorage:', error);
      }
    }
  }, [offers]);

  // Guardar productos en localStorage cuando cambian con manejo de errores
  useEffect(() => {
    if (products.length > 0) {
      // Usar IndexedDB en lugar de localStorage para almacenar los productos
      const saveProductsToIndexedDB = async () => {
        try {
          // Abrir o crear la base de datos
          const dbRequest = indexedDB.open('ArkyaStoreDB', 1);
          
          // Crear el almacén de objetos si no existe
          dbRequest.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('products')) {
              db.createObjectStore('products', { keyPath: 'id' });
            }
          };
          
          dbRequest.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event.target.error);
            // Intentar usar localStorage como respaldo
            try {
              // Guardar solo datos esenciales sin imágenes
              const essentialProducts = products.map(product => ({
                id: product.id,
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category,
                subcategory: product.subcategory,
                isNew: product.isNew,
                inStock: product.inStock,
                tags: product.tags
              }));
              localStorage.setItem('adminProducts', JSON.stringify(essentialProducts));
            } catch (localStorageError) {
              console.error('Error al guardar en localStorage:', localStorageError);
            }
          };
          
          dbRequest.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['products'], 'readwrite');
            const store = transaction.objectStore('products');
            
            // Limpiar el almacén anterior
            store.clear();
            
            // Guardar cada producto individualmente
            products.forEach(product => {
              store.add(product);
            });
            
            transaction.oncomplete = () => {
              console.log('Productos guardados en IndexedDB correctamente');
            };
            
            transaction.onerror = (event) => {
              console.error('Error al guardar productos en IndexedDB:', event.target.error);
            };
          };
        } catch (error) {
          console.error('Error general al usar IndexedDB:', error);
        }
      };
      
      saveProductsToIndexedDB();
    }
  }, [products]);
  
  // Guardar ofertas en localStorage cuando cambian
  useEffect(() => {
    if (offers.length > 0) {
      localStorage.setItem('adminOffers', JSON.stringify(offers));
    }
  }, [offers]);
  
  const handleSaveProduct = (product) => {
    if (selectedProduct) {
      // Editar producto existente
      setProducts(products.map(p => p.id === product.id ? product : p));
    } else {
      // Agregar nuevo producto
      setProducts([...products, product]);
    }
    onClose();
    setSelectedProduct(null);
  };
  
  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    onOpen();
  };
  
  const handleDeleteProduct = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id));
      toast({
        title: 'Producto eliminado',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  // Funciones para manejar ofertas
  const handleSaveOffer = (offer) => {
    if (selectedOffer) {
      // Editar oferta existente
      setOffers(offers.map(o => o.id === offer.id ? offer : o));
      toast({
        title: 'Oferta actualizada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } else {
      // Agregar nueva oferta
      setOffers([...offers, offer]);
      toast({
        title: 'Oferta creada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
    onOfferClose();
    setSelectedOffer(null);
  };
  
  const handleEditOffer = (offer) => {
    setSelectedOffer(offer);
    onOfferOpen();
  };
  
  const handleDeleteOffer = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta oferta?')) {
      setOffers(offers.filter(o => o.id !== id));
      toast({
        title: 'Oferta eliminada',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const toggleOfferStatus = (id) => {
    setOffers(offers.map(offer => 
      offer.id === id ? { ...offer, isActive: !offer.isActive } : offer
    ));
  };
  
  // Funciones para manejar ofertas de productos
  const handleManageProductOffer = (product) => {
    setSelectedProductForOffer(product);
    onProductOfferOpen();
  };
  
  const handleUpdateProductOffer = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    onProductOfferClose();
    setSelectedProductForOffer(null);
  };
  
  const exportProducts = () => {
    const dataStr = JSON.stringify(products, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'products.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: 'Productos exportados',
      description: 'Se ha descargado el archivo products.json',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };
  
  const generateProductsJs = () => {
    const jsContent = `export const products = ${JSON.stringify(products, null, 2)};`;
    const dataUri = 'data:text/javascript;charset=utf-8,'+ encodeURIComponent(jsContent);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'products.js');
    linkElement.click();
    
    toast({
      title: 'Archivo JS generado',
      description: 'Se ha descargado el archivo products.js listo para usar en tu proyecto',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const exportOffers = () => {
    const dataStr = JSON.stringify(offers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'offers.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: 'Ofertas exportadas',
      description: 'Se ha descargado el archivo offers.json',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const generateOffersJs = () => {
    const jsContent = `export const offers = ${JSON.stringify(offers, null, 2)};`;
    const dataUri = 'data:text/javascript;charset=utf-8,'+ encodeURIComponent(jsContent);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'offers.js');
    linkElement.click();
    
    toast({
      title: 'Archivo JS generado',
      description: 'Se ha descargado el archivo offers.js listo para usar en tu proyecto',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>Administración de Productos</Heading>
          <Text>Gestiona los productos de tu tienda de Instagram</Text>
        </Box>
        
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Información importante</AlertTitle>
            <AlertDescription>
              Los cambios se guardan automáticamente en el navegador. Para usar en producción, 
              exporta los productos y reemplaza el archivo products.js en tu proyecto.
            </AlertDescription>
          </Box>
        </Alert>
        
        <Tabs colorScheme="brand" variant="enclosed">
          <TabList>
            <Tab>Productos</Tab>
            <Tab>Ofertas</Tab>
            <Tab>Importar/Exportar</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Box 
                bg={bgColor}
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                overflowX="auto"
              >
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Lista de Productos</Heading>
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="brand" 
                    onClick={() => {
                      setSelectedProduct(null);
                      onOpen();
                    }}
                  >
                    Nuevo Producto
                  </Button>
                </HStack>
                
                <Box mb={4}>
                  <HStack spacing={4} justify="space-between" mb={2}>
                    <Text color="gray.600">
                      Mostrando {Math.min((currentPage - 1) * productsPerPage + 1, products.length)} - {Math.min(currentPage * productsPerPage, products.length)} de {products.length} productos
                    </Text>
                    <HStack>
                      <Button
                        size="sm"
                        onClick={() => setProductsPerPage(50)}
                        colorScheme={productsPerPage === 50 ? "brand" : "gray"}
                        variant={productsPerPage === 50 ? "solid" : "outline"}
                      >
                        50 por página
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setProductsPerPage(100)}
                        colorScheme={productsPerPage === 100 ? "brand" : "gray"}
                        variant={productsPerPage === 100 ? "solid" : "outline"}
                      >
                        100 por página
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setProductsPerPage(products.length)}
                        colorScheme={productsPerPage === products.length ? "brand" : "gray"}
                        variant={productsPerPage === products.length ? "solid" : "outline"}
                      >
                        Ver todos
                      </Button>
                    </HStack>
                  </HStack>
                  
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>ID</Th>
                        <Th>Nombre</Th>
                        <Th>Categoría</Th>
                        <Th>Precio</Th>
                        <Th>Estado</Th>
                        <Th>Oferta</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {products
                        .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                        .map((product) => (
                      <Tr key={product.id}>
                        <Td>{product.id}</Td>
                        <Td>{product.name}</Td>
                        <Td>
                          {product.categories && product.categories.length > 0 
                            ? product.categories.join(', ')
                            : product.category
                          }
                        </Td>
                        <Td>${product.price.toLocaleString()}</Td>
                        <Td>
                          {product.isNew ? (
                            <Badge colorScheme="green">Nuevo</Badge>
                          ) : (
                            <Badge colorScheme="gray">Regular</Badge>
                          )}
                        </Td>
                        <Td>
                          {product.isOnOffer ? (
                            <VStack align="start" spacing={1}>
                              <Badge colorScheme="red">En Oferta</Badge>
                              <Text fontSize="xs" color="gray.500">
                                -{product.discountPercentage}%
                              </Text>
                            </VStack>
                          ) : (
                            <Badge colorScheme="gray" variant="outline">Sin Oferta</Badge>
                          )}
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<FaEdit />}
                              size="sm"
                              aria-label="Editar"
                              colorScheme="blue"
                              onClick={() => handleEditProduct(product)}
                            />
                            <IconButton
                              icon={<FaTag />}
                              size="sm"
                              aria-label="Gestionar Oferta"
                              colorScheme={product.isOnOffer ? "orange" : "gray"}
                              onClick={() => handleManageProductOffer(product)}
                            />
                            <IconButton
                              icon={<FaTrash />}
                              size="sm"
                              aria-label="Eliminar"
                              colorScheme="red"
                              onClick={() => handleDeleteProduct(product.id)}
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                    </Tbody>
                  </Table>
                  
                  {/* Paginación */}
                  {products.length > productsPerPage && (
                    <HStack spacing={2} justify="center" mt={4}>
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        isDisabled={currentPage === 1}
                      >
                        Primera
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        isDisabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      
                      {/* Mostrar números de página */}
                      {[...Array(Math.min(5, Math.ceil(products.length / productsPerPage)))].map((_, i) => {
                        let pageNum;
                        const totalPages = Math.ceil(products.length / productsPerPage);
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        if (pageNum > 0 && pageNum <= totalPages) {
                          return (
                            <Button
                              key={pageNum}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              colorScheme={currentPage === pageNum ? "brand" : "gray"}
                              variant={currentPage === pageNum ? "solid" : "outline"}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                        return null;
                      })}
                      
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(products.length / productsPerPage)))}
                        isDisabled={currentPage === Math.ceil(products.length / productsPerPage)}
                      >
                        Siguiente
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setCurrentPage(Math.ceil(products.length / productsPerPage))}
                        isDisabled={currentPage === Math.ceil(products.length / productsPerPage)}
                      >
                        Última
                      </Button>
                    </HStack>
                  )}
                </Box>
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box 
                bg={bgColor}
                p={4}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
                overflowX="auto"
              >
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Lista de Ofertas</Heading>
                  <Button 
                    leftIcon={<FaPlus />} 
                    colorScheme="brand" 
                    onClick={() => {
                      setSelectedOffer(null);
                      onOfferOpen();
                    }}
                  >
                    Nueva Oferta
                  </Button>
                </HStack>
                
                {offers.length === 0 ? (
                  <Text textAlign="center" py={8} color="gray.500">
                    No hay ofertas creadas. Haz clic en "Nueva Oferta" para empezar.
                  </Text>
                ) : (
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Título</Th>
                        <Th>Código</Th>
                        <Th>Descuento</Th>
                        <Th>Fecha Inicio</Th>
                        <Th>Fecha Fin</Th>
                        <Th>Estado</Th>
                        <Th>Usos</Th>
                        <Th>Acciones</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {offers.map((offer) => (
                        <Tr key={offer.id}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold">{offer.title}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {offer.description}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Badge colorScheme="purple" variant="outline">
                              {offer.code}
                            </Badge>
                          </Td>
                          <Td>
                            {offer.discountType === 'percentage' 
                              ? `${offer.discountPercentage}%`
                              : `$${offer.discountAmount}`
                            }
                          </Td>
                          <Td>
                            {offer.startDate 
                              ? new Date(offer.startDate).toLocaleDateString()
                              : 'Sin fecha'
                            }
                          </Td>
                          <Td>
                            {offer.endDate 
                              ? new Date(offer.endDate).toLocaleDateString()
                              : 'Sin fecha'
                            }
                          </Td>
                          <Td>
                            <Badge 
                              colorScheme={offer.isActive ? 'green' : 'red'}
                              cursor="pointer"
                              onClick={() => toggleOfferStatus(offer.id)}
                            >
                              {offer.isActive ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </Td>
                          <Td>
                            {offer.currentUses || 0}
                            {offer.maxUses > 0 && ` / ${offer.maxUses}`}
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              <IconButton
                                icon={<FaEdit />}
                                size="sm"
                                colorScheme="blue"
                                variant="outline"
                                onClick={() => handleEditOffer(offer)}
                              />
                              <IconButton
                                icon={<FaTrash />}
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                onClick={() => handleDeleteOffer(offer.id)}
                              />
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </Box>
            </TabPanel>
            
            <TabPanel>
              <Box 
                bg={bgColor}
                p={6}
                borderRadius="md"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <VStack spacing={6} align="stretch">
                  <Box>
                    <Heading size="md" mb={4}>Exportar Productos</Heading>
                    <Text mb={4}>
                      Exporta tus productos para hacer una copia de seguridad o para usarlos en otra instalación.
                    </Text>
                    <HStack>
                      <Button 
                        leftIcon={<FaDownload />} 
                        colorScheme="blue" 
                        onClick={exportProducts}
                      >
                        Exportar JSON
                      </Button>
                      <Button 
                        leftIcon={<FaDownload />} 
                        colorScheme="purple" 
                        onClick={generateProductsJs}
                      >
                        Generar products.js
                      </Button>
                    </HStack>
                  </Box>

                  <Box>
                    <Heading size="md" mb={4}>Exportar Ofertas</Heading>
                    <Text mb={4}>
                      Exporta tus ofertas para hacer una copia de seguridad o para usarlas en otra instalación.
                    </Text>
                    <HStack>
                      <Button 
                        leftIcon={<FaDownload />} 
                        colorScheme="blue" 
                        onClick={exportOffers}
                      >
                        Exportar JSON
                      </Button>
                      <Button 
                        leftIcon={<FaDownload />} 
                        colorScheme="purple" 
                        onClick={generateOffersJs}
                      >
                        Generar offers.js
                      </Button>
                    </HStack>
                  </Box>
                  
                </VStack>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
      
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor} color={textColor}>
          <ModalHeader>
            {selectedProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <ProductForm 
              onSaveProduct={handleSaveProduct} 
              initialValues={selectedProduct}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isOfferOpen} onClose={onOfferClose} size="xl">
        <ModalOverlay />
        <ModalContent bg={bgColor} color={textColor}>
          <ModalHeader>
            {selectedOffer ? 'Editar Oferta' : 'Nueva Oferta'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <OfferForm 
              onSaveOffer={handleSaveOffer} 
              initialValues={selectedOffer}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
      
      <Modal isOpen={isProductOfferOpen} onClose={onProductOfferClose} size="lg">
        <ModalOverlay />
        <ModalContent bg={bgColor} color={textColor}>
          <ModalHeader>
            Gestionar Oferta del Producto
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedProductForOffer && (
              <ProductOfferManager 
                product={selectedProductForOffer}
                onUpdateProduct={handleUpdateProductOffer}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default AdminPage;
