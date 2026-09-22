import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Divider,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Skeleton,
  VStack,
  HStack,
  Button,
  ButtonGroup,
  IconButton,
  Spinner,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  List,
  ListItem,
  ListIcon,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaSearch, FaBookOpen, FaInstagram, FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck, FaCheckCircle, FaClipboard, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { SEO } from '../components/SEO';
import { useSearchParams } from 'react-router-dom';
import { JP_CATEGORY_TREE, JP_PRICE_BANDS } from '../data/jpCatalogFilters';

const CATEGORY_TABS = [
  { id: 'books', label: 'Libros' },
  { id: 'doujin', label: 'Doujin', soon: true },
];

// Base de la API del catálogo. Vacío = mismo origen (dev usa el middleware
// de Vite). En producción el sitio es estático (GitHub Pages) y las
// functions viven en un Netlify aparte, configurado con VITE_JP_API_URL.
const JP_API = (import.meta.env.VITE_JP_API_URL || '').replace(/\/$/, '');

// Modo DB: el catálogo se lee directo de Supabase (tabla `products` que
// llena scripts/jp-crawl.mjs). La anon key es pública: la tabla tiene RLS
// de solo lectura. Si no está configurado, se usa la API live como antes.
const SUPA_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const USE_DB = Boolean(SUPA_URL && SUPA_KEY);

// Mapeo categoría/subcategoría -> códigos hoja crawleados. La UI puede
// elegir un tipo de nivel 1 (p.ej. "Cómic") y el filtro cubre sus hojas.
const LEAF_CODES = {};
for (const [cat, tree] of Object.entries(JP_CATEGORY_TREE)) {
  LEAF_CODES[cat] = {};
  for (const level1 of tree) {
    LEAF_CODES[cat][level1.code] = level1.children.map((c) => c.code);
  }
}
function codesFor(cat, sub) {
  const map = LEAF_CODES[cat] || {};
  if (!sub) return Object.values(map).flat();
  return map[sub] || [sub];
}

const SORT_OPTIONS = [
  { value: 'relevant', label: 'Relevancia' },
  { value: 'released_date_desc', label: 'Más recientes' },
  { value: 'released_date_asc', label: 'Más antiguos' },
];

const YEAR_RANGES = [
  { value: '{,2010]', label: 'Hasta 2010' },
  { value: '[2011, 2012]', label: '2011 – 2012' },
  { value: '[2013, 2014]', label: '2013 – 2014' },
  { value: '[2015, 2016]', label: '2015 – 2016' },
  { value: '[2017, 2018]', label: '2017 – 2018' },
  { value: '[2019, 2020]', label: '2019 – 2020' },
  { value: '[2021, 2022]', label: '2021 – 2022' },
  { value: '[2023, 2024]', label: '2023 – 2024' },
  { value: '[2025, 2026]', label: '2025 – 2026' },
];

// Opciones de precio por banda — el value es el índice de JP_PRICE_BANDS,
// que es lo que el crawler guarda en products.price_band
const PRICE_BAND_OPTIONS = JP_PRICE_BANDS.map((b, i) => ({
  value: String(i),
  label: b.label,
}));

// Dropdown custom (los <select> nativos se ven feos en el tema oscuro)
function FilterSelect({ placeholder, value, options, groups, onChange }) {
  const flat = groups ? groups.flatMap((g) => g.items) : options;
  const current = flat.find((o) => o.value === value);

  const renderItem = (o) => (
    <MenuItem
      key={o.value}
      bg="transparent"
      pl={groups ? 5 : 3}
      fontSize="sm"
      color={value === o.value ? 'pink.300' : 'whiteAlpha.800'}
      fontWeight={value === o.value ? 600 : 400}
      _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
      onClick={() => onChange(o.value)}
    >
      {o.label}
    </MenuItem>
  );

  return (
    <Menu placement="bottom-start" autoSelect={false}>
      <MenuButton
        as={Button}
        size="sm"
        w="100%"
        rightIcon={<FaChevronDown size={9} />}
        bg="whiteAlpha.100"
        color={current ? 'white' : 'whiteAlpha.600'}
        border="1px solid"
        borderColor={current ? 'pink.400' : 'whiteAlpha.200'}
        borderRadius="lg"
        fontWeight={500}
        px={4}
        _hover={{ borderColor: 'pink.400', bg: 'whiteAlpha.200' }}
        _active={{ bg: 'whiteAlpha.200' }}
      >
        <Text as="span" noOfLines={1}>
          {current ? current.label : placeholder}
        </Text>
      </MenuButton>
      <MenuList
        bg="#2d1e2a"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="xl"
        py={1}
        minW="220px"
        maxH="300px"
        overflowY="auto"
        zIndex={1500}
        boxShadow="0 8px 30px rgba(0,0,0,0.6)"
      >
        <MenuItem
          bg="transparent"
          fontSize="sm"
          color={!value ? 'pink.300' : 'whiteAlpha.600'}
          fontWeight={!value ? 600 : 400}
          _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
          onClick={() => onChange('')}
        >
          {placeholder}
        </MenuItem>
        {groups
          ? groups.map((g) => (
              <Box key={g.label}>
                <Text
                  px={3}
                  pt={3}
                  pb={1}
                  fontSize="xs"
                  fontWeight={700}
                  color="pink.400"
                  letterSpacing="wider"
                >
                  {g.label.toUpperCase()}
                </Text>
                {g.items.map(renderItem)}
              </Box>
            ))
          : options.map(renderItem)}
      </MenuList>
    </Menu>
  );
}

const toOptions = (list) => list.map((s) => ({ value: s.code, label: s.label }));

const IG_DM_URL = 'https://ig.me/m/arkya.store';

// El código que se manda por Instagram se ofusca: se intercambia el primer
// caracter con el último, así el cliente no ve el código real del producto.
function obfuscateCode(id) {
  const s = String(id);
  if (s.length < 2) return s;
  return s[s.length - 1] + s.slice(1, -1) + s[0];
}

function buildMessage(products) {
  const list = products
    .map((p, i) => `${i + 1}. ${p.title} (cód: ${obfuscateCode(p.id)})`)
    .join('\n');
  return `Hola! Quiero consultar por ${products.length > 1 ? 'estos productos' : 'este producto'} del catálogo a pedido:\n\n${list}`;
}

export default function ImportCatalogPage() {
  // Estado inicial desde la URL: volver atrás / recargar restaura todo
  const [searchParams, setSearchParams] = useSearchParams();
  const [inputValue, setInputValue] = useState(() => searchParams.get('q') || '');
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [category, setCategory] = useState(() => searchParams.get('cat') || 'books');
  const [sub1, setSub1] = useState(() => searchParams.get('tipo') || ''); // nivel 1
  const [sub2, setSub2] = useState(() => searchParams.get('sub') || ''); // nivel 2
  const [year, setYear] = useState(() => searchParams.get('a') || '');
  const [band, setBand] = useState(() => searchParams.get('precio') || ''); // índice de JP_PRICE_BANDS
  const [sort, setSort] = useState(() => searchParams.get('orden') || 'relevant');
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('p')) || 1));
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalApprox, setTotalApprox] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ok | error
  const [selected, setSelected] = useState({}); // id -> {id, title}
  const [brokenImages, setBrokenImages] = useState({}); // ids cuyo thumb derivado no existe en el CDN
  const [consultItems, setConsultItems] = useState(null); // productos a consultar
  const [previewItem, setPreviewItem] = useState(null); // producto con imagen abierta
  const { isOpen: isConsultOpen, onOpen: onConsultOpen, onClose: onConsultClose } = useDisclosure();
  const { isOpen: isPreviewOpen, onOpen: onPreviewOpen, onClose: onPreviewClose } = useDisclosure();
  const abortRef = useRef(null);
  const resultsRef = useRef(null);
  const toast = useToast();

  // Debounce del input
  useEffect(() => {
    const t = setTimeout(() => setQuery(inputValue.trim()), 600);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Si la categoría tiene un solo tipo (Doujin → solo "Doujin magazine"),
  // el filtro TIPO muestra directamente sus subtipos y la búsqueda queda
  // acotada a ese tipo aunque no se elija nada.
  const catTree = JP_CATEGORY_TREE[category] || [];
  const singleType = catTree.length === 1 ? catTree[0] : null;
  const sub1Options = singleType ? singleType.children : catTree;
  const sub2Options = singleType
    ? []
    : sub1Options.find((s) => s.code === sub1)?.children || [];

  const sub = sub2 || sub1 || (singleType?.code ?? '');

  // Persistir estado en la URL (replace: no ensucia el historial, pero
  // recargar o volver desde otra página restaura búsqueda + página)
  useEffect(() => {
    const p = {};
    if (query) p.q = query;
    if (category !== 'books') p.cat = category;
    if (sub1) p.tipo = sub1;
    if (sub2) p.sub = sub2;
    if (year) p.a = year;
    if (band !== '') p.precio = band;
    if (sort !== 'relevant') p.orden = sort;
    if (page > 1) p.p = String(page);
    setSearchParams(p, { replace: true });
  }, [query, category, sub1, sub2, year, band, sort, page, setSearchParams]);

  // Volver a página 1 cuando cambia la búsqueda o los filtros (no al montar,
  // así no pisa la página restaurada de la URL)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setPage(1);
  }, [query, category, sub, year, band, sort]);

  // Si la categoría cambia y la subcategoría elegida no pertenece, limpiarla
  useEffect(() => {
    if (sub1 && !sub1Options.some((s) => s.code === sub1)) {
      setSub1('');
      setSub2('');
    }
  }, [category, sub1, sub1Options]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');

    const applyResults = (list, total, approx, more) => {
      setItems(list);
      setTotalCount(total);
      setTotalApprox(approx);
      setHasMore(more);
      setStatus('ok');
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    const onError = (err) => {
      if (err.name !== 'AbortError') setStatus('error');
    };

    if (USE_DB) {
      // Query PostgREST contra la tabla products. El contador total viene en
      // el header Content-Range (0-23/1234) gracias a Prefer: count=exact.
      const params = new URLSearchParams({
        select: 'id,title,image,release_date,price_band',
        sub: `in.(${codesFor(category, sub).join(',')})`,
        // "relevant"/desc: manga y cómics primero (prio), luego por fecha.
        // asc explícito: orden por fecha puro.
        order:
          sort === 'released_date_asc'
            ? 'release_date.asc.nullslast,id.asc'
            : 'prio.desc,release_date.desc.nullslast,id.asc',
        limit: '24',
        offset: String((page - 1) * 24),
      });
      const q = query.replace(/[(),.*%]/g, ' ').trim();
      if (q) params.set('title', `ilike.*${q}*`);
      if (band !== '') params.set('price_band', `eq.${band}`);
      if (year) {
        const m = year.match(/(\d{4})?,\s*(\d{4})/);
        if (m) {
          if (m[1]) params.append('release_date', `gte.${m[1]}-01-01`);
          params.append('release_date', `lte.${m[2]}-12-31`);
        }
      }
      const load = () =>
        fetch(`${SUPA_URL}/rest/v1/products?${params.toString()}`, {
          signal: controller.signal,
          headers: {
            apikey: SUPA_KEY,
            Authorization: `Bearer ${SUPA_KEY}`,
            Prefer: 'count=exact',
          },
        })
          .then(async (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const total = Number((r.headers.get('content-range') || '').split('/')[1]) || 0;
            return { rows: await r.json(), total };
          })
          .then(({ rows, total }) => {
            const list = (rows || []).map((r) => ({
              id: r.id,
              title: r.title,
              // Imagen directo al CDN del origen — sin proxy (ahorra
              // invocaciones/bandwidth del host de functions). Las filas viejas
              // guardan '/api/jp-image?u=<cdn>' — se desenvuelve el param u.
              // no_photo.jpg es el placeholder del origen = sin foto real.
              image: (() => {
                const raw = r.image?.startsWith('/api/jp-image?u=')
                  ? decodeURIComponent(r.image.slice('/api/jp-image?u='.length).split('&')[0])
                  : r.image;
                return raw?.startsWith('http') && !raw.includes('no_photo') ? raw : null;
              })(),
              releaseDate: r.release_date || null,
              priceBand: r.price_band ?? null,
            }));
            applyResults(list, total, false, page * 24 < total);
          });

      // Si el crawler está saturando la DB, Supabase devuelve 500
      // transitorios: un retry a los 1.5s suele alcanzar
      load().catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        setTimeout(() => {
          if (!controller.signal.aborted) load().catch(onError);
        }, 1500);
      });
    } else {
      const params = new URLSearchParams({ q: query, category, page: String(page), sort });
      if (sub) params.set('sub', sub);
      if (year) params.set('year', year);
      fetch(`${JP_API}/api/jp-search?${params.toString()}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data) => {
          // Las URLs de imagen vienen relativas (/api/jp-image?...): si la API
          // está en otro origen hay que prefijarlas con la base.
          const list = (data.items || []).map((it) =>
            JP_API && typeof it.image === 'string' && it.image.startsWith('/')
              ? { ...it, image: JP_API + it.image }
              : it
          );
          applyResults(list, data.totalCount || 0, Boolean(data.totalApprox), Boolean(data.hasMore));
        })
        .catch(onError);
    }
    return () => controller.abort();
  }, [query, category, sub, year, band, sort, page]);

  const toggleSelect = (p) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) delete next[p.id];
      else next[p.id] = { id: p.id, title: p.title };
      return next;
    });
  };

  const openConsult = (products) => {
    setConsultItems(products);
    onConsultOpen();
  };

  const openPreview = (p) => {
    setPreviewItem(p);
    onPreviewOpen();
  };

  const handleCopyAndOpenInstagram = async () => {
    const message = buildMessage(consultItems || []);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(message);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = message;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast({
        title: 'Consulta copiada',
        description: 'Se abrió Instagram. Pegá el mensaje en el chat y envialo.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    } catch {
      toast({
        title: 'No se pudo copiar',
        description: 'Anotá los títulos y consultanos por Instagram: @arkya.store',
        status: 'warning',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
    onConsultClose();
    window.open(IG_DM_URL, '_blank', 'noopener,noreferrer');
  };

  const selectedList = Object.values(selected);
  // totalCount puede ser aproximado mientras se escanea la región sin-stock:
  // si hay más por descubrir, se garantiza al menos una página siguiente.
  const totalPages = Math.max(
    Math.ceil(totalCount / 24),
    hasMore ? page + 1 : page
  );
  const goToPage = (newPage) => {
    if (newPage >= 1 && (newPage <= totalPages || hasMore)) setPage(newPage);
  };

  const bgColor = '#453641';
  const cardBg = '#2a1c29'; // mismo bg que las cards del catálogo principal

  return (
    <>
      <SEO
        title="Catálogo Japonés | Arkya Store"
        description="Buscá libros, mangas, artbooks y doujinshi del catálogo japonés y consultanos por Instagram."
        url="https://arkya.store/catalogo"
        keywords="catálogo japonés, manga, doujinshi, artbooks, libros japón, importados, arkya store"
      />
      <Box bg={bgColor} minH="70vh" py={{ base: 10, md: 16 }}>
        <Container maxW="6xl">
          <VStack spacing={2} mb={8} textAlign="center">
            <Flex align="center" gap={2}>
              <FaBookOpen color="#ec4899" size={24} />
              <Heading as="h1" color="white" fontSize={{ base: 'xl', md: '3xl' }} fontWeight={600}>
                Catálogo Para Traer a Pedido
              </Heading>
            </Flex>
            <Text color="whiteAlpha.600" fontSize="md" maxW="xl">
              Buscá libros y doujin. Marcá los que te interesen y consultanos
              por Instagram para que los cotizemos!
            </Text>
            <Text color="whiteAlpha.600" fontSize="md" maxW="xl">
              La disponibilidad y el precio final de cada producto se confirman al momento de la consulta.
            </Text>
          </VStack>

          {/* Panel de búsqueda y filtros */}
          <Box
            maxW="3xl"
            mx="auto"
            mb={10}
            bg="#2d1e2a"
            border="1px solid"
            borderColor="whiteAlpha.100"
            borderRadius="2xl"
            p={{ base: 4, md: 6 }}
            boxShadow="0 12px 40px rgba(0,0,0,0.35)"
          >
            <VStack spacing={5} align="stretch">
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" h="100%">
                  <FaSearch color="whiteAlpha.500" />
                </InputLeftElement>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Buscar manga, artbook, doujinshi... (ej: one piece)"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  h="52px"
                  fontSize="md"
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  _hover={{ borderColor: 'pink.400' }}
                  _focus={{ borderColor: 'pink.400', boxShadow: '0 0 0 1px #ec4899' }}
                  borderRadius="xl"
                />
              </InputGroup>

              {/* Advertencia: algunos títulos usan nombres distintos en Japón */}
              <Flex
                bg="whiteAlpha.50"
                borderLeft="3px solid"
                borderColor="orange.300"
                borderRadius="md"
                px={3}
                py={2}
                gap={2}
                align="flex-start"
              >
                <Box color="orange.300" mt={0.5} flexShrink={0}>
                  <FaExclamationTriangle size={11} />
                </Box>
                <Text color="whiteAlpha.600" fontSize="xs" lineHeight="1.6">
                  Tené en cuenta que algunos libros pueden no aparecer ni
                  en inglés: en Japón a veces usan un nombre distinto al
                  habitual. Si no lo encontrás, consultanos por Instagram y lo
                  buscamos nosotros.
                </Text>
              </Flex>

              {/* Aviso: el catálogo es una muestra, hay mucho más disponible */}
              <Flex
                bg="whiteAlpha.50"
                borderLeft="3px solid"
                borderColor="pink.400"
                borderRadius="md"
                px={3}
                py={2}
                gap={2}
                align="flex-start"
              >
                <Box color="pink.400" mt={0.5} flexShrink={0}>
                  <FaInfoCircle size={11} />
                </Box>
                <Text color="whiteAlpha.600" fontSize="xs" lineHeight="1.6">
                  Este catálogo muestra solo una parte de lo que podemos
                  conseguir: hay muchísimos más libros disponibles. Si buscás
                  algo puntual que no aparece, consultanos por Instagram —
                  las ediciones normales de mangas y novelas suelen poder
                  traerse todas.
                </Text>
              </Flex>

              {/* Categoría: segmented control */}
              <Flex justify="center">
                <HStack
                  spacing={0}
                  bg="blackAlpha.400"
                  p={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                >
                  {CATEGORY_TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      size="sm"
                      borderRadius="full"
                      px={6}
                      variant={category === tab.id ? 'solid' : 'ghost'}
                      colorScheme="pink"
                      color={category === tab.id ? 'white' : 'whiteAlpha.600'}
                      _hover={category === tab.id || tab.soon ? undefined : { color: 'white', bg: 'whiteAlpha.100' }}
                      onClick={() => !tab.soon && setCategory(tab.id)}
                      isDisabled={tab.soon}
                      opacity={tab.soon ? 0.6 : 1}
                      cursor={tab.soon ? 'default' : 'pointer'}
                    >
                      {tab.label}
                      {tab.soon && (
                        <Badge ml={2} colorScheme="purple" fontSize="2xs" borderRadius="full">
                          Próximamente
                        </Badge>
                      )}
                    </Button>
                  ))}
                </HStack>
              </Flex>

              <Divider borderColor="whiteAlpha.100" />

              {/* Filtros: tipo, subtipo, año y orden */}
              <Flex wrap="wrap" gap={4} justify="center">
                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="2xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    TIPO
                  </Text>
                  <FilterSelect
                    placeholder="Todos"
                    value={sub1}
                    onChange={(v) => {
                      setSub1(v);
                      setSub2('');
                    }}
                    options={toOptions(sub1Options)}
                  />
                </Box>

                {sub2Options.length > 0 && (
                  <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                    <Text fontSize="2xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                      SUBTIPO
                    </Text>
                    <FilterSelect
                      placeholder="Todos"
                      value={sub2}
                      onChange={setSub2}
                      options={toOptions(sub2Options)}
                    />
                  </Box>
                )}

                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="2xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    AÑO
                  </Text>
                  <FilterSelect
                    placeholder="Cualquiera"
                    value={year}
                    onChange={setYear}
                    options={YEAR_RANGES}
                  />
                </Box>

                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="2xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    PRECIO APROX.
                  </Text>
                  <FilterSelect
                    placeholder="Cualquiera"
                    value={band}
                    onChange={setBand}
                    options={PRICE_BAND_OPTIONS}
                  />
                </Box>

                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="2xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    ORDEN
                  </Text>
                  <FilterSelect
                    placeholder="Ordenar"
                    value={sort}
                    onChange={setSort}
                    options={SORT_OPTIONS}
                  />
                </Box>
              </Flex>
            </VStack>
          </Box>

          <Box ref={resultsRef} scrollMarginTop="80px">
            {status === 'loading' && (
              <VStack spacing={4} align="stretch">
                <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
                  Cargando resultados...
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} height="300px" borderRadius="xl" startColor="#2d1e2a" endColor="#3d2a38" />
                  ))}
                </SimpleGrid>
              </VStack>
            )}

            {status === 'error' && (
              <VStack py={10} spacing={3} textAlign="center">
                <Text color="whiteAlpha.700" fontSize="lg">
                  No pudimos cargar el catálogo en este momento.
                </Text>
                <Text color="whiteAlpha.500" fontSize="sm">
                  Probá de nuevo en unos segundos.
                </Text>
              </VStack>
            )}

            {status === 'ok' && items.length === 0 && (
              <VStack py={10} spacing={3} textAlign="center">
                <Text color="whiteAlpha.700" fontSize="lg">
                  {query ? `No hay resultados para “${query}”.` : 'No hay resultados.'}
                </Text>
                <Text color="whiteAlpha.500" fontSize="sm">
                  Si no lo encontrás, consultanos por Instagram y lo buscamos nosotros.
                </Text>
              </VStack>
            )}

            {status === 'ok' && items.length > 0 && (
              <>
                <Text color="whiteAlpha.500" fontSize="sm" mb={4} textAlign="center">
                  {`Mostrando ${(page - 1) * 24 + 1}–${(page - 1) * 24 + items.length} de ${
                    totalApprox ? 'más de ' : ''
                  }${totalCount.toLocaleString('es-AR')} resultados`}
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={{ base: 3, md: 4 }}>
                  {items.map((p) => {
                    const isSelected = Boolean(selected[p.id]);
                    return (
                      <Box
                        key={p.id}
                        bg={cardBg}
                        borderRadius="lg"
                        overflow="hidden"
                        border="2px solid"
                        borderColor={isSelected ? 'pink.400' : 'transparent'}
                        boxShadow="md"
                        transition="all 0.2s"
                        _hover={{ transform: 'translateY(-8px)', borderColor: 'pink.400', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
                        display="flex"
                        flexDirection="column"
                        cursor="pointer"
                        onClick={() => toggleSelect(p)}
                        position="relative"
                        role="group"
                      >
                        {/* Selector custom (reemplaza al Checkbox nativo) */}
                        <Flex
                          position="absolute"
                          top={2}
                          right={2}
                          zIndex={2}
                          w="24px"
                          h="24px"
                          align="center"
                          justify="center"
                          borderRadius="md"
                          border="2px solid"
                          borderColor={isSelected ? 'pink.400' : 'whiteAlpha.500'}
                          bg={isSelected ? 'pink.400' : 'blackAlpha.600'}
                          cursor="pointer"
                          transition="all 0.15s"
                          _hover={{ borderColor: 'pink.300' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelect(p);
                          }}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-label={`Seleccionar ${p.title}`}
                        >
                          {isSelected && <FaCheck size={11} color="white" />}
                        </Flex>
                        {/* Imagen con overlay hover y badges, como las cards del main */}
                        <Box
                          h={{ base: '160px', md: '220px' }}
                          position="relative"
                          overflow="hidden"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          p={3}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (p.image && !brokenImages[p.id]) openPreview(p);
                          }}
                          cursor={p.image && !brokenImages[p.id] ? 'zoom-in' : 'default'}
                        >
                          {p.image && !brokenImages[p.id] ? (
                            <Image
                              src={p.image}
                              alt={p.title}
                              maxH="100%"
                              maxW="100%"
                              objectFit="contain"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              borderRadius="sm"
                              boxShadow="0 4px 14px rgba(0,0,0,0.35)"
                              transition="transform 0.3s ease"
                              _groupHover={{ transform: 'scale(1.05)' }}
                              onError={() =>
                                setBrokenImages((prev) => ({ ...prev, [p.id]: true }))
                              }
                              fallback={<Spinner color="pink.400" />}
                            />
                          ) : (
                            // Placeholder para items sin foto en el origen
                            <VStack spacing={2} color="whiteAlpha.400" h="100%" justify="center">
                              <FaBookOpen size={34} />
                              <Text fontSize="2xs" letterSpacing="wider" textTransform="uppercase">
                                Sin imagen
                              </Text>
                            </VStack>
                          )}
                          {/* Overlay sutil al hover */}
                          <Box
                            position="absolute"
                            inset={0}
                            bg="blackAlpha.300"
                            opacity={0}
                            transition="opacity 0.3s ease"
                            _groupHover={{ opacity: 1 }}
                            pointerEvents="none"
                          />
                          {/* Banda de precio sobre la imagen, como los badges del main */}
                          {p.priceBand != null && JP_PRICE_BANDS[p.priceBand] && (
                            <Badge
                              position="absolute"
                              top={2}
                              left={2}
                              zIndex={2}
                              bg="pink.400"
                              color="white"
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontWeight="bold"
                              fontSize={{ base: 'xs', md: 'sm' }}
                              boxShadow="md"
                              opacity={0.95}
                            >
                              {JP_PRICE_BANDS[p.priceBand].label}
                            </Badge>
                          )}
                        </Box>
                        <VStack align="stretch" p={4} spacing={2} flex={1}>
                          <Text
                            color="white"
                            fontSize="sm"
                            fontWeight={600}
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {p.title}
                          </Text>
                          {p.releaseDate && (
                            <Text fontSize="2xs" color="whiteAlpha.500" noOfLines={1} mt="auto">
                              {p.releaseDate}
                            </Text>
                          )}
                          <Button
                            size="xs"
                            colorScheme="pink"
                            variant="outline"
                            leftIcon={<FaInstagram />}
                            mt={p.releaseDate ? 0 : 'auto'}
                            onClick={(e) => {
                              e.stopPropagation();
                              openConsult([p]);
                            }}
                          >
                            Consultar
                          </Button>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>

                {/* Paginación numerada (mismo estilo que el catálogo principal) */}
                {totalPages > 1 && (
                  <Flex justify="center" mt={8} mb={4} overflowX="auto" px={2}>
                    <ButtonGroup variant="outline" spacing={{ base: 1, md: 2 }} colorScheme="pink" size="sm">
                      <IconButton
                        icon={<FaChevronLeft />}
                        onClick={() => goToPage(page - 1)}
                        isDisabled={page === 1}
                        aria-label="Página anterior"
                        size="sm"
                      />

                      {(() => {
                        const pageButtons = [];
                        pageButtons.push(
                          <Button
                            key={1}
                            onClick={() => goToPage(1)}
                            variant={page === 1 ? 'solid' : 'outline'}
                            colorScheme="pink"
                            size="sm"
                          >
                            1
                          </Button>
                        );

                        if (totalPages > 7) {
                          if (page <= 4) {
                            for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="sm">{i}</Button>
                              );
                            }
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="sm">...</Button>
                            );
                          } else if (page >= totalPages - 3) {
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="sm">...</Button>
                            );
                            for (let i = Math.max(2, totalPages - 4); i < totalPages; i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="sm">{i}</Button>
                              );
                            }
                          } else {
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="sm">...</Button>
                            );
                            for (let i = page - 2; i <= page + 2; i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="sm">{i}</Button>
                              );
                            }
                            pageButtons.push(
                              <Button key="ellipsis2" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="sm">...</Button>
                            );
                          }
                        } else {
                          for (let i = 2; i < totalPages; i++) {
                            pageButtons.push(
                              <Button
                                key={i}
                                onClick={() => goToPage(i)}
                                variant={page === i ? 'solid' : 'outline'}
                                colorScheme="pink"
                                size="sm"
                              >
                                {i}
                              </Button>
                            );
                          }
                        }

                        if (totalPages > 1) {
                          pageButtons.push(
                            <Button
                              key={totalPages}
                              onClick={() => goToPage(totalPages)}
                              variant={page === totalPages ? 'solid' : 'outline'}
                              colorScheme="pink"
                              size="sm"
                            >
                              {totalPages}
                            </Button>
                          );
                        }

                        return pageButtons;
                      })()}

                      <IconButton
                        icon={<FaChevronRight />}
                        onClick={() => goToPage(page + 1)}
                        isDisabled={!hasMore && page >= totalPages}
                        aria-label="Página siguiente"
                        size="sm"
                      />
                    </ButtonGroup>
                  </Flex>
                )}
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Barra flotante de consulta múltiple */}
      {selectedList.length > 0 && (
        <Flex
          position="fixed"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          zIndex={1000}
          bg="#2d1e2a"
          border="1px solid"
          borderColor="pink.400"
          borderRadius="full"
          px={5}
          py={3}
          align="center"
          gap={4}
          maxW="92vw"
        >
          <Text color="white" fontSize="sm" fontWeight={600} whiteSpace="nowrap">
            {selectedList.length} seleccionado{selectedList.length > 1 ? 's' : ''}
          </Text>
          <Button
            size="sm"
            colorScheme="pink"
            borderRadius="full"
            leftIcon={<FaInstagram />}
            onClick={() => openConsult(selectedList)}
            whiteSpace="nowrap"
          >
            Consultar por Instagram
          </Button>
          <Button
            size="sm"
            variant="ghost"
            color="whiteAlpha.700"
            borderRadius="full"
            onClick={() => setSelected({})}
          >
            Limpiar
          </Button>
        </Flex>
      )}

      {/* Modal de consulta por Instagram (mismo estilo que "Comprar por Instagram") */}
      <Modal isOpen={isConsultOpen} onClose={onConsultClose} isCentered size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="#2d1e2a" color="white" mx={4} maxH="85vh" overflowY="auto">
          <ModalHeader fontSize="2xl" fontWeight="bold" pb={2}>
            Consultar por Instagram
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              <Text fontSize="md" color="whiteAlpha.700">
                Vas a consultar por {consultItems?.length > 1 ? `${consultItems.length} productos` : 'un producto'} del
                catálogo a pedido. Sigue estos sencillos pasos:
              </Text>

              <List spacing={4}>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaClipboard} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 1: Copiar mensaje</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Al hacer clic en el botón, el mensaje con tu consulta se copiará automáticamente.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaInstagram} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 2: Abrir Instagram</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Se abrirá automáticamente el chat de @arkya.store en una nueva pestaña.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCheckCircle} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 3: Pegar y enviar</Text>
                    <Text fontSize="sm" color="whiteAlpha.600">
                      Pega el mensaje en el chat (Ctrl+V en PC o Cmd+V en MAC) y envíalo para que te pasemos precio y disponibilidad.
                    </Text>
                  </Box>
                </ListItem>
              </List>

              <Box
                bg="whiteAlpha.100"
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
              >
                <Text fontWeight="bold" mb={3} fontSize="md" color="pink.300">
                  📋 Vista previa del mensaje:
                </Text>
                <Box
                  bg="gray.800"
                  p={3}
                  borderRadius="md"
                  fontSize="sm"
                  fontFamily="monospace"
                  whiteSpace="pre-wrap"
                  maxH="200px"
                  overflowY="auto"
                >
                  {consultItems ? buildMessage(consultItems) : ''}
                </Box>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={3} justifyContent="center">
            <Button variant="ghost" size="lg" onClick={onConsultClose}>
              Cancelar
            </Button>
            <Button
              bg="pink.400"
              color="white"
              size="lg"
              leftIcon={<FaInstagram />}
              onClick={handleCopyAndOpenInstagram}
              _hover={{ bg: 'pink.500' }}
            >
              Copiar y abrir Instagram
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal para ver la imagen del producto — full viewport, fondo
          difuminado, la imagen manda */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={onPreviewClose}
        isCentered
        size="full"
        motionPreset="scale"
      >
        <ModalOverlay bg="rgba(36, 21, 33, 0.92)" backdropFilter="blur(10px)" />
        <ModalContent bg="transparent" boxShadow="none" onClick={onPreviewClose} cursor="zoom-out">
          <ModalCloseButton
            color="white"
            bg="whiteAlpha.200"
            borderRadius="full"
            top={4}
            right={4}
            _hover={{ bg: 'whiteAlpha.300' }}
            zIndex={2}
          />
          <ModalBody
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            minH="100vh"
            gap={5}
          >
            {previewItem && (
              <>
                <Image
                  // Versión grande del CDN (game/ es el bucket genérico).
                  // Si no existe, onError cae al thumbnail del card.
                  // Click sobre la foto no cierra; afuera sí (ModalContent).
                  src={previewItem.image?.replace(
                    /pics_webp\/boxart_m\/(\d+)m\.jpg\.webp$/,
                    'database/pics_webp/game/$1.jpg.webp'
                  )}
                  onError={(e) => {
                    if (e.currentTarget.src !== previewItem.image) {
                      e.currentTarget.src = previewItem.image;
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  alt={previewItem.title}
                  referrerPolicy="no-referrer"
                  maxH={{ base: '60vh', md: '72vh' }}
                  maxW={{ base: '92vw', md: '70vw' }}
                  w="auto"
                  objectFit="contain"
                  borderRadius="lg"
                  boxShadow="0 20px 60px rgba(0,0,0,0.6)"
                />
                <VStack spacing={3} maxW="lg" px={4} onClick={(e) => e.stopPropagation()}>
                  <Text
                    color="white"
                    fontWeight={600}
                    fontSize={{ base: 'sm', md: 'md' }}
                    textAlign="center"
                    noOfLines={2}
                  >
                    {previewItem.title}
                  </Text>
                  <HStack spacing={3}>
                    {previewItem.releaseDate && (
                      <Badge colorScheme="whiteAlpha" variant="subtle" borderRadius="full" px={3} py={1}>
                        {previewItem.releaseDate}
                      </Badge>
                    )}
                    {previewItem.priceBand != null && (
                      <Badge colorScheme="pink" borderRadius="full" px={4} py={1} fontSize="sm">
                        {JP_PRICE_BANDS[previewItem.priceBand]?.label}
                      </Badge>
                    )}
                  </HStack>
                  <Button
                    size="sm"
                    colorScheme="pink"
                    variant={selected[previewItem.id] ? 'solid' : 'outline'}
                    borderRadius="full"
                    leftIcon={<FaInstagram />}
                    onClick={() => toggleSelect(previewItem)}
                  >
                    {selected[previewItem.id] ? 'Quitar de la consulta' : 'Agregar a la consulta'}
                  </Button>
                </VStack>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
