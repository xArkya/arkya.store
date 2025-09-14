import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  VStack,
  HStack,
  Switch,
  useToast,
  Text,
  Input,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';

const ProductOfferManager = ({ product, onUpdateProduct }) => {
  const [offerData, setOfferData] = useState({
    isOnOffer: product.isOnOffer || false,
    discountPercentage: product.discountPercentage || 0,
    originalPrice: product.originalPrice || product.price,
    startDate: product.offerStartDate || '',
    endDate: product.offerEndDate || '',
  });

  const toast = useToast();

  const handleInputChange = (field, value) => {
    setOfferData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateDiscountedPrice = () => {
    if (offerData.discountPercentage > 0) {
      const originalPrice = offerData.originalPrice || product.price;
      const discountAmount = (originalPrice * offerData.discountPercentage) / 100;
      return originalPrice - discountAmount;
    }
    return product.price;
  };

  const handleSaveOffer = () => {
    if (offerData.isOnOffer && offerData.discountPercentage <= 0) {
      toast({
        title: 'Error',
        description: 'El porcentaje de descuento debe ser mayor a 0',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (offerData.isOnOffer && offerData.discountPercentage >= 100) {
      toast({
        title: 'Error',
        description: 'El porcentaje de descuento debe ser menor a 100',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const updatedProduct = {
      ...product,
      isOnOffer: offerData.isOnOffer,
      discountPercentage: offerData.isOnOffer ? offerData.discountPercentage : 0,
      originalPrice: offerData.isOnOffer ? (offerData.originalPrice || product.price) : undefined,
      price: offerData.isOnOffer ? calculateDiscountedPrice() : (offerData.originalPrice || product.price),
      offerStartDate: offerData.startDate,
      offerEndDate: offerData.endDate,
    };

    onUpdateProduct(updatedProduct);

    toast({
      title: offerData.isOnOffer ? 'Oferta aplicada' : 'Oferta removida',
      description: offerData.isOnOffer 
        ? `Se aplicó un descuento del ${offerData.discountPercentage}% al producto`
        : 'Se removió la oferta del producto',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleRemoveOffer = () => {
    const updatedProduct = {
      ...product,
      isOnOffer: false,
      discountPercentage: 0,
      price: offerData.originalPrice || product.price,
      originalPrice: undefined,
      offerStartDate: undefined,
      offerEndDate: undefined,
    };

    setOfferData({
      isOnOffer: false,
      discountPercentage: 0,
      originalPrice: product.price,
      startDate: '',
      endDate: '',
    });

    onUpdateProduct(updatedProduct);

    toast({
      title: 'Oferta removida',
      description: 'Se removió la oferta del producto',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
      <VStack spacing={4} align="stretch">
        <Text fontWeight="bold" fontSize="lg">
          Gestionar Oferta - {product.name}
        </Text>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">Producto en Oferta</FormLabel>
          <Switch
            isChecked={offerData.isOnOffer}
            onChange={(e) => handleInputChange('isOnOffer', e.target.checked)}
            colorScheme="red"
          />
        </FormControl>

        {offerData.isOnOffer && (
          <>
            <FormControl>
              <FormLabel>Precio Original ($)</FormLabel>
              <NumberInput
                value={offerData.originalPrice}
                onChange={(valueString, valueNumber) => handleInputChange('originalPrice', valueNumber || 0)}
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

            <FormControl>
              <FormLabel>Porcentaje de Descuento (%)</FormLabel>
              <NumberInput
                value={offerData.discountPercentage}
                onChange={(valueString, valueNumber) => handleInputChange('discountPercentage', valueNumber || 0)}
                min={1}
                max={99}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Box>
                <Text fontWeight="bold">
                  Precio con descuento: ${calculateDiscountedPrice().toFixed(2)}
                </Text>
                <Text fontSize="sm">
                  Ahorro: ${(offerData.originalPrice - calculateDiscountedPrice()).toFixed(2)}
                </Text>
              </Box>
            </Alert>

            <HStack spacing={4}>
              <FormControl>
                <FormLabel>Fecha de Inicio</FormLabel>
                <Input
                  type="datetime-local"
                  value={offerData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Fecha de Fin</FormLabel>
                <Input
                  type="datetime-local"
                  value={offerData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                />
              </FormControl>
            </HStack>
          </>
        )}

        <HStack spacing={3}>
          <Button 
            colorScheme="green" 
            onClick={handleSaveOffer}
            flex={1}
          >
            {offerData.isOnOffer ? 'Aplicar Oferta' : 'Guardar Cambios'}
          </Button>
          
          {product.isOnOffer && (
            <Button 
              colorScheme="red" 
              variant="outline"
              onClick={handleRemoveOffer}
              flex={1}
            >
              Remover Oferta
            </Button>
          )}
        </HStack>
      </VStack>
    </Box>
  );
};

export default ProductOfferManager;
