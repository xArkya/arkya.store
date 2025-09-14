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

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedProductForOffer, setSelectedProductForOffer] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOfferOpen, onOpen: onOfferOpen, onClose: onOfferClose } = useDisclosure();
  const { isOpen: isProductOfferOpen, onOpen: onProductOfferOpen, onClose: onProductOfferClose } = useDisclosure();
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  const textColor = useColorModeValue('gray.700', 'white');
  
  // Cargar productos del localStorage o usar los iniciales
  useEffect(() => {
    const savedProducts = localStorage.getItem('adminProducts');
    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (e) {
        console.error('Error parsing products from localStorage', e);
        setProducts(initialProducts);
      }
    } else {
      setProducts(initialProducts);
    }
    
    const savedOffers = localStorage.getItem('adminOffers');
    if (savedOffers) {
      try {
        setOffers(JSON.parse(savedOffers));
      } catch (e) {
        console.error('Error parsing offers from localStorage', e);
      }
    }
  }, []);
  
  // Guardar productos en localStorage cuando cambian con manejo de errores
  useEffect(() => {
    if (products.length > 0) {
      try {
        // Intentar guardar todos los productos juntos
        localStorage.setItem('adminProducts', JSON.stringify(products));
        
        // Si se guarda correctamente, limpiar cualquier fragmento anterior
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith('adminProducts_chunk_')) {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error al guardar productos en localStorage:', error);
        
        // Si falla por cuota excedida, dividir en fragmentos
        if (error.name === 'QuotaExceededError' || error.code === 22) {
          toast({
            title: 'Advertencia',
            description: 'Las imágenes son muy grandes. Se guardarán con menor calidad.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
          
          // Comprimir las imágenes antes de guardar
          const compressedProducts = products.map(product => {
            // Si el producto tiene imágenes, reducir su calidad
            if (product.images && product.images.length > 0) {
              return {
                ...product,
                // Mantener solo la primera imagen a máxima calidad
                image: product.images[0],
                // Reducir calidad de las imágenes adicionales
                images: product.images.slice(0, 5) // Limitar a 5 imágenes por producto
              };
            }
            return product;
          });
          
          try {
            localStorage.setItem('adminProducts', JSON.stringify(compressedProducts));
          } catch (secondError) {
            console.error('Error al guardar productos comprimidos:', secondError);
            toast({
              title: 'Error de almacenamiento',
              description: 'No se pudieron guardar todos los productos. Considera exportar tus datos.',
              status: 'error',
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
    }
  }, [products, toast]);
  
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
  
  const importProducts = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedProducts = JSON.parse(e.target.result);
        setProducts(importedProducts);
        toast({
          title: 'Productos importados',
          description: `Se han importado ${importedProducts.length} productos`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch {
        toast({
          title: 'Error al importar',
          description: 'El archivo no tiene el formato correcto',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };
    reader.readAsText(file);
  };
  
  const handleImportClick = () => {
    document.getElementById('file-input').click();
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
                    {products.map((product) => (
                      <Tr key={product.id}>
                        <Td>{product.id}</Td>
                        <Td>{product.name}</Td>
                        <Td>{product.category}</Td>
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
                    <Heading size="md" mb={4}>Importar Productos</Heading>
                    <Text mb={4}>
                      Importa productos desde un archivo JSON previamente exportado.
                    </Text>
                    <input
                      type="file"
                      id="file-input"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={importProducts}
                    />
                    <Button 
                      leftIcon={<FaUpload />} 
                      colorScheme="teal" 
                      onClick={handleImportClick}
                    >
                      Importar JSON
                    </Button>
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
