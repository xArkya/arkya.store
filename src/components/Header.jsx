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
  Heading
} from '@chakra-ui/react';
import {
  HamburgerIcon,
  CloseIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';
import { FaInstagram, FaShoppingBag } from 'react-icons/fa';
import { Link as RouterLink } from 'react-router-dom';
import CartButton from './Cart/CartButton';

export default function Header() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box>
      <Flex
        color={useColorModeValue('white', 'white')}
        minH={'60px'}
        py={{ base: 2 }}
        px={{ base: 4 }}
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
          <RouterLink to="/">
            <Flex align="center">
              <Box mr={2}>
                <Text fontSize="2xl" fontWeight="bold" color="pink.300" fontFamily="cursive">
                  A
                </Text>
              </Box>
              <Heading
                textAlign={useBreakpointValue({ base: 'center', md: 'left' })}
                fontFamily={'heading'}
                color={useColorModeValue('white', 'white')}
                fontSize="xl">
                Arkya Store
              </Heading>
            </Flex>
          </RouterLink>

          <Flex display={{ base: 'none', md: 'flex' }} ml={10}>
            <DesktopNav />
          </Flex>
        </Flex>

        <Stack
          flex={{ base: 1, md: 0 }}
          justify={'flex-end'}
          direction={'row'}
          spacing={6}
          align="center">
          <CartButton />
          <Button
            as={'a'}
            fontSize={'sm'}
            fontWeight={400}
            variant={'ghost'}
            color={'white'}
            href={'https://instagram.com/arkya.store'}
            target="_blank"
            leftIcon={<FaInstagram />}>
            Instagram
          </Button>
          <Button
            as={RouterLink}
            to="/"
            display={{ base: 'none', md: 'inline-flex' }}
            fontSize={'sm'}
            fontWeight={600}
            color={'gray.800'}
            bg={'gray.100'}
            _hover={{
              bg: 'gray.200',
            }}>
            Productos
          </Button>
        </Stack>
      </Flex>

      <Collapse in={isOpen} animateOpacity>
        <MobileNav />
      </Collapse>
    </Box>
  );
}

const DesktopNav = () => {
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
                }}>
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

const MobileNav = () => {
  return (
    <Stack
      bg={useColorModeValue('white', 'gray.800')}
      p={4}
      display={{ md: 'none' }}>
      {NAV_ITEMS.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }) => {
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
        }}>
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
    label: 'Categorías',
    children: [
      {
        label: 'Artbooks',
        subLabel: 'Colecciones de ilustraciones',
        href: '/?category=artbooks',
      },
      {
        label: 'Figuras',
        subLabel: 'Figuras coleccionables',
        href: '/?category=figuras',
      },
      {
        label: 'Mangas',
        subLabel: 'Mangas y cómics japoneses',
        href: '/?category=mangas',
        children: [
          {
            label: 'Todos',
            href: '/?category=mangas',
          },
          {
            label: 'Ediciones Especiales',
            href: '/?category=mangas&subcategory=ediciones-especiales',
          }
        ],
      },
      {
        label: 'Revistas',
        subLabel: 'Publicaciones periódicas',
        href: '/?category=revistas',
      },
      {
        label: 'Guide Books',
        subLabel: 'Guías oficiales',
        href: '/?category=guide-books',
      },
      {
        label: 'Character Books',
        subLabel: 'Libros de personajes',
        href: '/?category=character-books',
      },
      {
        label: 'Novelas',
        subLabel: 'Light novels y novelas',
        href: '/?category=novelas',
      },
      {
        label: 'Peluches',
        subLabel: 'Peluches de personajes',
        href: '/?category=peluches',
      },
    ],
  },
  {
    label: 'Contacto',
    href: '/contacto',
  },
];
