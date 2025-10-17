import React, { useState, useEffect } from 'react';
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Switch,
  Textarea,
  HStack,
  useToast,
} from '@chakra-ui/react';

const CouponForm = ({ coupon, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: 10,
    description: '',
    isActive: true,
    minPurchase: 0,
    expiryDate: '',
    usageLimit: null,
    usedCount: 0,
  });
  
  const toast = useToast();

  useEffect(() => {
    if (coupon) {
      setFormData(coupon);
    }
  }, [coupon]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.code.trim()) {
      toast({
        title: 'Error',
        description: 'El código del cupón es requerido',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
      toast({
        title: 'Error',
        description: 'El porcentaje de descuento debe estar entre 1 y 100',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!formData.expiryDate) {
      toast({
        title: 'Error',
        description: 'La fecha de expiración es requerida',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onSave(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        <FormControl isRequired>
          <FormLabel>Código del Cupón</FormLabel>
          <Input
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
            placeholder="Ej: VERANO2025"
            maxLength={20}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Porcentaje de Descuento (%)</FormLabel>
          <NumberInput
            value={formData.discountPercentage}
            onChange={(_, value) => handleChange('discountPercentage', value)}
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

        <FormControl>
          <FormLabel>Descripción</FormLabel>
          <Textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descripción del cupón"
            rows={3}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Compra Mínima ($)</FormLabel>
          <NumberInput
            value={formData.minPurchase}
            onChange={(_, value) => handleChange('minPurchase', value)}
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Fecha de Expiración</FormLabel>
          <Input
            type="date"
            value={formData.expiryDate}
            onChange={(e) => handleChange('expiryDate', e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel>Límite de Usos (dejar en 0 para ilimitado)</FormLabel>
          <NumberInput
            value={formData.usageLimit || 0}
            onChange={(_, value) => handleChange('usageLimit', value === 0 ? null : value)}
            min={0}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Cupón Activo</FormLabel>
          <Switch
            isChecked={formData.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
            colorScheme="brand"
          />
        </FormControl>

        <HStack spacing={4} pt={4}>
          <Button type="submit" colorScheme="brand" flex={1}>
            {coupon ? 'Actualizar Cupón' : 'Crear Cupón'}
          </Button>
          <Button onClick={onCancel} variant="ghost">
            Cancelar
          </Button>
        </HStack>
      </VStack>
    </form>
  );
};

export default CouponForm;
