import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  IconButton,
  Button,
  Stack,
  Collapse,
  Icon,
  Link,
  Popover,
  PopoverTrigger,
  PopoverContent,
  useColorModeValue,
  useBreakpointValue,
  useDisclosure,
  Container,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Image
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { FaInstagram, FaShoppingBag, FaGamepad, FaBookOpen, FaSearch } from 'react-icons/fa';
import { products } from '../data/products';

function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function getProductSlug(product) {
  const base = slugify(product.name);
  const suffix = String(product.id).slice(-4);
  return `${base}-${suffix}`;
}

export default function Header() {
  const { isOpen, onToggle } = useDisclosure();
  const [searchValue, setSearchValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce para búsqueda en tiempo real (100ms para ser más responsive)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 100);
    return () => clearTimeout(timeout);
  }, [searchValue]);

  // Navegar automáticamente al escribir (solo cuando estamos en home)
  const prevDebouncedRef = useRef('');
  useEffect(() => {
    const isHome = location.pathname === '/';
    if (!isHome) return;
    const hasText = debouncedValue.trim().length >= 1;
    const hadText = prevDebouncedRef.current.trim().length >= 1;
    if (hasText) {
      navigate(`/?headerSearch=${encodeURIComponent(debouncedValue.trim())}`);
    } else if (!hasText && hadText) {
      navigate('/');
    }
    prevDebouncedRef.current = debouncedValue;
  }, [debouncedValue, navigate, location.pathname]);

  // Filtrar sugerencias de productos
  const suggestions = useMemo(() => {
    if (!debouncedValue.trim() || debouncedValue.trim().length < 1) return [];
    const term = debouncedValue.toLowerCase();
    const filtered = products
      .filter(p => {
        const nameMatch = p.name.toLowerCase().includes(term);
        const tagMatch = p.tags && p.tags.some(t => t.toLowerCase().includes(term));
        const descMatch = p.description && p.description.toLowerCase().includes(term);
        return nameMatch || tagMatch || descMatch;
      })
      .slice(0, 6);
    return filtered.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      price: p.price,
      slug: getProductSlug(p),
    }));
  }, [debouncedValue]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        navigate(`/product/${suggestions[selectedIndex].slug}`);
        setSearchValue('');
        setShowSuggestions(false);
        setSelectedIndex(-1);
      } else if (searchValue.trim()) {
        navigate(`/?headerSearch=${encodeURIComponent(searchValue.trim())}`);
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    navigate(`/product/${suggestion.slug}`);
    setSearchValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleSeeAllResults = () => {
    if (searchValue.trim()) {
      navigate(`/?headerSearch=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
      setShowSuggestions(false);
    }
  };

  return (
    <Box ref={searchRef}>
      <Flex
        bg={useColorModeValue('#241521', '#241521')}
        color={useColorModeValue('white', 'white')}
        minH={{ base: '50px', md: '60px' }}
        py={{ base: 1, md: 2 }}
        px={{ base: 2, md: 4 }}
        borderBottom={1}
        borderStyle={'solid'}
        borderColor={useColorModeValue('#342730', 'gray.900')}
        align={'center'}
        position="sticky"
        top="0"
        zIndex="sticky"
        boxShadow="md">
        <Flex
          flex={{ base: 1, md: 'auto' }}
          ml={{ base: -2 }}
          display={{ base: 'flex', md: 'none' }}>
          <IconButton
            onClick={onToggle}
            icon={
              isOpen ? <CloseIcon w={3} h={3} /> : <HamburgerIcon w={5} h={5} />
            }
            variant={'ghost'}
            aria-label={'Toggle Navigation'}
          />
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: 'center', md: 'start' }} align="center">
          <RouterLink to="/" onClick={() => { setSearchValue(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <Flex align="center">
              <Box mr={{ base: 1, md: 2 }}>
                <img
                  src="/images/logo2.webp"
                  alt="Arkya Store Logo"
                  width={useBreakpointValue({ base: 24, md: 30 })}
                  height={useBreakpointValue({ base: 24, md: 30 })}
                />
              </Box>
              <Heading
                textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                fontFamily={'heading'}
                color={useColorModeValue('white', 'white')}
                fontSize={{ base: 'md', md: 'xl' }}>
                Arkya Store
              </Heading>
            </Flex>
          </RouterLink>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav onHomeClick={() => { setSearchValue(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
          </Flex>
        </Flex>

        {/* Buscador en desktop */}
        <Box
          display={{ base: 'none', md: 'block' }}
          mx={4}
          flex="1"
          maxW="500px"
          position="relative"
        >
          <InputGroup size="md">
            <InputLeftElement pointerEvents="none" h="100%">
              <Icon as={FaSearch} color="whiteAlpha.500" boxSize={4} />
            </InputLeftElement>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Buscar productos..."
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setSelectedIndex(-1);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowSuggestions(false);
                  setSelectedIndex(-1);
                }, 200);
              }}
              onKeyDown={handleKeyDown}
              bg="pink.900"
              color="white"
              borderColor="pink.400"
              _placeholder={{ color: 'pink.200' }}
              _hover={{ borderColor: 'pink.300', bg: 'pink.800' }}
              _focus={{ borderColor: 'pink.200', boxShadow: '0 0 0 2px rgba(236, 72, 153, 0.6)' }}
              borderRadius="full"
              pl={10}
              h="35px"
              fontSize="md"
            />
            {searchValue && (
              <InputRightElement h="100%">
                <IconButton
                  icon={<CloseIcon boxSize={3} />}
                  size="sm"
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  aria-label="Limpiar"
                  onClick={() => {
                    setSearchValue('');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  mr={1}
                />
              </InputRightElement>
            )}
          </InputGroup>

          {/* Dropdown de sugerencias desktop */}
          {showSuggestions && suggestions.length > 0 && (
            <Box
              position="absolute"
              top="calc(100% + 8px)"
              left={0}
              right={0}
              bg="#241521"
              borderRadius="xl"
              boxShadow="0 8px 32px rgba(0,0,0,0.5)"
              border="1px solid"
              borderColor="whiteAlpha.200"
              zIndex={2000}
              overflow="hidden"
            >
              {suggestions.map((s, i) => (
                <Flex
                  key={s.id}
                  px={4}
                  py={2}
                  align="center"
                  gap={3}
                  cursor="pointer"
                  bg={selectedIndex === i ? 'whiteAlpha.100' : 'transparent'}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  onClick={() => handleSuggestionClick(s)}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.100"
                >
                  <Image
                    src={s.image}
                    alt={s.name}
                    boxSize="40px"
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc="/images/logo2.webp"
                  />
                  <Box flex="1" minW={0}>
                    <Text fontSize="sm" color="white" fontWeight="medium" noOfLines={1}>
                      {s.name}
                    </Text>
                    <Text fontSize="xs" color="pink.300">
                      ${s.price?.toLocaleString('es-AR', { maximumFractionDigits: 0 }) || '0'}
                    </Text>
                  </Box>
                </Flex>
              ))}
              <Box
                px={4}
                py={2}
                cursor="pointer"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={handleSeeAllResults}
                borderTop="1px solid"
                borderColor="whiteAlpha.200"
                textAlign="center"
              >
                <Text fontSize="sm" color="pink.300" fontWeight="medium">
                  Ver todos los resultados
                </Text>
              </Box>
            </Box>
          )}
        </Box>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={{ base: 1, md: 6 }}
          align="center">
          <Button
            as={RouterLink}
            to="/adivina-el-anime"
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={700}
            colorScheme="pink"
            size={{ base: 'sm', md: 'md' }}
            px={{ base: 0, md: 4 }}
            py={{ base: 0, md: 2 }}
            w={{ base: '44px', sm: 'auto' }}
            h={{ base: '44px', sm: 'auto' }}
            borderRadius="full"
            bg="pink.500"
            color="white"
            boxShadow="0 0 20px rgba(236, 72, 153, 0.7)"
            _hover={{ transform: 'translateY(-1px)', boxShadow: '0 0 30px rgba(236, 72, 153, 1)', bg: 'pink.400' }}
            position="relative"
            overflow="visible"
          >
            <FaGamepad size={22} />
            <Text display={{ base: 'none', md: 'inline' }} ml={2}>
              GANÁ DESCUENTOS
            </Text>
            <Box
              display={{ base: 'block', md: 'none' }}
              position="absolute"
              bottom="-8px"
              left="50%"
              transform="translateX(-50%)"
              bg="pink.400"
              color="white"
              fontSize="10px"
              fontWeight="bold"
              px={2}
              py="2px"
              borderRadius="full"
              lineHeight="1"
              boxShadow="0 0 10px rgba(236, 72, 153, 0.8)"
            >
              JUGAR
            </Box>
          </Button>

          <Button
            as={'a'}
            fontSize={{ base: 'xs', md: 'sm' }}
            fontWeight={400}
            variant={'ghost'}
            color={'white'}
            href={'https://instagram.com/arkya.store'}
            target="_blank"
            rel="noopener noreferrer"
            size={{ base: 'sm', md: 'md' }}
            px={{ base: 1, md: 4 }}>
            <FaInstagram size={16} />
            <Text display={{ base: 'none', md: 'inline' }} ml={2}>Instagram</Text>
          </Button>

        </Stack>
      </Flex>

      {/* Buscador en mobile */}
      <Box display={{ md: 'none' }} px={2} pb={2} bg="#241521" position="relative">
        <InputGroup size="md">
          <InputLeftElement pointerEvents="none" h="100%">
            <Icon as={FaSearch} color="whiteAlpha.500" boxSize={4} />
          </InputLeftElement>
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setSelectedIndex(-1);
              setShowSuggestions(true);
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }, 200);
            }}
            onKeyDown={handleKeyDown}
            bg="whiteAlpha.100"
            color="white"
            borderColor="whiteAlpha.300"
            _placeholder={{ color: 'whiteAlpha.500' }}
            _hover={{ borderColor: 'whiteAlpha.400' }}
            _focus={{ borderColor: 'pink.400', boxShadow: '0 0 0 2px rgba(236, 72, 153, 0.4)' }}
            borderRadius="md"
            pl={10}
            h="44px"
            fontSize="md"
          />
          {searchValue && (
            <InputRightElement h="100%">
              <IconButton
                icon={<CloseIcon boxSize={3} />}
                size="sm"
                variant="ghost"
                colorScheme="whiteAlpha"
                aria-label="Limpiar"
                onClick={() => {
                  setSearchValue('');
                  setShowSuggestions(false);
                }}
                mr={1}
              />
            </InputRightElement>
          )}
        </InputGroup>

        {/* Dropdown de sugerencias mobile */}
        {showSuggestions && suggestions.length > 0 && (
          <Box
            position="absolute"
            top="calc(100% + 4px)"
            left={2}
            right={2}
            bg="#241521"
            borderRadius="xl"
            boxShadow="0 8px 32px rgba(0,0,0,0.5)"
            border="1px solid"
            borderColor="whiteAlpha.200"
            zIndex={2000}
            overflow="hidden"
          >
            {suggestions.map((s, i) => (
              <Flex
                key={s.id}
                px={4}
                py={3}
                align="center"
                gap={3}
                cursor="pointer"
                bg={selectedIndex === i ? 'whiteAlpha.100' : 'transparent'}
                _hover={{ bg: 'whiteAlpha.100' }}
                onMouseEnter={() => setSelectedIndex(i)}
                onClick={() => handleSuggestionClick(s)}
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
              >
                <Image
                  src={s.image}
                  alt={s.name}
                  boxSize="48px"
                  objectFit="cover"
                  borderRadius="md"
                  fallbackSrc="/images/logo2.webp"
                />
                <Box flex="1" minW={0}>
                  <Text fontSize="sm" color="white" fontWeight="medium" noOfLines={1}>
                    {s.name}
                  </Text>
                  <Text fontSize="xs" color="pink.300">
                    ${s.price?.toLocaleString('es-AR', { maximumFractionDigits: 0 }) || '0'}
                  </Text>
                </Box>
              </Flex>
            ))}
            <Box
              px={4}
              py={3}
              cursor="pointer"
              _hover={{ bg: 'whiteAlpha.100' }}
              onClick={handleSeeAllResults}
              borderTop="1px solid"
              borderColor="whiteAlpha.200"
              textAlign="center"
            >
              <Text fontSize="sm" color="pink.300" fontWeight="medium">
                Ver todos los resultados
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav onHomeClick={() => { setSearchValue(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      </Collapse>
    </Box>
  );
}

const DesktopNav = ({ onHomeClick }) => {
  const linkColor = useColorModeValue('white', 'gray.200');
  const linkHoverColor = useColorModeValue('pink.300', 'white');
  const popoverContentBgColor = useColorModeValue('white', 'gray.800');

  return (
    <Stack direction={'row'} spacing={4}>
      {NAV_ITEMS.map((navItem) => (
        <Box key={navItem.label}>
          <Popover trigger={'hover'} placement={'bottom-start'}>
            <PopoverTrigger>
              <Link
                as={RouterLink}
                p={2}
                to={navItem.href ?? '#'}
                fontSize={'sm'}
                fontWeight={500}
                color={linkColor}
                _hover={{
                  textDecoration: 'none',
                  color: linkHoverColor,
                }}
                onClick={navItem.label === 'Inicio' ? onHomeClick : undefined}>
                {navItem.label}
              </Link>
            </PopoverTrigger>

            {navItem.children && (
              <PopoverContent
                border={0}
                boxShadow={'xl'}
                bg={popoverContentBgColor}
                p={4}
                rounded={'xl'}
                minW={'sm'}>
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </PopoverContent>
            )}
          </Popover>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ label, href, subLabel, children }) => {
  // Definir los valores de color fuera de las condiciones para evitar errores de lint
  const hoverBgColor = useColorModeValue('brand.50', 'gray.900');
  const popoverBgColor = useColorModeValue('white', 'gray.800');
  const childHoverBgColor = useColorModeValue('pink.50', 'gray.900');
  
  // Si tiene subcategorías, mostrar un popover anidado
  if (children) {
    return (
      <Popover trigger={'hover'} placement={'right-start'} strategy="fixed">
        <PopoverTrigger>
          <Link
            role={'group'}
            display={'block'}
            p={2}
            rounded={'md'}
            _hover={{ bg: hoverBgColor }}>
            <Stack direction={'row'} align={'center'}>
              <Box>
                <Text
                  transition={'all .3s ease'}
                  _groupHover={{ color: 'brand.500' }}
                  fontWeight={500}>
                  {label}
                </Text>
                <Text fontSize={'sm'}>{subLabel}</Text>
              </Box>
              <Flex
                transition={'all .3s ease'}
                transform={'translateX(-10px)'}
                opacity={0}
                _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
                justify={'flex-end'}
                align={'center'}
                flex={1}>
                <Icon color={'brand.500'} w={5} h={5} as={ChevronRightIcon} />
              </Flex>
            </Stack>
          </Link>
        </PopoverTrigger>
        <PopoverContent
          border={0}
          boxShadow={'xl'}
          bg={popoverBgColor}
          p={4}
          rounded={'xl'}
          minW={'sm'}>
          <Stack>
            {children.map((child) => (
              <Link
                key={child.label}
                as={RouterLink}
                to={child.href}
                role={'group'}
                display={'block'}
                p={2}
                rounded={'md'}
                _hover={{ bg: childHoverBgColor }}>
                <Stack direction={'row'} align={'center'}>
                  <Box>
                    <Text
                      transition={'all .3s ease'}
                      _groupHover={{ color: 'pink.400' }}
                      fontWeight={500}>
                      {child.label}
                    </Text>
                  </Box>
                </Stack>
              </Link>
            ))}
          </Stack>
        </PopoverContent>
      </Popover>
    );
  }
  
  // Si no tiene subcategorías, mostrar un enlace normal
  return (
    <Link
      as={RouterLink}
      to={href}
      role={'group'}
      display={'block'}
      p={2}
      rounded={'md'}
      _hover={{ bg: hoverBgColor }}>
      <Stack direction={'row'} align={'center'}>
        <Box>
          <Text
            transition={'all .3s ease'}
            _groupHover={{ color: 'brand.500' }}
            fontWeight={500}>
            {label}
          </Text>
          <Text fontSize={'sm'}>{subLabel}</Text>
        </Box>
        <Flex
          transition={'all .3s ease'}
          transform={'translateX(-10px)'}
          opacity={0}
          _groupHover={{ opacity: '100%', transform: 'translateX(0)' }}
          justify={'flex-end'}
          align={'center'}
          flex={1}>
          <Icon color={'brand.500'} w={5} h={5} as={ChevronRightIcon} />
        </Flex>
      </Stack>
    </Link>
  );
};

const MobileNav = ({ onHomeClick }) => {
  return (
    <Stack
      bg="#241521"
      borderBottom="1px solid"
      borderColor="pink.400"
      p={4}
      display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} onHomeClick={onHomeClick} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href, onHomeClick }) => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Stack spacing={4} onClick={children && onToggle}>
      <Flex
        py={2}
        as={RouterLink}
        to={href ?? '#'}
        justify={'space-between'}
        align={'center'}
        _hover={{
          textDecoration: 'none',
        }}
        onClick={label === 'Inicio' ? onHomeClick : undefined}>
        <Text
          fontWeight={600}
          color={useColorModeValue('gray.600', 'gray.200')}>
          {label}
        </Text>
        {children && (
          <Icon
            as={ChevronDownIcon}
            transition={'all .25s ease-in-out'}
            transform={isOpen ? 'rotate(180deg)' : ''}
            w={6}
            h={6}
          />
        )}
      </Flex>

      <Collapse in={isOpen} animateOpacity style={{ marginTop: '0!important' }}>
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor={useColorModeValue('gray.200', 'gray.700')}
          align={'start'}>
          {children &&
            children.map((child) => (
              <Link as={RouterLink} key={child.label} py={2} to={child.href}>
                {child.label}
              </Link>
            ))}
        </Stack>
      </Collapse>
    </Stack>
  );
};

const NAV_ITEMS = [
  {
    label: 'Inicio',
    href: '/',
  },
  {
    label: 'Guías',
    href: '/guias',
  },
  {
    label: 'Preguntas Frecuentes',
    href: '/preguntas-frecuentes',
  },
  {
    label: 'Contacto',
    href: '/contacto',
  },
];
