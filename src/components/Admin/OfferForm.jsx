import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  VStack,
  HStack,
  Switch,
  useToast,
} from '@chakra-ui/react';

const OfferForm = ({ onSaveOffer, initialValues = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountPercentage: 0,
    discountAmount: 0,
    discountType: 'percentage', // 'percentage' or 'amount'
    startDate: '',
    endDate: '',
    isActive: true,
    minPurchaseAmount: 0,
    maxUses: 0,
    currentUses: 0,
    code: '',
    applicableProducts: [], // IDs de productos aplicables
    applicableCategories: [], // Categorías aplicables
    isGlobal: false, // Si aplica a toda la tienda
    offerType: 'promocional', // 'promocional' (con código) o 'descuento' (sin código)
  });

  const toast = useToast();

  useEffect(() => {
    if (initialValues) {
      setFormData(initialValues);
    }
  }, [initialValues]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es requerido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Solo validar código si es una oferta promocional
    if (formData.offerType === 'promocional' && !formData.code.trim()) {
      toast({
        title: 'Error',
        description: 'El código de la oferta es requerido para ofertas promocionales',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.discountType === 'percentage' && (formData.discountPercentage <= 0 || formData.discountPercentage > 100)) {
      toast({
        title: 'Error',
        description: 'El porcentaje de descuento debe estar entre 1 y 100',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.discountType === 'amount' && formData.discountAmount <= 0) {
      toast({
        title: 'Error',
        description: 'El monto de descuento debe ser mayor a 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Generar ID si es una nueva oferta
    const offerData = {
      ...formData,
      id: initialValues?.id || Date.now().toString(),
      createdAt: initialValues?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveOffer(offerData);

    // Limpiar formulario si es nueva oferta
    if (!initialValues) {
      setFormData({
        title: '',
        description: '',
        discountPercentage: 0,
        discountAmount: 0,
        discountType: 'percentage',
        startDate: '',
        endDate: '',
        isActive: true,
        minPurchaseAmount: 0,
        maxUses: 0,
        currentUses: 0,
        code: '',
        applicableProducts: [],
        applicableCategories: [],
        isGlobal: false,
      });
    }
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleInputChange('code', result);
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Título de la Oferta</FormLabel>
          <Input
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ej: Descuento de Verano"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Descripción</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe los detalles de la oferta..."
            rows={3}
          />
        </FormControl>

        <FormControl mb={4}>
          <FormLabel>Tipo de Oferta</FormLabel>
          <Select
            value={formData.offerType}
            onChange={(e) => handleInputChange('offerType', e.target.value)}
          >
            <option value="promocional">Promocional (con código)</option>
            <option value="descuento">Descuento (sin código)</option>
          </Select>
        </FormControl>

        {formData.offerType === 'promocional' && (
          <HStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Código de la Oferta</FormLabel>
              <HStack>
                <Input
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                  placeholder="DESCUENTO2025"
                />
                <Button onClick={generateCode} size="sm">
                  Generar
                </Button>
              </HStack>
            </FormControl>
          </HStack>
        )}

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Tipo de Descuento</FormLabel>
            <Select
              value={formData.discountType}
              onChange={(e) => handleInputChange('discountType', e.target.value)}
            >
              <option value="percentage">Porcentaje</option>
              <option value="amount">Monto Fijo</option>
            </Select>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          {formData.discountType === 'percentage' ? (
            <FormControl isRequired>
              <FormLabel>Porcentaje de Descuento (%)</FormLabel>
              <NumberInput
                value={formData.discountPercentage}
                onChange={(valueString, valueNumber) => handleInputChange('discountPercentage', valueNumber || 0)}
                min={1}
                max={100}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          ) : (
            <FormControl isRequired>
              <FormLabel>Monto de Descuento ($)</FormLabel>
              <NumberInput
                value={formData.discountAmount}
                onChange={(valueString, valueNumber) => handleInputChange('discountAmount', valueNumber || 0)}
                min={0}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>
          )}

          <FormControl>
            <FormLabel>Compra Mínima ($)</FormLabel>
            <NumberInput
              value={formData.minPurchaseAmount}
              onChange={(valueString, valueNumber) => handleInputChange('minPurchaseAmount', valueNumber || 0)}
              min={0}
              precision={2}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Fecha de Inicio</FormLabel>
            <Input
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Fecha de Fin</FormLabel>
            <Input
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
            />
          </FormControl>
        </HStack>

        <HStack spacing={4}>
          <FormControl>
            <FormLabel>Máximo de Usos</FormLabel>
            <NumberInput
              value={formData.maxUses}
              onChange={(valueString, valueNumber) => handleInputChange('maxUses', valueNumber || 0)}
              min={0}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </FormControl>

          <FormControl>
            <FormLabel>Usos Actuales</FormLabel>
            <NumberInput
              value={formData.currentUses}
              onChange={(valueString, valueNumber) => handleInputChange('currentUses', valueNumber || 0)}
              min={0}
              isReadOnly={!initialValues}
            >
              <NumberInputField />
            </NumberInput>
          </FormControl>
        </HStack>

        <HStack spacing={8}>
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Oferta Activa</FormLabel>
            <Switch
              isChecked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              colorScheme="brand"
            />
          </FormControl>

          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Aplicar a Toda la Tienda</FormLabel>
            <Switch
              isChecked={formData.isGlobal}
              onChange={(e) => handleInputChange('isGlobal', e.target.checked)}
              colorScheme="brand"
            />
          </FormControl>
        </HStack>

        {!formData.isGlobal && (
          <FormControl>
            <FormLabel>Aplicar a Categorías</FormLabel>
            <Select
              placeholder="Selecciona una categoría"
              onChange={(e) => {
                const categoryName = e.target.value;
                if (categoryName && !formData.applicableCategories.includes(categoryName)) {
                  handleInputChange('applicableCategories', [...formData.applicableCategories, categoryName]);
                }
              }}
            >
              <option value="Artbooks">Artbooks</option>
              <option value="Figuras">Figuras</option>
              <option value="Mangas">Mangas</option>
              <option value="Revistas">Revistas</option>
              <option value="Guide Books">Guide Books</option>
              <option value="Character Books">Character Books</option>
              <option value="Novelas">Novelas</option>
              <option value="Peluches">Peluches</option>
            </Select>
            
            {formData.applicableCategories.length > 0 && (
              <Box mt={2}>
                <FormLabel>Categorías seleccionadas:</FormLabel>
                {formData.applicableCategories.map((category, index) => (
                  <Button 
                    key={index} 
                    size="sm" 
                    colorScheme="purple" 
                    variant="outline" 
                    mr={2} 
                    mb={2}
                    rightIcon={<span>×</span>}
                    onClick={() => {
                      handleInputChange('applicableCategories', 
                        formData.applicableCategories.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </Box>
            )}
          </FormControl>
        )}

        <Button type="submit" colorScheme="brand" size="lg">
          {initialValues ? 'Actualizar Oferta' : 'Crear Oferta'}
        </Button>
      </VStack>
    </Box>
  );
};

export default OfferForm;
