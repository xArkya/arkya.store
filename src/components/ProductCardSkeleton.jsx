import { Box, Skeleton, SkeletonText, VStack, Flex } from '@chakra-ui/react';

export default function ProductCardSkeleton() {
  return (
    <Box
      w="100%"
      h="100%"
      borderRadius="lg"
      overflow="hidden"
      bg="whiteAlpha.100"
      boxShadow="md"
    >
      <Skeleton height="220px" width="100%" />
      <VStack p={4} align="start" spacing={3}>
        <Skeleton height="18px" width="60px" borderRadius="md" />
        <Skeleton height="24px" width="90%" borderRadius="md" />
        <SkeletonText noOfLines={2} spacing={2} skeletonHeight="14px" width="95%" />
        <Flex w="100%" justify="space-between" align="center" mt={2}>
          <Skeleton height="28px" width="80px" borderRadius="md" />
          <Skeleton height="32px" width="90px" borderRadius="md" />
        </Flex>
      </VStack>
    </Box>
  );
}
