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
  Tooltip,
} from '@chakra-ui/react';
import { FaImage, FaDollarSign, FaSave, FaPlus, FaTrash, FaUpload, FaGripVertical } from 'react-icons/fa';
import { categories } from '../../data/categories';

const ProductForm = ({ onSaveProduct, initialValues = null, onClose = null }) => {
  const toast = useToast();
  const bgColor = useColorModeValue('white', '#2a1c29');
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.300');
  
  const [product, setProduct] = useState({
    name: '',
    description: '',
    details: '',
    price: '',
    image: '',
    images: [''],
    category: '',
    subcategory: '',
    isNew: false,
    inStock: true,
    tags: [],
    adultContent: false,
    instagram: '',
    categories: [],
    ...initialValues
  });
  const [imagePreviews, setImagePreviews] = useState({});
  
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableSubcategories, setAvailableSubcategories] = useState([]);

  const [newCategory, setNewCategory] = useState('');
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [draggedImageIndex, setDraggedImageIndex] = useState(null);
  
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
        subcategory: initialValues.subcategory || '',
        tags: initialValues.tags || [] // Asegurar que las etiquetas se carguen correctamente
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

  // Función para validar y sanitizar datos
  const sanitizeInput = (value, inputType) => {
    if (!value) return value;
    
    if (inputType === 'number') {
      // Solo permitir números positivos
      const num = parseFloat(value);
      return isNaN(num) || num < 0 ? 0 : num;
    } else if (inputType === 'text') {
      // Remover caracteres peligrosos
      return String(value).replace(/[<>]/g, '');
    } else if (inputType === 'url') {
      // Validar que sea una URL válida
      try {
        new URL(value);
        return value;
      } catch {
        return '';
      }
    }
    return value;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Para campos de precio, asegurarse de que sean números enteros
    if (name === 'price') {
      // Convertir a número entero y sanitizar
      const intValue = parseInt(sanitizeInput(value, 'number'), 10);
      setProduct({
        ...product,
        [name]: isNaN(intValue) ? '' : intValue
      });
    } else if (name === 'instagram') {
      // Validar URL de Instagram
      const sanitized = sanitizeInput(value, 'url');
      setProduct({
        ...product,
        [name]: sanitized
      });
    } else if (name === 'name' || name === 'description' || name === 'details') {
      // Sanitizar texto para evitar inyecciones
      const sanitized = sanitizeInput(value, 'text');
      setProduct({
        ...product,
        [name]: sanitized
      });
    } else {
      setProduct({
        ...product,
        [name]: type === 'checkbox' ? checked : value
      });
    }
    
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
        // Si es la categoría principal, actualizar el estado de la categoría seleccionada
        if (prev.category === categoryName) {
          const newCategories = currentCategories.filter(cat => cat !== categoryName);
          const newCategory = newCategories.length > 0 ? newCategories[0] : '';
          
          // Actualizar la categoría seleccionada y las subcategorías disponibles
          const selectedCat = categories.find(cat => cat.name === newCategory);
          setSelectedCategory(selectedCat || null);
          setAvailableSubcategories(selectedCat ? selectedCat.subcategories : []);
          
          return {
            ...prev,
            categories: newCategories,
            category: newCategory,
            subcategory: '' // Resetear subcategoría
          };
        }
        
        return {
          ...prev,
          categories: currentCategories.filter(cat => cat !== categoryName)
        };
      } 
      // Si no está seleccionada, agregarla
      else {
        const newCategories = [...currentCategories, categoryName];
        const wasEmpty = currentCategories.length === 0;
        
        // Si es la primera categoría que se selecciona, actualizar también la categoría principal
        if (wasEmpty) {
          // Actualizar la categoría seleccionada y las subcategorías disponibles
          const selectedCat = categories.find(cat => cat.name === categoryName);
          setSelectedCategory(selectedCat || null);
          setAvailableSubcategories(selectedCat ? selectedCat.subcategories : []);
        }
        
        return {
          ...prev,
          categories: newCategories,
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
  
  // Función para convertir archivo a base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Función para manejar la carga de múltiples archivos de imagen
  const handleImageUpload = async (index, files) => {
    if (!files || files.length === 0) {
      console.log('No se seleccionaron archivos');
      return;
    }
    
    try {
      const validFiles = [];
      const imageDataUrls = [];
      const newPreviews = { ...imagePreviews };
      
      console.log(`Procesando ${files.length} archivos`);
      
      // Verificar que todos los archivos sean imágenes y convertir a base64
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`Archivo ${i+1}: ${file.name}, tipo: ${file.type}`);
        
        if (file.type.startsWith('image/')) {
          try {
            // Convertir archivo a base64
            const base64Data = await fileToBase64(file);
            
            // Crear URL temporal para vista previa
            const previewUrl = URL.createObjectURL(file);
            newPreviews[base64Data] = previewUrl;
            
            validFiles.push(file);
            imageDataUrls.push(base64Data);
          } catch (error) {
            console.error(`Error al procesar el archivo ${file.name}:`, error);
          }
        } else {
          console.warn(`El archivo ${file.name} no es una imagen y será ignorado`);
        }
      }
      
      // Actualizar previews
      setImagePreviews(newPreviews);
      
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
      
      console.log(`Procesando ${validFiles.length} imágenes válidas`);
      
      // Actualizar el estado con las nuevas imágenes en base64
      const currentImages = [...(product.images || [''])];
      let newImages = [];
      
      // Si es una sola imagen y estamos en un campo vacío, simplemente reemplazamos
      if (imageDataUrls.length === 1 && (!currentImages[index] || currentImages[index] === '')) {
        newImages = [...currentImages];
        newImages[index] = imageDataUrls[0];
      } 
      // Si son múltiples imágenes o estamos reemplazando una existente
      else {
        // Reemplazar la imagen actual con la primera y agregar el resto como nuevas imágenes
        newImages = [...currentImages];
        
        // Reemplazar la imagen actual
        if (index < newImages.length) {
          newImages[index] = imageDataUrls[0];
        }
        
        // Agregar el resto de imágenes al final
        if (imageDataUrls.length > 1) {
          for (let i = 1; i < imageDataUrls.length; i++) {
            newImages.push(imageDataUrls[i]);
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
        description: `Se han cargado ${validFiles.length} imágenes correctamente. Guarda el producto para completar la carga.`,
        status: 'success',
        duration: 3000,
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

  // Funciones para drag-and-drop
  const handleDragStart = (index) => {
    setDraggedImageIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedImageIndex === null || draggedImageIndex === targetIndex) {
      setDraggedImageIndex(null);
      return;
    }

    const currentImages = [...(product.images || [''])];
    const draggedImage = currentImages[draggedImageIndex];
    
    // Remover la imagen arrastrada
    currentImages.splice(draggedImageIndex, 1);
    
    // Insertar en la nueva posición
    const newIndex = draggedImageIndex < targetIndex ? targetIndex - 1 : targetIndex;
    currentImages.splice(newIndex, 0, draggedImage);

    setProduct({
      ...product,
      images: currentImages,
      image: currentImages[0]
    });

    setDraggedImageIndex(null);

    toast({
      title: 'Imagen reordenada',
      description: 'Las imágenes se han reordenado correctamente',
      status: 'success',
      duration: 1000,
      isClosable: true,
    });
  };

  const handleDragEnd = () => {
    setDraggedImageIndex(null);
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
    
    // Cerrar el modal después de guardar
    if (onClose) {
      onClose();
    }
    
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

  const handleAddTag = () => {
    if (newTag.trim()) {
      // Separar por comas y procesar cada etiqueta
      const tagsArray = newTag.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');
      
      // Agregar etiquetas no duplicadas
      const currentTags = product.tags || [];
      const newTags = tagsArray.filter(tag => !currentTags.includes(tag));
      
      if (newTags.length > 0) {
        setProduct({
          ...product,
          tags: [...currentTags, ...newTags]
        });
      }
      setNewTag('');
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
              step="1"
              value={product.price}
              onChange={handleChange}
              placeholder="29"
            />
          </InputGroup>
        </FormControl>
        
        <FormControl isRequired>
          <FormLabel>Imágenes del Producto</FormLabel>
          <FormHelperText mb={2}>
            La primera imagen será la principal. Puedes subir imágenes directamente o usar URLs.
          </FormHelperText>
          <Box p={3} mb={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text fontWeight="600" color="blue.800" fontSize="sm">
              <strong>Tip:</strong> Arrastra las imágenes para reordenarlas o usa los botones de flecha. La imagen en la posición #1 será la principal.
            </Text>
          </Box>
          
          <VStack spacing={3} align="stretch">
            {(product.images || ['']).map((imageUrl, index) => (
              <Box
                key={index}
                borderRadius="md"
                p={2}
                borderWidth="2px"
                borderColor={draggedImageIndex === index ? "purple.500" : (index === 0 ? "purple.300" : "gray.200")}
                bg={draggedImageIndex === index ? "purple.100" : (index === 0 ? "purple.50" : "transparent")}
                mb={2}
                transition="all 0.2s"
                _hover={{ bg: 'gray.50', borderColor: 'purple.200' }}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                cursor="move"
                opacity={draggedImageIndex === index ? 0.6 : 1}
              >
                <HStack spacing={2} mb={2}>
                  {/* Ícono de arrastre */}
                  <Tooltip label="Arrastra para reordenar" placement="top">
                    <Box 
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      color="purple.500"
                      fontSize="lg"
                    >
                      <FaGripVertical />
                    </Box>
                  </Tooltip>

                  {/* Indicador de posición editable */}
                  <Tooltip label="Escribí el número de posición y presioná Enter" placement="top">
                    <Input
                      size="sm"
                      w="50px"
                      textAlign="center"
                      fontWeight="bold"
                      bg={index === 0 ? "purple.200" : "gray.200"}
                      borderRadius="md"
                      value={index + 1}
                      type="number"
                      min={1}
                      max={(product.images || ['']).length}
                      readOnly
                      cursor="default"
                      pointerEvents="none"
                    />
                  </Tooltip>
                  
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
                      const fileInput = document.createElement('input');
                      fileInput.type = 'file';
                      fileInput.accept = 'image/*';
                      fileInput.multiple = true;
                      
                      fileInput.onchange = (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleImageUpload(index, e.target.files);
                        }
                      };
                      
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
                      src={imagePreviews[imageUrl] || imageUrl} 
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
                          e.target.src = 'https://via.placeholder.com/150?text=Imagen+no+disponible';
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
          
          <Text mt={2} fontSize="sm" color="gray.600" fontWeight="500">
            * Las imágenes se convierten automáticamente a formato base64 y se guardan en los datos del producto.
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
          {product.category && !selectedCategory && (
            <FormHelperText color="red.500">
              Hay un problema con la categoría seleccionada. Por favor, vuelve a seleccionarla.
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

        <FormControl>
          <FormLabel>Etiquetas (para búsqueda)</FormLabel>
          <FormHelperText mb={2}>
            Las etiquetas ayudan a encontrar el producto cuando los usuarios buscan términos específicos. No se muestran visualmente en la tienda.
            Separa las etiquetas con comas.
          </FormHelperText>
          
          <HStack mb={2}>
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Etiquetas separadas por comas..."
            />
            <Button 
              onClick={handleAddTag} 
              colorScheme="brand"
            >
              Agregar
            </Button>
          </HStack>
          
          <Box mt={2}>
            <Wrap spacing={2}>
              {(!product.tags || product.tags.length === 0) ? (
                <Text fontSize="sm" color="gray.500">No hay etiquetas agregadas</Text>
              ) : (
                product.tags.map((tag, index) => (
                  <Tag key={index} size="md" colorScheme="blue" borderRadius="full">
                    <TagLabel>{tag}</TagLabel>
                    <TagCloseButton 
                      onClick={() => {
                        setProduct({
                          ...product,
                          tags: product.tags.filter((_, i) => i !== index)
                        });
                      }} 
                    />
                  </Tag>
                ))
              )}
            </Wrap>
          </Box>
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

        <FormControl display="flex" alignItems="center" mt={4}>
          <FormLabel htmlFor="inStock" mb="0">
            ¿Hay stock disponible?
          </FormLabel>
          <Switch
            id="inStock"
            name="inStock"
            isChecked={product.inStock !== false}
            onChange={handleChange}
            colorScheme="green"
          />
        </FormControl>
        
        <FormControl display="flex" alignItems="center" mt={4}>
          <FormLabel htmlFor="adultContent" mb="0" fontWeight="bold" color="red.600">
            ¿Es contenido para adultos (+18)?
          </FormLabel>
          <Switch
            id="adultContent"
            name="adultContent"
            isChecked={product.adultContent === true}
            onChange={handleChange}
            colorScheme="red"
            size="lg"
          />
        </FormControl>
        
        {product.adultContent && (
          <Box mt={2} p={3} bg="red.50" borderRadius="md" borderWidth="1px" borderColor="red.200">
            <Text color="red.700">
              <strong>Importante:</strong> Este producto se marcará como contenido para adultos. 
              Las imágenes aparecerán borrosas y se requerirá verificación de edad para verlas.
            </Text>
          </Box>
        )}
        
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
