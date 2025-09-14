import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  FormHelperText,
  VStack,
  Heading,
  useToast,
  HStack,
  Text,
  useColorModeValue,
  InputGroup,
  InputLeftElement,
  Icon,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
} from '@chakra-ui/react';
import { FaImage, FaDollarSign, FaSave, FaPlus, FaTrash, FaUpload } from 'react-icons/fa';
import { categories } from '../../data/categories';

// Función para comprimir y convertir imagen a base64
const compressAndConvertToBase64 = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    // Primero convertimos el archivo a una URL de objeto
    const objectUrl = URL.createObjectURL(file);
    
    // Creamos una imagen para obtener las dimensiones
    const img = new Image();
    img.onload = () => {
      // Liberamos la URL del objeto
      URL.revokeObjectURL(objectUrl);
      
      // Calculamos las nuevas dimensiones manteniendo la proporción
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      // Creamos un canvas para comprimir la imagen
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Dibujamos la imagen en el canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convertimos el canvas a base64 con la calidad especificada
      const base64 = canvas.toDataURL('image/jpeg', quality);
      
      resolve(base64);
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    
    img.src = objectUrl;
  });
};

const ProductForm = ({ onSaveProduct, initialValues = null }) => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  
  const [product, setProduct] = useState(initialValues || {
    name: '',
    description: '',
    price: '',
    image: '',
    images: [''], // Array de imágenes
    categories: [], // Array de categorías
    category: '', // Mantener para compatibilidad
    subcategory: '',
    isNew: true,
    details: '',
    instagram: 'https://instagram.com/arkya.store'
  });
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  
  // Efecto para manejar compatibilidad con productos existentes
  useEffect(() => {
    if (initialValues) {
      // Si el producto tiene images, usarlo; sino, crear array con image
      const productImages = initialValues.images && initialValues.images.length > 0 
        ? initialValues.images 
        : initialValues.image ? [initialValues.image] : [''];
      
      // Manejar categorías múltiples
      const productCategories = initialValues.categories && initialValues.categories.length > 0
        ? initialValues.categories
        : initialValues.category ? [initialValues.category] : [];
      
      setProduct({
        ...initialValues,
        images: productImages,
        image: productImages[0] || initialValues.image || '',
        categories: productCategories,
        category: initialValues.category || '', // Mantener para compatibilidad
        subcategory: initialValues.subcategory || ''
      });
      
      // Configurar categoría seleccionada y subcategorías disponibles
      if (initialValues.category) {
        const foundCategory = categories.find(cat => cat.name === initialValues.category);
        if (foundCategory) {
          setSelectedCategory(foundCategory);
          setAvailableSubcategories(foundCategory.subcategories);
        }
      }
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Si cambia la categoría principal (para compatibilidad), actualizar las subcategorías disponibles
    if (name === 'category') {
      const selectedCat = categories.find(cat => cat.name === value);
      setSelectedCategory(selectedCat || null);
      setAvailableSubcategories(selectedCat ? selectedCat.subcategories : []);
      
      // Resetear la subcategoría si cambia la categoría
      setProduct(prev => ({
        ...prev,
        subcategory: ''
      }));
    }
  };
  
  // Función para manejar la selección múltiple de categorías
  const handleCategoryToggle = (categoryName) => {
    setProduct(prev => {
      const currentCategories = [...(prev.categories || [])];
      
      // Si ya está seleccionada, quitarla
      if (currentCategories.includes(categoryName)) {
        return {
          ...prev,
          categories: currentCategories.filter(cat => cat !== categoryName)
        };
      } 
      // Si no está seleccionada, agregarla
      else {
        return {
          ...prev,
          categories: [...currentCategories, categoryName],
          // Actualizar también la categoría principal si es la primera que se selecciona
          category: prev.category || categoryName
        };
      }
    });
  };
  
  // Funciones para manejar múltiples imágenes
  const handleImageChange = (index, value) => {
    const currentImages = product.images || [''];
    const newImages = [...currentImages];
    newImages[index] = value;
    setProduct({
      ...product,
      images: newImages,
      image: newImages[0] // Mantener compatibilidad con imagen principal
    });
  };
  
  // Función para manejar la carga de múltiples archivos de imagen
  const handleImageUpload = async (index, files) => {
    if (!files || files.length === 0) {
      console.log('No se seleccionaron archivos');
      return;
    }
    
    try {
      // Procesar todas las imágenes seleccionadas
      const imagePromises = [];
      const validFiles = [];
      
      console.log(`Procesando ${files.length} archivos`);
      
      // Verificar que todos los archivos sean imágenes
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Archivo ${i+1}: ${file.name}, tipo: ${file.type}`);
        
        if (file.type.startsWith('image/')) {
          // Usar la función de compresión en lugar de la conversión directa
          imagePromises.push(compressAndConvertToBase64(file, 800, 0.6));
          validFiles.push(file);
        } else {
          console.warn(`El archivo ${file.name} no es una imagen y será ignorado`);
        }
      }
      
      if (validFiles.length === 0) {
        toast({
          title: 'Error',
          description: 'Ninguno de los archivos seleccionados es una imagen válida',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      console.log(`Convirtiendo ${validFiles.length} imágenes válidas a base64`);
      
      // Convertir todas las imágenes a base64
      const base64Images = await Promise.all(imagePromises);
      
      console.log(`Conversión completada: ${base64Images.length} imágenes`);
      
      // Actualizar el estado con las nuevas imágenes
      const currentImages = [...(product.images || [''])];
      let newImages = [];
      
      // Si es una sola imagen y estamos en un campo vacío, simplemente reemplazamos
      if (base64Images.length === 1 && (!currentImages[index] || currentImages[index] === '')) {
        newImages = [...currentImages];
        newImages[index] = base64Images[0];
      } 
      // Si son múltiples imágenes o estamos reemplazando una existente
      else {
        // Reemplazar la imagen actual con la primera y agregar el resto como nuevas imágenes
        newImages = [...currentImages];
        
        // Reemplazar la imagen actual
        if (index < newImages.length) {
          newImages[index] = base64Images[0];
        }
        
        // Agregar el resto de imágenes al final
        if (base64Images.length > 1) {
          for (let i = 1; i < base64Images.length; i++) {
            newImages.push(base64Images[i]);
          }
        }
      }
      
      // Eliminar entradas vacías
      newImages = newImages.filter(img => img && img.trim() !== '');
      
      // Si no hay imágenes, agregar una entrada vacía
      if (newImages.length === 0) {
        newImages = [''];
      }
      
      console.log(`Actualizando estado con ${newImages.length} imágenes`);
      
      setProduct({
        ...product,
        images: newImages,
        image: newImages[0] // Mantener compatibilidad con imagen principal
      });
      
      toast({
        title: 'Imágenes cargadas',
        description: `Se han cargado ${base64Images.length} imágenes correctamente`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al cargar las imágenes:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar algunas imágenes: ' + error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  const addImageField = () => {
    const currentImages = product.images || [''];
    setProduct({
      ...product,
      images: [...currentImages, '']
    });
  };
  
  const removeImageField = (index) => {
    const currentImages = product.images || [''];
    if (currentImages.length > 1) {
      const newImages = currentImages.filter((_, i) => i !== index);
      setProduct({
        ...product,
        images: newImages,
        image: newImages[0] || '' // Actualizar imagen principal
      });
    }
  };
  
  // Función para mover una imagen hacia arriba en la lista
  const moveImageUp = (index) => {
    if (index <= 0) return; // No hacer nada si es la primera imagen
    
    const currentImages = [...(product.images || [''])];
    
    // Intercambiar la imagen actual con la anterior
    [currentImages[index], currentImages[index - 1]] = [currentImages[index - 1], currentImages[index]];
    
    // Actualizar el estado con las imágenes reordenadas
    setProduct({
      ...product,
      images: currentImages,
      image: currentImages[0] // Mantener compatibilidad con imagen principal
    });
    
    toast({
      title: 'Imagen movida',
      description: 'La imagen se ha movido hacia arriba',
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };
  
  // Función para mover una imagen hacia abajo en la lista
  const moveImageDown = (index) => {
    const currentImages = [...(product.images || [''])];
    
    if (index >= currentImages.length - 1) return; // No hacer nada si es la última imagen
    
    // Intercambiar la imagen actual con la siguiente
    [currentImages[index], currentImages[index + 1]] = [currentImages[index + 1], currentImages[index]];
    
    // Actualizar el estado con las imágenes reordenadas
    setProduct({
      ...product,
      images: currentImages,
      image: currentImages[0] // Mantener compatibilidad con imagen principal
    });
    
    toast({
      title: 'Imagen movida',
      description: 'La imagen se ha movido hacia abajo',
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!product.name || !product.description || !product.price) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios (nombre, descripción y precio).',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Verificar que haya al menos una imagen
    const hasImages = product.images && product.images.some(img => img && img.trim() !== '');
    if (!hasImages) {
      toast({
        title: 'Error',
        description: 'Por favor agrega al menos una imagen para el producto.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Validar que haya al menos una categoría seleccionada
    if (!product.categories || product.categories.length === 0) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona al menos una categoría para el producto.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    // Crear un ID único basado en timestamp si es un producto nuevo
    // Filtrar imágenes vacías
    const filteredImages = (product.images || []).filter(img => img && img.trim() !== '');
    
    const newProduct = {
      ...product,
      id: initialValues?.id || Date.now(),
      price: parseFloat(product.price),
      images: filteredImages,
      image: filteredImages[0] || '' // Asegurar que image siempre tenga la primera imagen
    };
    
    onSaveProduct(newProduct);
    
    toast({
      title: 'Producto guardado',
      description: `El producto "${product.name}" ha sido guardado exitosamente.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
    
    // Resetear el formulario si es un producto nuevo
    if (!initialValues) {
      setProduct({
        name: '',
        description: '',
        price: '',
        image: '',
        category: product.category, // Mantener la categoría seleccionada
        isNew: true,
        details: '',
        instagram: 'https://instagram.com/arkya.store'
      });
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      // Verificar si la categoría ya existe
      const categoryExists = categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase());
      
      if (!categoryExists) {
        // Crear nueva categoría y agregarla al array de categorías
        const newCategoryObj = {
          id: newCategory.toLowerCase().replace(/\s+/g, '-'),
          name: newCategory.trim(),
          subcategories: []
        };
        
        categories.push(newCategoryObj);
        
        setProduct({
          ...product,
          category: newCategoryObj.name
        });
        
        setSelectedCategory(newCategoryObj);
        setAvailableSubcategories([]);
        setNewCategory('');
        
        toast({
          title: 'Categoría agregada',
          description: `La categoría "${newCategory}" ha sido agregada.`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Categoría existente',
          description: 'Esta categoría ya existe.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };
  
  const handleAddSubcategory = () => {
    if (!selectedCategory) {
      toast({
        title: 'Error',
        description: 'Primero debes seleccionar una categoría',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (newSubcategory.trim()) {
      // Verificar si la subcategoría ya existe en esta categoría
      const subcategoryExists = selectedCategory.subcategories.some(
        subcat => subcat.name.toLowerCase() === newSubcategory.trim().toLowerCase()
      );
      
      if (!subcategoryExists) {
        // Crear nueva subcategoría
        const newSubcategoryObj = {
          id: newSubcategory.toLowerCase().replace(/\s+/g, '-'),
          name: newSubcategory.trim()
        };
        
        // Agregar a la categoría seleccionada
        const categoryIndex = categories.findIndex(cat => cat.id === selectedCategory.id);
        if (categoryIndex !== -1) {
          categories[categoryIndex].subcategories.push(newSubcategoryObj);
          
          // Actualizar estado
          setSelectedCategory(categories[categoryIndex]);
          setAvailableSubcategories(categories[categoryIndex].subcategories);
          
          // Seleccionar la nueva subcategoría
          setProduct({
            ...product,
            subcategory: newSubcategoryObj.name
          });
          
          setNewSubcategory('');
          
          toast({
            title: 'Subcategoría agregada',
            description: `La subcategoría "${newSubcategory}" ha sido agregada a "${selectedCategory.name}".`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'Subcategoría existente',
          description: 'Esta subcategoría ya existe en la categoría seleccionada.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  return (
    <Box 
      as="form" 
      onSubmit={handleSubmit}
      bg={bgColor}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      boxShadow="md"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md" mb={2}>
          {initialValues ? 'Editar Producto' : 'Agregar Nuevo Producto'}
        </Heading>
        
        <FormControl isRequired>
          <FormLabel>Nombre del Producto</FormLabel>
          <Input
            name="name"
            value={product.name}
            onChange={handleChange}
            placeholder="Ej: Camiseta Premium"
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Descripción Corta</FormLabel>
          <Textarea
            name="description"
            value={product.description}
            onChange={handleChange}
            placeholder="Descripción breve que aparecerá en la tarjeta del producto"
            rows={2}
          />
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Precio</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaDollarSign color="gray.300" />
            </InputLeftElement>
            <Input
              name="price"
              type="number"
              step="0.01"
              value={product.price}
              onChange={handleChange}
              placeholder="29.99"
            />
          </InputGroup>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Imágenes del Producto</FormLabel>
          <FormHelperText mb={2}>
            La primera imagen será la principal. Puedes subir imágenes directamente o usar URLs.
          </FormHelperText>
          <Box p={3} mb={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text fontWeight="medium" color="blue.700">
              <strong>Tip:</strong> Usa los botones de flecha para reordenar las imágenes. La imagen en la posición #1 será la principal.
            </Text>
          </Box>
          
          <VStack spacing={3} align="stretch">
            {(product.images || ['']).map((imageUrl, index) => (
              <Box
                key={index}
                borderRadius="md"
                p={2}
                borderWidth="1px"
                borderColor={index === 0 ? "purple.300" : "gray.200"}
                bg={index === 0 ? "purple.50" : "transparent"}
                mb={2}
                transition="all 0.2s"
                _hover={{ bg: 'gray.50', borderColor: 'purple.200' }}
              >
                <HStack spacing={2} mb={2}>
                  {/* Indicador de posición */}
                  <Box 
                    bg={index === 0 ? "purple.200" : "gray.200"}
                    p={2} 
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text fontSize="sm" fontWeight="bold">{index + 1}</Text>
                  </Box>
                  
                  {/* Botones para reordenar */}
                  <VStack spacing={1}>
                    <Button
                      size="xs"
                      colorScheme="purple"
                      isDisabled={index === 0}
                      onClick={() => moveImageUp(index)}
                      aria-label="Mover hacia arriba"
                    >
                      ↑
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="purple"
                      isDisabled={index === (product.images || ['']).length - 1}
                      onClick={() => moveImageDown(index)}
                      aria-label="Mover hacia abajo"
                    >
                      ↓
                    </Button>
                  </VStack>
                  
                  <InputGroup flex={1}>
                    <InputLeftElement pointerEvents="none">
                      <FaImage color="gray.300" />
                    </InputLeftElement>
                    <Input
                      value={imageUrl && imageUrl.startsWith('data:') ? 'Imagen cargada' : imageUrl}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder={`URL de imagen ${index + 1}`}
                    />
                  </InputGroup>
                  
                  {/* Botón para subir imagen directamente */}
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => {
                      // Crear un input de archivo temporal
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.multiple = true;
                      
                      // Manejar el cambio cuando se seleccionen archivos
                      fileInput.onchange = (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageUpload(index, e.target.files);
                        }
                      };
                      
                      // Simular clic en el input
                      fileInput.click();
                    }}
                    leftIcon={<FaUpload />}
                  >
                    Subir
                  </Button>
                  
                  {(product.images || ['']).length > 1 && (
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => removeImageField(index)}
                    >
                      <FaTrash />
                    </Button>
                  )}
                </HStack>
                
                {/* Vista previa de la imagen */}
                {imageUrl && (
                  <Box 
                    mt={1} 
                    mb={2} 
                    maxH="150px" 
                    overflow="hidden" 
                    borderRadius="md"
                    border="1px solid"
                    borderColor="gray.200"
                  >
                    <img 
                      src={imageUrl} 
                      alt={`Vista previa ${index + 1}`} 
                      style={{ 
                        maxHeight: '150px', 
                        maxWidth: '100%', 
                        margin: '0 auto',
                        display: 'block'
                      }} 
                      onError={(e) => {
                        // Si la imagen no carga, mostrar un placeholder
                        if (!imageUrl.startsWith('data:')) {
                          e.target.src = 'https://via.placeholder.com/150?text=Error+de+carga';
                        }
                      }}
                    />
                  </Box>
                )}
              </Box>
            ))}
          </VStack>
          
          <Button
            mt={4}
            size="sm"
            leftIcon={<FaPlus />}
            colorScheme="blue"
            variant="outline"
            onClick={addImageField}
          >
            Agregar Imagen
          </Button>
          
          <Text mt={2} fontSize="sm" color="gray.600">
            * Si subes imágenes y aparece "Selecciona uno o más archivos", simplemente haz clic en el botón "Guardar Producto" nuevamente.
          </Text>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Categorías (selecciona una o más)</FormLabel>
          <Box borderWidth="1px" borderRadius="md" p={3} mb={2}>
            <CheckboxGroup>
              <Wrap spacing={4}>
                {categories.map((category) => (
                  <WrapItem key={category.id}>
                    <Checkbox
                      isChecked={(product.categories || []).includes(category.name)}
                      onChange={() => handleCategoryToggle(category.name)}
                    >
                      {category.name}
                    </Checkbox>
                  </WrapItem>
                ))}
              </Wrap>
            </CheckboxGroup>
          </Box>
          <Box mt={2}>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Categorías seleccionadas:</Text>
            <Wrap spacing={2}>
              {(product.categories || []).length === 0 ? (
                <Text fontSize="sm" color="gray.500">Ninguna categoría seleccionada</Text>
              ) : (
                (product.categories || []).map((catName, index) => (
                  <Tag key={index} size="md" colorScheme="brand" borderRadius="full" variant="solid">
                    <TagLabel>{catName}</TagLabel>
                    <TagCloseButton onClick={() => handleCategoryToggle(catName)} />
                  </Tag>
                ))
              )}
            </Wrap>
          </Box>
          <FormHelperText>
            Selecciona al menos una categoría para el producto. La primera categoría seleccionada será la principal.
          </FormHelperText>
        </FormControl>
        
        <HStack>
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría..."
          />
          <Button onClick={handleAddCategory} colorScheme="brand" size="md">
            Agregar
          </Button>
        </HStack>
        
        {/* Subcategoría */}
        <FormControl>
          <FormLabel>Subcategoría {selectedCategory?.subcategories?.length > 0 && '(Opcional)'}</FormLabel>
          <Select
            name="subcategory"
            value={product.subcategory}
            onChange={handleChange}
            placeholder="Selecciona una subcategoría"
            isDisabled={!selectedCategory || availableSubcategories.length === 0}
          >
            {availableSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.name}>
                {subcategory.name}
              </option>
            ))}
          </Select>
          {selectedCategory && (
            <FormHelperText>
              {availableSubcategories.length === 0 
                ? 'Esta categoría no tiene subcategorías disponibles.' 
                : 'Selecciona una subcategoría para este producto.'}
            </FormHelperText>
          )}
        </FormControl>
        
        {/* Agregar nueva subcategoría */}
        {selectedCategory && (
          <HStack>
            <Input
              value={newSubcategory}
              onChange={(e) => setNewSubcategory(e.target.value)}
              placeholder="Nueva subcategoría..."
              isDisabled={!selectedCategory}
            />
            <Button 
              onClick={handleAddSubcategory} 
              colorScheme="brand" 
              size="md"
              isDisabled={!selectedCategory}
            >
              Agregar
            </Button>
          </HStack>
        )}
        
        <FormControl>
          <FormLabel>Detalles del Producto</FormLabel>
          <Textarea
            name="details"
            value={product.details}
            onChange={handleChange}
            placeholder="Descripción detallada del producto, materiales, tallas disponibles, etc."
            rows={4}
          />
        </FormControl>
        
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="isNew" mb="0">
            ¿Es un producto nuevo?
          </FormLabel>
          <Switch
            id="isNew"
            name="isNew"
            isChecked={product.isNew}
            onChange={handleChange}
            colorScheme="brand"
          />
        </FormControl>
        
        <Button 
          onClick={handleSubmit}
          colorScheme="brand" 
          size="lg" 
          leftIcon={<FaSave />}
          mt={4}
        >
          Guardar Producto
        </Button>
      </VStack>
    </Box>
  );
};

export default ProductForm;
