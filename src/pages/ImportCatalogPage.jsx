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
  InputRightElement,
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
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  List,
  ListItem,
  ListIcon,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { FaSearch, FaBookOpen, FaInstagram, FaChevronLeft, FaChevronRight, FaChevronDown, FaCheck, FaCheckCircle, FaClipboard, FaExclamationTriangle, FaInfoCircle, FaTimes, FaBan } from 'react-icons/fa';
import { SEO } from '../components/SEO';
import { useSearchParams } from 'react-router-dom';
import { JP_CATEGORY_TREE, JP_PRICE_BANDS, JP_SEARCH_ALIASES } from '../data/jpCatalogFilters';

// El catálogo se lee directo de Supabase (tabla `products` que llena
// scripts/jp-crawl.mjs). La anon key es pública: la tabla tiene RLS de
// solo lectura.
const SUPA_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
// Doujin vive en un proyecto Supabase aparte (~1M items: no entra en el
// free tier junto a los libros). Mismo schema de `products`; las tabs de
// doujin se habilitan solas cuando la env var está configurada.
const SUPA_DOUJIN_URL = (import.meta.env.VITE_SUPABASE_DOUJIN_URL || '').replace(/\/$/, '');
const SUPA_DOUJIN_KEY = import.meta.env.VITE_SUPABASE_DOUJIN_ANON_KEY || '';
const HAS_DOUJIN = Boolean(SUPA_DOUJIN_URL && SUPA_DOUJIN_KEY);
const supaFor = (cat) =>
  cat === 'doujin'
    ? { url: SUPA_DOUJIN_URL, key: SUPA_DOUJIN_KEY }
    : { url: SUPA_URL, key: SUPA_KEY };

const CATEGORY_TABS = [
  { id: 'all', label: 'Libros + Doujinshi', soon: !HAS_DOUJIN },
  { id: 'books', label: 'Libros' },
  { id: 'doujin', label: 'Doujinshi', soon: !HAS_DOUJIN },
];

// Mapeo categoría/subcategoría -> códigos hoja crawleados. La UI puede
// elegir un tipo de nivel 1 (p.ej. "Cómic") y el filtro cubre sus hojas.
const LEAF_CODES = {};
const LEAF_LOOKUP = {};
for (const [cat, tree] of Object.entries(JP_CATEGORY_TREE)) {
  LEAF_CODES[cat] = {};
  LEAF_LOOKUP[cat] = {};
  for (const level1 of tree) {
    LEAF_CODES[cat][level1.code] = level1.children.flatMap((c) => c.codes || [c.code]);
    for (const leaf of level1.children) {
      LEAF_LOOKUP[cat][leaf.code] = leaf.codes || [leaf.code];
    }
  }
}
function codesFor(cat, sub) {
  const map = LEAF_CODES[cat] || {};
  if (!sub) return Object.values(map).flat();
  return map[sub] || LEAF_LOOKUP[cat]?.[sub] || [sub];
}

// Para 'all' el filtro se reparte entre las dos DBs: cada fuente recibe
// solo los códigos de su árbol; si el sub elegido no le pertenece → []
// (esa fuente no se consulta).
function codesForSource(src, sub) {
  if (!sub) return codesFor(src, '');
  return LEAF_CODES[src]?.[sub] || LEAF_LOOKUP[src]?.[sub] || [];
}

// Código de sub -> "Tipo / Subtipo" para mostrar en las cards.
const SUB_LABELS = {};
for (const [cat, tree] of Object.entries(JP_CATEGORY_TREE)) {
  SUB_LABELS[cat] = {};
  for (const level1 of tree)
    for (const leaf of level1.children)
      for (const c of leaf.codes || [leaf.code])
        SUB_LABELS[cat][c] = `${level1.label} / ${leaf.label}`;
}
// 'all' consulta ambas DBs: el label de una card puede venir de
// cualquiera de los dos árboles (los códigos no se pisan).
SUB_LABELS.all = { ...SUB_LABELS.books, ...SUB_LABELS.doujin };

// Palabras que no sirven para el fallback OR de búsqueda: partículas
// romanizadas (no/wa/ga...) y conectores comunes aparecen en cientos de
// miles de títulos y convertirían el OR en "todo el catálogo".
const OR_STOPWORDS = new Set([
  'no', 'wa', 'ga', 'de', 'to', 'ni', 'wo', 'mo', 'ka', 'na', 'yo', 'ne',
  'the', 'of', 'a', 'an', 'in', 'on', 'at', 'and', 'or', 'for', 'with',
  'el', 'la', 'los', 'las', 'del', 'en', 'y', 'un', 'una',
]);

const JP_CHARS = /[぀-ヿ㐀-鿿]/;
const GT_CACHE = new Map();
// Traducción silenciosa del query con el endpoint público de Google (sin
// key): si el query no trae japonés se traduce a japonés; si trae, a inglés.
// El resultado se OR-ea con la búsqueda normal — el origen deja muchos
// títulos en japonés puro o los romaniza mal ("チェンソーマン" → "Chiensoman").
// Cacheada por texto; si Google falla o tarda >2s, se busca sin el término.
const translateTerm = async (text, target) => {
  const ck = `${target}:${text}`;
  if (GT_CACHE.has(ck)) return GT_CACHE.get(ck);
  let t = '';
  try {
    const u = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(text)}`;
    const r = await fetch(u, { signal: AbortSignal.timeout(2000) });
    if (r.ok) t = (await r.json())?.[0]?.map((s) => s?.[0] || '').join('').trim() || '';
  } catch {}
  GT_CACHE.set(ck, t);
  return t;
};

// Comparador para mergear las dos fuentes de 'all': replica el `order`
// que se manda a PostgREST (nulls last, desempate por id) para que el
// merge de las listas respete el orden elegido.
const cmpForSort = (sort) => {
  const cmpId = (a, b) => String(a.id).localeCompare(String(b.id));
  const byPrio = (a, b) => (b.prio ?? -1) - (a.prio ?? -1);
  const byDate = (dir) => (a, b) => {
    if (!a.release_date && !b.release_date) return 0;
    if (!a.release_date) return 1;
    if (!b.release_date) return -1;
    return dir * String(a.release_date).localeCompare(String(b.release_date));
  };
  const byBand = (dir) => (a, b) => {
    if (a.price_band == null && b.price_band == null) return 0;
    if (a.price_band == null) return 1;
    if (b.price_band == null) return -1;
    return dir * (a.price_band - b.price_band);
  };
  switch (sort) {
    case 'released_date_asc':
      return (a, b) => byDate(1)(a, b) || cmpId(a, b);
    case 'released_date_desc':
      return (a, b) => byDate(-1)(a, b) || cmpId(a, b);
    case 'price_asc':
      return (a, b) => byBand(1)(a, b) || byPrio(a, b) || byDate(-1)(a, b) || cmpId(a, b);
    case 'price_desc':
      return (a, b) => byBand(-1)(a, b) || byPrio(a, b) || byDate(-1)(a, b) || cmpId(a, b);
    default:
      return (a, b) => byPrio(a, b) || byDate(-1)(a, b) || cmpId(a, b);
  }
};

const SORT_OPTIONS = [
  { value: 'released_date_desc', label: 'Más recientes' },
  { value: 'released_date_asc', label: 'Más antiguos' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
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

// Dropdown custom (los <select> nativos se ven feos en el tema oscuro).
// allowExclude: cada opción suma un ícono de prohibido que la togglea en
// el set de excluidas (se muestran tachadas; el botón dice "Sin A, B" o
// "<incluida> · −n" cuando hay inclusión y exclusiones juntas).
function FilterSelect({ placeholder, value, options, groups, onChange, allowClear = true, allowExclude = false, excludedValues = [], onToggleExclude }) {
  const flat = groups ? groups.flatMap((g) => g.items) : options;
  const current = flat.find((o) => o.value === value);
  const excludedLabels = excludedValues
    .map((v) => flat.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const renderItem = (o) => {
    const isSel = value === o.value;
    const isEx = excludedValues.includes(o.value);
    return (
      <MenuItem
        key={o.value}
        bg="transparent"
        pl={groups ? 5 : 3}
        fontSize="md"
        color={isEx ? 'orange.300' : isSel ? 'pink.300' : 'whiteAlpha.800'}
        fontWeight={isSel || isEx ? 600 : 400}
        _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
        onClick={() => onChange(o.value)}
      >
        <Flex w="100%" align="center" justify="space-between" gap={2}>
          <Text as="span" noOfLines={1} textDecoration={isEx ? 'line-through' : 'none'}>
            {o.label}
          </Text>
          {allowExclude && (
            <IconButton
              aria-label={`Excluir ${o.label}`}
              title={isEx ? `Dejar de excluir ${o.label}` : `Excluir ${o.label}`}
              icon={<FaBan size={12} />}
              size="xs"
              variant="ghost"
              borderRadius="full"
              color={isEx ? 'orange.300' : 'whiteAlpha.500'}
              bg={isEx ? 'whiteAlpha.200' : undefined}
              _hover={{ color: 'orange.300', bg: 'whiteAlpha.200' }}
              onClick={(e) => {
                // No burbujear: el item no selecciona ni cierra el menú,
                // así se pueden excluir varias opciones de una.
                e.stopPropagation();
                onToggleExclude(o.value);
              }}
            />
          )}
        </Flex>
      </MenuItem>
    );
  };

  return (
    <Menu placement="bottom-start" autoSelect={false}>
      <MenuButton
        as={Button}
        size="md"
        w="100%"
        rightIcon={<FaChevronDown size={9} />}
        bg="whiteAlpha.100"
        color={current ? 'white' : excludedLabels.length ? 'orange.300' : 'whiteAlpha.600'}
        border="1px solid"
        borderColor={excludedLabels.length ? 'orange.400' : current ? 'pink.400' : 'whiteAlpha.200'}
        borderRadius="lg"
        fontWeight={500}
        px={4}
        _hover={{ borderColor: excludedLabels.length ? 'orange.400' : 'pink.400', bg: 'whiteAlpha.200' }}
        _active={{ bg: 'whiteAlpha.200' }}
      >
        <Text as="span" noOfLines={1}>
          {current
            ? `${current.label}${excludedLabels.length ? ` · −${excludedLabels.length}` : ''}`
            : excludedLabels.length
              ? `Sin ${excludedLabels.join(', ')}`
              : placeholder}
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
        {allowClear && (
          <MenuItem
            bg="transparent"
            fontSize="md"
            color={!value ? 'pink.300' : 'whiteAlpha.600'}
            fontWeight={!value ? 600 : 400}
            _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
            onClick={() => onChange('')}
          >
            {placeholder}
          </MenuItem>
        )}
        {groups
          ? groups.map((g) => (
              <Box key={g.label}>
                <Text
                  px={3}
                  pt={3}
                  pb={1}
                  fontSize="sm"
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

// Select de precio con slider de rango: dos thumbs sobre los índices de
// JP_PRICE_BANDS. El value es '' (cualquiera), '2' (una banda) o '1-3'
// (rango — gte/lte en la query). Las bandas son rangos estimados en ARS:
// el label del slider muestra piso de la banda baja → techo de la alta.
const PRICE_MAX_BAND = JP_PRICE_BANDS.length - 1;
const BAND_LO = ['~$15k', '~$15k', '~$25k', '~$35k', '~$55k', '~$90k'];
const BAND_HI = ['$35k', '$45k', '$45k', '$70k', '$100k', '+$90k'];
const parseBandRange = (b) => {
  if (!b) return [0, PRICE_MAX_BAND];
  const [lo, hi] = b.split('-').map(Number);
  return [lo, hi ?? lo];
};
function PriceRangeSelect({ value, onChange }) {
  const [range, setRange] = useState(() => parseBandRange(value));
  // Si el filtro se resetea desde afuera (URL, otro control) el slider
  // vuelve a los extremos.
  useEffect(() => setRange(parseBandRange(value)), [value]);

  const label = !value
    ? 'Cualquiera'
    : `${BAND_LO[range[0]]} – ${BAND_HI[range[1]]}`;

  return (
    <Menu placement="bottom-start" autoSelect={false} closeOnSelect={false}>
      <MenuButton
        as={Button}
        size="md"
        w="100%"
        rightIcon={<FaChevronDown size={9} />}
        bg="whiteAlpha.100"
        color={value ? 'white' : 'whiteAlpha.600'}
        border="1px solid"
        borderColor={value ? 'pink.400' : 'whiteAlpha.200'}
        borderRadius="lg"
        fontWeight={500}
        px={4}
        _hover={{ borderColor: 'pink.400', bg: 'whiteAlpha.200' }}
        _active={{ bg: 'whiteAlpha.200' }}
      >
        <Text as="span" noOfLines={1}>
          {label}
        </Text>
      </MenuButton>
      <MenuList
        bg="#2d1e2a"
        border="1px solid"
        borderColor="whiteAlpha.200"
        borderRadius="xl"
        py={2}
        minW="250px"
        zIndex={1500}
        boxShadow="0 8px 30px rgba(0,0,0,0.6)"
      >
        <MenuItem
          bg="transparent"
          fontSize="md"
          color={!value ? 'pink.300' : 'whiteAlpha.600'}
          fontWeight={!value ? 600 : 400}
          _hover={{ bg: 'whiteAlpha.100', color: 'white' }}
          onClick={() => onChange('')}
        >
          Cualquiera
        </MenuItem>
        <Box px={4} pt={3} pb={2}>
          <Text fontSize="sm" color="whiteAlpha.500" mb={2}>
            Rango:{' '}
            <Text as="span" color="pink.300" fontWeight={600}>
              {range[0] === 0 && range[1] === PRICE_MAX_BAND
                ? 'todos'
                : `${BAND_LO[range[0]]} a ${BAND_HI[range[1]]}`}
            </Text>
          </Text>
          <RangeSlider
            min={0}
            max={PRICE_MAX_BAND}
            step={1}
            minStepsBetweenThumbs={0}
            value={range}
            onChange={setRange}
            // El filtro (y el fetch) se aplica al soltar — no en cada tick
            // del drag.
            onChangeEnd={(r) =>
              onChange(
                r[0] === 0 && r[1] === PRICE_MAX_BAND
                  ? ''
                  : r[0] === r[1]
                    ? String(r[0])
                    : `${r[0]}-${r[1]}`
              )
            }
            colorScheme="pink"
          >
            <RangeSliderTrack bg="whiteAlpha.200">
              <RangeSliderFilledTrack />
            </RangeSliderTrack>
            <RangeSliderThumb index={0} />
            <RangeSliderThumb index={1} />
          </RangeSlider>
          <Flex justify="space-between" mt={2}>
            <Text fontSize="sm" color="whiteAlpha.600">
              {BAND_LO[0]}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.600">
              {BAND_HI[PRICE_MAX_BAND]}
            </Text>
          </Flex>
        </Box>
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
  const [category, setCategory] = useState(() => {
    // Default: Libros + Doujinshi. Si la DB de doujin no está configurada
    // (tab "Próximamente"), cae a Libros.
    const c = searchParams.get('cat') || 'all';
    const tab = CATEGORY_TABS.find((t) => t.id === c);
    return tab && !tab.soon ? c : 'books';
  });
  // Los filtros tipo/subtipo aceptan exclusión múltiple: en la URL van
  // como ?xtipo=702,703 / ?xsub=70201. Compat: un link viejo con
  // ?tipo=!702 se lee como una exclusión más.
  const [sub1, setSub1] = useState(() => (searchParams.get('tipo') || '').replace(/^!/, '')); // nivel 1 incluido
  const [sub1X, setSub1X] = useState(() => [
    ...((searchParams.get('tipo') || '').startsWith('!')
      ? [(searchParams.get('tipo') || '').slice(1)]
      : []),
    ...(searchParams.get('xtipo') || '').split(','),
  ].filter(Boolean)); // nivel 1 excluidos
  const [sub2, setSub2] = useState(() => (searchParams.get('sub') || '').replace(/^!/, '')); // nivel 2 incluido
  const [sub2X, setSub2X] = useState(() => [
    ...((searchParams.get('sub') || '').startsWith('!')
      ? [(searchParams.get('sub') || '').slice(1)]
      : []),
    ...(searchParams.get('xsub') || '').split(','),
  ].filter(Boolean)); // nivel 2 excluidos
  const [year, setYear] = useState(() => searchParams.get('a') || '');
  const [band, setBand] = useState(() => searchParams.get('precio') || ''); // índice de JP_PRICE_BANDS
  const [sort, setSort] = useState(() => searchParams.get('orden') || '');
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('p')) || 1));
  const [retryTick, setRetryTick] = useState(0);
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
  const lastTotalRef = useRef(null);
  const mixInfoRef = useRef(null);
  const toast = useToast();

  // Debounce del input
  useEffect(() => {
    const t = setTimeout(() => setQuery(inputValue.trim()), 600);
    return () => clearTimeout(t);
  }, [inputValue]);

  // Si la categoría tiene un solo tipo (Doujin → solo "Doujin magazine"),
  // el filtro TIPO muestra directamente sus subtipos y la búsqueda queda
  // acotada a ese tipo aunque no se elija nada.
  // En 'all' el TIPO muestra los dos árboles juntos (Libro/Manga/Revista/
  // Panfleto + Para mujeres/Para hombres).
  const catTree =
    category === 'all'
      ? [...JP_CATEGORY_TREE.books, ...JP_CATEGORY_TREE.doujin]
      : JP_CATEGORY_TREE[category] || [];
  const singleType = catTree.length === 1 ? catTree[0] : null;
  const sub1Options = singleType ? singleType.children : catTree;
  const sub2Options = singleType
    ? []
    : sub1Options.find((s) => s.code === sub1)?.children || [];

  const sub = sub2 || sub1 || (singleType?.code ?? '');

  // Reset a página 1 como estado derivado: si cambió búsqueda/filtros, este
  // render ya usa página 1 (evita el fetch con offset viejo → 416). En el
  // primer render la key coincide, así la ?p= de la URL se respeta.
  const filtersKey = `${query}|${category}|${sub}|${sub1X.join(',')}|${sub2X.join(',')}|${year}|${band}|${sort}`;
  const [prevFiltersKey, setPrevFiltersKey] = useState(filtersKey);
  let effPage = page;
  if (prevFiltersKey !== filtersKey) {
    setPrevFiltersKey(filtersKey);
    effPage = 1;
    if (page !== 1) setPage(1);
  }

  // Persistir estado en la URL (replace: no ensucia el historial, pero
  // recargar o volver desde otra página restaura búsqueda + página)
  useEffect(() => {
    const p = {};
    if (query) p.q = query;
    if (category !== 'all') p.cat = category;
    if (sub1) p.tipo = sub1;
    if (sub1X.length) p.xtipo = sub1X.join(',');
    if (sub2) p.sub = sub2;
    if (sub2X.length) p.xsub = sub2X.join(',');
    if (year) p.a = year;
    if (band !== '') p.precio = band;
    if (sort) p.orden = sort;
    if (effPage > 1) p.p = String(effPage);
    setSearchParams(p, { replace: true });
  }, [query, category, sub1, sub1X, sub2, sub2X, year, band, sort, effPage, setSearchParams]);

  // Scroll al tope de los resultados al cambiar de página — instantáneo:
  // el smooth se cortaba por el lazy-load de las imágenes.
  const prevPageRef = useRef(effPage);
  useEffect(() => {
    if (effPage !== prevPageRef.current) {
      prevPageRef.current = effPage;
      resultsRef.current?.scrollIntoView({ block: 'start' });
    }
  }, [effPage]);

  // Si la categoría cambia y la subcategoría elegida no pertenece, limpiarla
  useEffect(() => {
    if (sub1 && !sub1Options.some((s) => s.code === sub1)) {
      setSub1('');
      setSub2('');
      setSub2X([]);
    }
    // Lo mismo para exclusiones que quedaron huérfanas de la categoría.
    const valid = new Set(sub1Options.flatMap((s) => [s.code, ...(s.children || []).map((c) => c.code)]));
    if (sub1X.some((c) => !valid.has(c))) setSub1X((x) => x.filter((c) => valid.has(c)));
    if (sub2X.some((c) => !valid.has(c))) setSub2X((x) => x.filter((c) => valid.has(c)));
  }, [category, sub1, sub1X, sub2X, sub1Options]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('loading');

    // Códigos excluidos (nivel 1 + nivel 2) — se mandan como not.in
    // aparte del in. de inclusión: PostgREST AND-ea ambos parámetros.
    const exCodes = [...sub1X, ...sub2X];

    const applyResults = (list, total, approx, more) => {
      setItems(list);
      setTotalCount(total);
      setTotalApprox(approx);
      setHasMore(more);
      setStatus('ok');
    };
    const onError = (err) => {
      // Un request abortado puede igual rechazar con error HTTP (416/500):
      // si el efecto ya fue reemplazado, no ensuciar el estado.
      if (err.name !== 'AbortError' && !controller.signal.aborted) setStatus('error');
    };

    {
      // Lookup directo por ID de producto: query numérico/alfanumérico o link
      // .../product/<id> pegado entero. Salta filtros de sub/banda/año para
      // que el item se encuentre aunque su sub no esté en el árbol visible.
      const pid = (() => {
        const t = query.trim();
        const m = t.match(/product\/([a-zA-Z0-9]+)/) || t.match(/^([a-zA-Z]{0,5}\d{4,}[a-zA-Z0-9]*)$/);
        return m ? m[1].toLowerCase() : null;
      })();
      // Búsqueda por palabras: cada una es un ilike independiente (AND en
      // PostgREST), así "piece film red" encuentra "ONE PIECE FILM RED" aunque
      // el orden o las palabras del medio no coincidan. Si el AND devuelve 0
      // se reintenta con OR (cualquier palabra) para ampliar el recall.
      const words = query
        .replace(/[(),.*%'"]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 6);
      // Alias español/occidental → nombre romanizado (ej. "demon slayer" →
      // "kimetsu no yaiba"). Se matchea como frase completa dentro del query
      // normalizado; las claves más largas ganan ("dragon ball z" antes que
      // "dragon ball").
      const normalized = query
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      const aliasKey = Object.keys(JP_SEARCH_ALIASES)
        .sort((a, b) => b.length - a.length)
        .find((k) => normalized === k || normalized.startsWith(`${k} `) || normalized.endsWith(` ${k}`) || normalized.includes(` ${k} `));
      // Un alias puede tener alternativas separadas por '|' (ej. nombre
      // romanizado | nombre japonés real) — cada una es un grupo AND
      // independiente dentro del OR, porque el título trae una u otra.
      const aliasGroups = aliasKey
        ? JP_SEARCH_ALIASES[aliasKey].split('|').map((s) => s.trim().split(/\s+/).filter(Boolean))
        : [];
      const aliasWords = aliasGroups.flat();
      const andGroup = (ws) => `and(${ws.map((w) => `title.ilike.*${w}*`).join(',')})`;
      const mapRow = (r) => ({
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
          if (!raw?.startsWith('http') || raw.includes('no_photo')) return null;
          // www.suruga-ya.jp bloquea cross-origin (CORP 403): se deriva
          // el thumb del CDN por id; si tampoco existe, el onError de la
          // card cae al placeholder "Sin imagen".
          if (raw.includes('suruga-ya.jp/'))
            return `https://cdn.suruga-ya.com/pics_webp/boxart_m/${r.id.toLowerCase()}m.jpg.webp`;
          return raw;
        })(),
        releaseDate: r.release_date || null,
        priceBand: r.price_band ?? null,
        subLabel: SUB_LABELS[category]?.[r.sub] || null,
      });
      // Query PostgREST contra la tabla products. El contador total viene en
      // el header Content-Range (0-23/1234) gracias a Prefer: count=exact.
      // extraGroups = términos extra (la traducción del query) que se suman
      // como alternativas OR junto a los aliases.
      const buildParams = (extraGroups) => {
        const params = new URLSearchParams({
          select: 'id,title,image,release_date,price_band,sub',
          ...(pid ? {} : { sub: `in.(${codesFor(category, sub).join(',')})` }),
          // "relevant"/desc: manga y cómics primero (prio), luego por fecha.
          // precio: ordena por la banda (0-5 ≈ barato→caro), sin banda al final.
          order:
            sort === 'released_date_asc'
              ? 'release_date.asc.nullslast,id.asc'
              : sort === 'released_date_desc'
                ? 'release_date.desc.nullslast,id.asc'
                : sort === 'price_asc'
                ? 'price_band.asc.nullslast,prio.desc,release_date.desc.nullslast,id.asc'
                : sort === 'price_desc'
                  ? 'price_band.desc.nullslast,prio.desc,release_date.desc.nullslast,id.asc'
                  : 'prio.desc,release_date.desc.nullslast,id.asc',
          // Se piden 25 y se muestran 24: la fila extra dice si hay página
          // siguiente sin necesitar count=exact en cada request.
          limit: '25',
          offset: String((effPage - 1) * 24),
        });
        if (pid) params.set('id', `eq.${pid}`);
        // Exclusiones: segundo parámetro sub=not.in — se AND-ea con el
        // in. de inclusión ("todas las revistas menos Militaria").
        if (!pid && exCodes.length) {
          params.append(
            'sub',
            `not.in.(${exCodes.flatMap((c) => codesFor(category, c)).join(',')})`
          );
        }
        if (!pid && words.length) {
          const seen = new Set();
          const groups = [words, ...aliasGroups, ...extraGroups]
            .filter((g) => g.length)
            .filter((g) => {
              // La traducción a veces devuelve el mismo texto (o el alias
              // ya dice lo que se escribió): un grupo idéntico duplica el
              // ilike dentro del OR y puede timeoutear la query → 500.
              const k = g.join(' ').toLowerCase();
              if (seen.has(k)) return false;
              seen.add(k);
              return true;
            })
            // Cada grupo OR es un ilike '%..%' sobre ~1M de filas: más de
            // 4 y el statement timeoutea (500) — se cortan los extras.
            .slice(0, 4);
          if (groups.length > 1) params.set('or', `(${groups.map(andGroup).join(',')})`);
          else words.forEach((w) => params.append('title', `ilike.*${w}*`));
        }
        // band: '' | '2' | '1-3' (rango del slider -> gte/lte en la query)
        if (!pid && band !== '') {
          if (band.includes('-')) {
            const [blo, bhi] = band.split('-');
            params.set('price_band', `gte.${blo}`);
            params.append('price_band', `lte.${bhi}`);
          } else {
            params.set('price_band', `eq.${band}`);
          }
        }
        if (year && !pid) {
          const m = year.match(/(\d{4})?,\s*(\d{4})/);
          if (m) {
            if (m[1]) params.append('release_date', `gte.${m[1]}-01-01`);
            params.append('release_date', `lte.${m[2]}-12-31`);
          }
        }
        return params;
      };
      const load = async () => {
        // Traducción del query → grupo OR extra: junta en una sola búsqueda
        // los resultados del texto escrito, sus aliases y su versión en
        // japonés (o en inglés si el input ya era japonés). Si el query ya
        // matcheó un alias, el nombre japonés ya está cubierto — traducir
        // sumaría otro ilike de ruido (ej. fate→運命) y encarece la query
        // hasta el timeout (500).
        let extraGroups = [];
        if (!pid && query.trim() && !aliasGroups.length) {
          const t = await translateTerm(query.trim(), JP_CHARS.test(query) ? 'en' : 'ja');
          // Misma limpieza que `words`: un ( ) * , % ' " suelto rompe el
          // parser del or(...) de PostgREST → 500.
          const tw = t
            .split(/\s+/)
            .map((w) => w.replace(/[(),.*%'"]/g, ''))
            .filter(Boolean)
            .slice(0, 8);
          if (tw.length) extraGroups = [tw];
        }
        const params = buildParams(extraGroups);
        const db = supaFor(category);
        // count=exact solo cuando hace falta el total (página 1 o entrada
        // directa por URL): contar es lo caro de la query — en páginas
        // siguientes se usa el total ya conocido y la fila extra del limit.
        const wantCount =
          effPage === 1 || lastTotalRef.current?.key !== filtersKey;
        // Vista default de Doujinshi (sin orden, sub ni búsqueda): feed
        // curado "de anime" que intercala las tres subs — Anime (mujeres),
        // Parodias y Originales (hombres) — 8 de cada una por página.
        // Cuando el mix se agota, continúan el resto de las subs.
        if (category === 'doujin' && !pid && !sub && !exCodes.length && !query.trim() && !sort) {
          const DOUJIN_MIX_SUBS = ['11000100', '11000000', '11000001'];
          const restCodes = codesFor(category, '').filter(
            (c) => !DOUJIN_MIX_SUBS.includes(c)
          );
          const per = 8;
          const subParams = (codes, lmt, off) => {
            const p = new URLSearchParams(params);
            p.set(
              'sub',
              codes.length === 1 ? `eq.${codes[0]}` : `in.(${codes.join(',')})`
            );
            p.set('limit', String(lmt));
            p.set('offset', String(off));
            return p;
          };
          const fetchP = (p, prefer) =>
            fetch(`${db.url}/rest/v1/products?${p.toString()}`, {
              signal: controller.signal,
              headers: {
                apikey: db.key,
                Authorization: `Bearer ${db.key}`,
                Prefer: prefer,
              },
            }).then(async (r) => {
              if (r.status === 416) return { rows: [], total: 0 };
              if (!r.ok) throw new Error(`HTTP ${r.status}`);
              const cr = r.headers.get('content-range') || '';
              const total = cr.endsWith('/*') ? null : Number(cr.split('/')[1]) || 0;
              return { rows: await r.json(), total };
            });
          return (async () => {
            // Totales del mix + del resto, cacheados por combinación de
            // filtros: definen en qué página termina el feed intercalado.
            if (mixInfoRef.current?.key !== filtersKey) {
              const rs = await Promise.all([
                ...DOUJIN_MIX_SUBS.map((c) =>
                  fetchP(subParams([c], 1, 0), 'count=exact')
                ),
                ...(restCodes.length
                  ? [fetchP(subParams(restCodes, 1, 0), 'count=exact')]
                  : []),
              ]);
              const totals = rs
                .slice(0, DOUJIN_MIX_SUBS.length)
                .map((r) => r.total || 0);
              mixInfoRef.current = {
                key: filtersKey,
                max: Math.max(...totals, 0),
                sum: totals.reduce((a, b) => a + b, 0),
                rest: restCodes.length
                  ? rs[DOUJIN_MIX_SUBS.length]?.total || 0
                  : 0,
              };
            }
            const mix = mixInfoRef.current;
            const mixPages = Math.ceil(mix.max / per);
            if (effPage <= mixPages) {
              // Frame del mix: 8 slots por sub intercalados; si una sub se
              // agota sus slots quedan vacíos en las páginas finales.
              const results = await Promise.all(
                DOUJIN_MIX_SUBS.map((c) =>
                  fetchP(
                    subParams([c], per + 1, (effPage - 1) * per),
                    'count=none'
                  )
                )
              );
              const lists = results.map((r) => r.rows.slice(0, per));
              const rows = [];
              for (let i = 0; i < per; i++)
                for (const l of lists) if (l[i]) rows.push(l[i]);
              applyResults(
                rows.map(mapRow),
                mix.sum + mix.rest,
                false,
                effPage < mixPages || mix.rest > 0
              );
              return;
            }
            // Mix agotado → el resto de las subs en query normal de a 24.
            if (!restCodes.length) {
              applyResults([], mix.sum, false, false);
              return;
            }
            const restPage = effPage - mixPages;
            const r = await fetchP(
              subParams(restCodes, 25, (restPage - 1) * 24),
              'count=none'
            );
            applyResults(
              r.rows.slice(0, 24).map(mapRow),
              mix.sum + mix.rest,
              false,
              r.rows.length > 24 || restPage * 24 < mix.rest
            );
          })();
        }
        // count=exact puede timeoutear en tablas grandes (500 / 57014):
        // en ese caso se reintenta la misma query sin conteo — la paginación
        // sigue con la fila extra y el último total conocido. Un 500 sin
        // conteo también reintenta una vez: cubre timeouts transitorios.
        const fetchRows = (p, prefer, srcDb = db, isRetry = false) =>
          fetch(`${srcDb.url}/rest/v1/products?${p.toString()}`, {
            signal: controller.signal,
            headers: {
              apikey: srcDb.key,
              Authorization: `Bearer ${srcDb.key}`,
              Prefer: prefer,
            },
          }).then(async (r) => {
            // 416 = offset fuera de rango (página vieja al cambiar filtros o
            // un ?p= alto en la URL): se trata como "sin resultados", no error.
            if (r.status === 416) return { rows: [], total: 0 };
            if (!r.ok && !isRetry) return fetchRows(p, 'count=none', srcDb, true);
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            const cr = r.headers.get('content-range') || '';
            // count=none devuelve '0-24/*' — el total queda desconocido
            const total = cr.endsWith('/*') ? null : Number(cr.split('/')[1]) || 0;
            return { rows: await r.json(), total };
          });
        // 'all' = libros + doujin en dos proyectos Supabase: cada fuente
        // se consulta con los códigos de su árbol y las listas (ya con el
        // mismo order) se mergean. Para la página N hace falta el prefijo
        // offset+25 de cada fuente — una ventana por fuente no alcanza
        // porque los items de una pueden ir todos después de la otra.
        if (category === 'all' && !pid) {
          const sources = ['books', 'doujin']
            .map((src) => ({
              src,
              srcDb: supaFor(src),
              codes: codesForSource(src, sub),
            }))
            // La fuente sin códigos del filtro incluido se saltea.
            .filter((s) => s.srcDb.url && s.srcDb.key && s.codes.length);
          if (!sources.length) {
            applyResults([], 0, false, false);
            return undefined;
          }
          const start = (effPage - 1) * 24;
          const need = start + 25;
          const cmp = cmpForSort(sort);
          // allSettled: si una DB timeoutea se muestran los resultados de
          // la otra en vez de la pantalla de error. Solo falla si las dos
          // caen juntas.
          return Promise.allSettled(
            sources.map(({ src, srcDb, codes }) => {
              const p = new URLSearchParams(params);
              p.set(
                'sub',
                codes.length === 1 ? `eq.${codes[0]}` : `in.(${codes.join(',')})`
              );
              // Exclusiones: solo las de ESTE árbol — las de la otra
              // fuente no aplican acá.
              const ownX = exCodes.flatMap((c) => codesForSource(src, c));
              if (ownX.length) p.append('sub', `not.in.(${ownX.join(',')})`);
              p.set('limit', String(need));
              p.set('offset', '0');
              return fetchRows(p, wantCount ? 'count=exact' : 'count=none', srcDb);
            })
          ).then((settled) => {
            const parts = settled
              .filter((s) => s.status === 'fulfilled')
              .map((s) => s.value);
            if (!parts.length) throw new Error('HTTP 500');
            const lists = parts.map((x) => x.rows);
            const merged = [];
            const idx = lists.map(() => 0);
            for (;;) {
              let best = -1;
              for (let k = 0; k < lists.length; k++) {
                if (idx[k] >= lists[k].length) continue;
                if (best < 0 || cmp(lists[k][idx[k]], lists[best][idx[best]]) < 0)
                  best = k;
              }
              if (best < 0) break;
              merged.push(lists[best][idx[best]++]);
            }
            const pageRows = merged.slice(start, start + 24);
            const total = parts.every((x) => x.total != null)
              ? parts.reduce((a, x) => a + x.total, 0)
              : null;
            if (total != null) lastTotalRef.current = { key: filtersKey, total };
            const inferred =
              start + pageRows.length + (merged.length > start + 24 ? 1 : 0);
            const cached =
              lastTotalRef.current?.key === filtersKey
                ? lastTotalRef.current.total
                : null;
            const knownTotal = total ?? Math.max(cached ?? 0, inferred);
            const more =
              merged.length > start + 24 ||
              effPage * 24 < knownTotal ||
              (total == null && parts.some((x) => x.rows.length === need));
            applyResults(
              pageRows.map(mapRow),
              knownTotal,
              total == null,
              more
            );
          });
        }
        // Lookup por ID en 'all': el producto puede estar en cualquiera de
        // las dos DBs — se prueba primero libros, después doujin.
        if (pid && category === 'all') {
          return (async () => {
            for (const srcDb of [supaFor('books'), supaFor('doujin')]) {
              if (!srcDb.url || !srcDb.key) continue;
              const { rows } = await fetchRows(params, 'count=exact', srcDb);
              if (rows.length) {
                applyResults(rows.slice(0, 24).map(mapRow), rows.length, false, false);
                return;
              }
            }
            applyResults([], 0, false, false);
          })();
        }
        return fetchRows(params, wantCount ? 'count=exact' : 'count=none')
          .then(({ rows, total }) => {
            if (total != null) lastTotalRef.current = { key: filtersKey, total };
            // Sin conteo exacto el total se infiere de las filas: si la
            // página vino corta (<25) el total es offset+filas exacto; si
            // vino llena hay al menos un item más ("más de N"). El total
            // cacheado solo vale para la misma combinación de filtros.
            const n = (rows || []).length;
            const inferred = (effPage - 1) * 24 + Math.min(n, 24) + (n > 24 ? 1 : 0);
            const cached = lastTotalRef.current?.key === filtersKey ? lastTotalRef.current.total : null;
            const knownTotal = total ?? Math.max(cached ?? 0, inferred);
            // AND estricto sin resultados → ampliar con OR, pero solo con
            // palabras significativas: "no", "wa", "of" etc. están en medio
            // millón de títulos romanizados y ensucian todo. Solo si el
            // conteo real dijo 0 — con total desconocido no se asume vacío.
            const orWords = [...new Set([...words, ...aliasWords, ...extraGroups.flat()])].filter(
              (w) => w.length > 2 && !OR_STOPWORDS.has(w.toLowerCase())
            );
            if (total === 0 && !pid && words.length > 1 && orWords.length) {
              const p2 = new URLSearchParams(params);
              p2.delete('title');
              p2.set('or', `(${orWords.map((w) => `title.ilike.*${w}*`).join(',')})`);
              return fetchRows(p2, 'count=exact').then(({ rows: r2, total: t2 }) => ({
                rows: r2,
                total: t2 ?? lastTotalRef.current?.total ?? 0,
                approx: t2 == null,
              }));
            }
            return { rows, total: knownTotal, approx: total == null };
          })
          .then(({ rows, total, approx }) => {
            const more = (rows || []).length > 24;
            const list = (rows || []).slice(0, 24).map(mapRow);
            applyResults(list, total, !!approx, more || effPage * 24 < total);
          });
      };

      // Si el crawler está saturando la DB, Supabase devuelve 500
      // transitorios: dos retries con backoff (1.5s, 3s) suelen alcanzar
      load().catch((err) => {
        if (err.name === 'AbortError' || controller.signal.aborted) return;
        const delays = [1500, 3000];
        const attempt = (i) =>
          setTimeout(() => {
            if (controller.signal.aborted) return;
            load().catch((e2) => {
              if (e2.name === 'AbortError' || controller.signal.aborted) return;
              if (i + 1 < delays.length) attempt(i + 1);
              else onError(e2);
            });
          }, delays[i]);
        attempt(0);
      });
    }
    return () => controller.abort();
  }, [query, category, sub, sub1X, sub2X, year, band, sort, effPage, retryTick]);

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
              <Heading as="h1" color="white" fontSize={{ base: '2xl', md: '4xl' }} fontWeight={600}>
                Catálogo Para Traer a Pedido
              </Heading>
            </Flex>
            <Text color="whiteAlpha.600" fontSize="lg" maxW="xl">
              Buscá libros y doujinshis. Marcá los que te interesen y consultanos
              por Instagram para que los cotizemos!
            </Text>
            <Text color="whiteAlpha.600" fontSize="lg" maxW="xl">
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Enter aplica la búsqueda ya (sin esperar el
                      // debounce), cierra el teclado del celular y
                      // baja hasta los resultados.
                      setQuery(inputValue.trim());
                      e.currentTarget.blur();
                      resultsRef.current?.scrollIntoView({ block: 'start' });
                    }
                  }}
                  placeholder="Buscar... (Se recomienda buscar en Inglés y Japonés)"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  h="52px"
                  fontSize="lg"
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  _hover={{ borderColor: 'pink.400' }}
                  _focus={{ borderColor: 'pink.400', boxShadow: '0 0 0 1px #ec4899' }}
                  borderRadius="xl"
                />
                {inputValue && (
                  <InputRightElement h="100%" w="3rem">
                    <IconButton
                      aria-label="Borrar búsqueda"
                      icon={<FaTimes />}
                      size="sm"
                      variant="ghost"
                      color="whiteAlpha.600"
                      borderRadius="full"
                      _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
                      onClick={() => setInputValue('')}
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              {/* Advertencia: algunos títulos usan nombres distintos en Japón */}
              <Flex
                bg="whiteAlpha.100"
                borderLeft="3px solid"
                borderColor="orange.300"
                borderRadius="md"
                px={3}
                py={2}
                gap={2}
                align="flex-start"
              >
                <Box color="orange.300" mt={0.5} flexShrink={0}>
                  <FaExclamationTriangle size={13} />
                </Box>
                <Text color="whiteAlpha.900" fontSize="md" lineHeight="1.6">
                  Tené en cuenta que algunos libros pueden no aparecer ni
                  en inglés: en Japón a veces usan un nombre distinto al
                  habitual y también hay otros títulos que solo figuran en japonés. Si no
                  lo encontrás, consultanos por Instagram y lo buscamos
                  nosotros.
                </Text>
              </Flex>

              {/* Avisos del catálogo: cada recomendación en su propio
                  recuadro, con texto más grande y más contraste */}
              <VStack align="stretch" spacing={2}>
                {[
                  'Este catálogo muestra solo una parte de lo que podemos conseguir: hay muchísimos más libros disponibles. Si buscás algo puntual que no aparece, consultanos por Instagram — las ediciones normales de mangas y novelas suelen poder traerse todas, por eso no se muestran en el catalogo',
                  'Los rangos de precio son un promedio basado en las últimas veces que el producto estuvo en stock — el precio final puede ser distinto.',
                  'No todo está en stock en Japón: es un catálogo de productos que podemos traer. Al consultarnos te confirmamos disponibilidad y precio final.',
                ].map((note) => (
                  <Flex
                    key={note}
                    bg="whiteAlpha.100"
                    borderLeft="3px solid"
                    borderColor="pink.400"
                    borderRadius="md"
                    px={3}
                    py={2}
                    gap={2}
                    align="flex-start"
                  >
                    <Box color="pink.300" mt={0.5} flexShrink={0}>
                      <FaInfoCircle size={13} />
                    </Box>
                    <Text color="whiteAlpha.900" fontSize="md" lineHeight="1.6" flex={1}>
                      {note}
                    </Text>
                  </Flex>
                ))}
              </VStack>

              {/* Categoría: segmented control. En celular el ancho
                  puede no alcanzar: se compacta y, si aún no entra,
                  scrollea horizontal en vez de cortarse. */}
              <Flex justify="center" maxW="100%">
                <HStack
                  spacing={0}
                  bg="blackAlpha.400"
                  p={1}
                  borderRadius="full"
                  border="1px solid"
                  borderColor="whiteAlpha.100"
                  maxW="100%"
                  overflowX="auto"
                  sx={{
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {CATEGORY_TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      size="md"
                      borderRadius="full"
                      px={{ base: 3, md: 6 }}
                      fontSize={{ base: 'sm', md: 'md' }}
                      flexShrink={0}
                      whiteSpace="nowrap"
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
                        <Badge ml={{ base: 1, md: 2 }} px={{ base: 1.5, md: 2 }} colorScheme="purple" fontSize="xs" borderRadius="full">
                          <Box as="span" display={{ base: 'none', sm: 'inline' }}>Próximamente</Box>
                          <Box as="span" display={{ base: 'inline', sm: 'none' }}>Pronto</Box>
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
                  <Text fontSize="xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    TIPO
                  </Text>
                  <FilterSelect
                    placeholder="Todos"
                    value={sub1}
                    onChange={(v) => {
                      setSub1(v);
                      setSub1X((x) => x.filter((c) => c !== v));
                      setSub2('');
                      setSub2X([]);
                    }}
                    allowExclude
                    excludedValues={sub1X}
                    onToggleExclude={(v) => {
                      if (v === sub1) setSub1('');
                      setSub1X((x) =>
                        x.includes(v) ? x.filter((c) => c !== v) : [...x, v]
                      );
                    }}
                    options={toOptions(sub1Options)}
                  />
                </Box>

                {/* Un solo subtipo (ej. Panfleto) no aporta: el select de
                    tipo ya cubre su código — no se muestra. */}
                {sub2Options.length > 1 && (
                  <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                    <Text fontSize="xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                      SUBTIPO
                    </Text>
                    <FilterSelect
                      placeholder="Todos"
                      value={sub2}
                      onChange={(v) => {
                        setSub2(v);
                        setSub2X((x) => x.filter((c) => c !== v));
                      }}
                      allowExclude
                      excludedValues={sub2X}
                      onToggleExclude={(v) => {
                        if (v === sub2) setSub2('');
                        setSub2X((x) =>
                          x.includes(v) ? x.filter((c) => c !== v) : [...x, v]
                        );
                      }}
                      options={toOptions(sub2Options)}
                    />
                  </Box>
                )}

                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
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
                  <Text fontSize="xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    PRECIO APROX.
                  </Text>
                  <PriceRangeSelect value={band} onChange={setBand} />
                </Box>

                <Box flex={{ base: '1 1 45%', md: '0 0 auto' }}>
                  <Text fontSize="xs" fontWeight={700} letterSpacing="wider" color="whiteAlpha.500" mb={1.5}>
                    ORDEN
                  </Text>
                  <FilterSelect
                    placeholder="Ninguno"
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
                <Text color="whiteAlpha.500" fontSize="md" textAlign="center">
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
                <Text color="whiteAlpha.700" fontSize="xl">
                  No pudimos cargar el catálogo en este momento.
                </Text>
                <Text color="whiteAlpha.500" fontSize="md">
                  Probá de nuevo en unos segundos.
                </Text>
                <Button
                  size="md"
                  colorScheme="pink"
                  variant="outline"
                  mt={2}
                  onClick={() => setRetryTick((t) => t + 1)}
                >
                  Reintentar
                </Button>
              </VStack>
            )}

            {status === 'ok' && items.length === 0 && (
              <VStack py={10} spacing={3} textAlign="center">
                <Text color="whiteAlpha.700" fontSize="xl">
                  {query ? `No hay resultados para “${query}”.` : 'No hay resultados.'}
                </Text>
                <Text color="whiteAlpha.500" fontSize="md">
                  Si no lo encontrás, consultanos por Instagram y lo buscamos nosotros.
                </Text>
              </VStack>
            )}

            {status === 'ok' && items.length > 0 && (
              <>
                <Text color="whiteAlpha.500" fontSize="md" mb={4} textAlign="center">
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
                        _hover={{ borderColor: 'pink.400', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.04)' }}
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
                              <Text fontSize="sm" letterSpacing="wider" textTransform="uppercase">
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
                          {p.priceBand != null && JP_PRICE_BANDS[p.priceBand] ? (
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
                              fontSize={{ base: 'sm', md: 'md' }}
                              boxShadow="md"
                              opacity={0.95}
                            >
                              {JP_PRICE_BANDS[p.priceBand].label}
                            </Badge>
                          ) : (
                            // Sin banda: el origen no recuerda precio para este
                            // item — la consulta confirma el precio real.
                            <Badge
                              position="absolute"
                              top={2}
                              left={2}
                              zIndex={2}
                              bg="gray.600"
                              color="white"
                              borderRadius="full"
                              px={3}
                              py={1}
                              fontWeight="bold"
                              fontSize={{ base: 'sm', md: 'md' }}
                              boxShadow="md"
                              opacity={0.95}
                            >
                              A consultar
                            </Badge>
                          )}
                        </Box>
                        <VStack align="stretch" p={4} spacing={2} flex={1}>
                          {p.subLabel && (
                            <Text
                              fontSize="xs"
                              color="pink.300"
                              fontWeight={700}
                              textTransform="uppercase"
                              letterSpacing="wider"
                              noOfLines={1}
                            >
                              {p.subLabel}
                            </Text>
                          )}
                          <Text
                            color="white"
                            fontSize={{ base: 'md', md: 'lg' }}
                            fontWeight={600}
                            noOfLines={2}
                            lineHeight="1.3"
                          >
                            {p.title}
                          </Text>
                          {p.releaseDate && (
                            <Text fontSize="sm" color="whiteAlpha.600" noOfLines={1} mt="auto">
                              {p.releaseDate}
                            </Text>
                          )}
                          <Button
                            size="md"
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
                    <ButtonGroup variant="outline" spacing={{ base: 1, md: 2 }} colorScheme="pink" size="md">
                      <IconButton
                        icon={<FaChevronLeft />}
                        onClick={() => goToPage(page - 1)}
                        isDisabled={page === 1}
                        aria-label="Página anterior"
                        size="md"
                      />

                      {(() => {
                        const pageButtons = [];
                        pageButtons.push(
                          <Button
                            key={1}
                            onClick={() => goToPage(1)}
                            variant={page === 1 ? 'solid' : 'outline'}
                            colorScheme="pink"
                            size="md"
                          >
                            1
                          </Button>
                        );

                        if (totalPages > 7) {
                          if (page <= 4) {
                            for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="md">{i}</Button>
                              );
                            }
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="md">...</Button>
                            );
                          } else if (page >= totalPages - 3) {
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="md">...</Button>
                            );
                            for (let i = Math.max(2, totalPages - 4); i < totalPages; i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="md">{i}</Button>
                              );
                            }
                          } else {
                            pageButtons.push(
                              <Button key="ellipsis1" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="md">...</Button>
                            );
                            for (let i = page - 2; i <= page + 2; i++) {
                              pageButtons.push(
                                <Button key={i} onClick={() => goToPage(i)} variant={page === i ? 'solid' : 'outline'} colorScheme="pink" size="md">{i}</Button>
                              );
                            }
                            pageButtons.push(
                              <Button key="ellipsis2" isDisabled _hover={{ cursor: 'default' }} variant="ghost" size="md">...</Button>
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
                                size="md"
                              >
                                {i}
                              </Button>
                            );
                          }
                        }

                        // La última página se muestra solo si entra sin
                        // puntos suspensivos: catálogo corto (≤7 páginas)
                        // o cuando ya está al alcance de la ventana actual.
                        if (totalPages <= 7 || page >= totalPages - 3) {
                          pageButtons.push(
                            <Button
                              key={totalPages}
                              onClick={() => goToPage(totalPages)}
                              variant={page === totalPages ? 'solid' : 'outline'}
                              colorScheme="pink"
                              size="md"
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
                        size="md"
                      />
                    </ButtonGroup>
                  </Flex>
                )}

                {/* Aviso de catálogo en crecimiento */}
                <Text
                  color="whiteAlpha.500"
                  fontSize="md"
                  textAlign="center"
                  mt={8}
                  mb={4}
                  px={4}
                >
                  Vamos a ir agregando más libros y doujinshis con el tiempo —
                  el catálogo se actualiza periódicamente.
                </Text>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Barra flotante de consulta múltiple. En celular va anclada a
          la izquierda en dos filas: la columna de botones flotantes
          (carrito + me gusta) ocupa la derecha y tapaba el contenido. */}
      {selectedList.length > 0 && (
        <Flex
          position="fixed"
          bottom={{ base: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)', md: 4 }}
          left={{ base: 3, md: '50%' }}
          transform={{ base: 'none', md: 'translateX(-50%)' }}
          zIndex={1000}
          bg="pink.400"
          border="1px solid"
          borderColor="pink.400"
          borderRadius={{ base: 'xl', md: 'full' }}
          px={{ base: 3, md: 5 }}
          py={3}
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'stretch', md: 'center' }}
          gap={{ base: 2, md: 4 }}
          w={{ base: 'calc(100vw - 100px)', md: 'auto' }}
          maxW={{ md: '92vw' }}
          boxShadow="0 8px 30px rgba(0,0,0,0.55)"
        >
          <Flex align="center" justify="space-between" gap={2}>
            <Text color="white" fontSize="md" fontWeight={600} whiteSpace="nowrap">
              {selectedList.length} seleccionado{selectedList.length > 1 ? 's' : ''}
            </Text>
            <Button
              size="sm"
              variant="ghost"
              color="white"
              borderRadius="full"
              onClick={() => setSelected({})}
              _hover={{ bg: 'whiteAlpha.200' }}
              display={{ base: 'inline-flex', md: 'none' }}
            >
              Limpiar
            </Button>
          </Flex>
          <Button
            size="md"
            bg="white"
            color="pink.600"
            borderRadius="full"
            leftIcon={<FaInstagram />}
            onClick={() => openConsult(selectedList)}
            whiteSpace="nowrap"
            w={{ base: 'full', md: 'auto' }}
            _hover={{ bg: 'pink.50' }}
          >
            Consultar por Instagram
          </Button>
          <Button
            size="md"
            variant="ghost"
            color="white"
            borderRadius="full"
            onClick={() => setSelected({})}
            _hover={{ bg: 'whiteAlpha.200' }}
            display={{ base: 'none', md: 'inline-flex' }}
          >
            Limpiar
          </Button>
        </Flex>
      )}

      {/* Modal de consulta por Instagram (mismo estilo que "Comprar por Instagram") */}
      <Modal isOpen={isConsultOpen} onClose={onConsultClose} isCentered size="lg" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="#2d1e2a" color="white" mx={4} maxH="85vh" overflowY="auto">
          <ModalHeader fontSize="3xl" fontWeight="bold" pb={2}>
            Consultar por Instagram
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={5} align="stretch">
              <Text fontSize="lg" color="whiteAlpha.700">
                Vas a consultar por {consultItems?.length > 1 ? `${consultItems.length} productos` : 'un producto'} del
                catálogo a pedido. Sigue estos sencillos pasos:
              </Text>

              <List spacing={4}>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaClipboard} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 1: Copiar mensaje</Text>
                    <Text fontSize="md" color="whiteAlpha.600">
                      Al hacer clic en el botón, el mensaje con tu consulta se copiará automáticamente.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaInstagram} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 2: Abrir Instagram</Text>
                    <Text fontSize="md" color="whiteAlpha.600">
                      Se abrirá automáticamente el chat de @arkya.store en una nueva pestaña.
                    </Text>
                  </Box>
                </ListItem>
                <ListItem display="flex" alignItems="flex-start">
                  <ListIcon as={FaCheckCircle} color="pink.300" mt={1} fontSize="xl" />
                  <Box flex="1">
                    <Text fontWeight="semibold" mb={1}>Paso 3: Pegar y enviar</Text>
                    <Text fontSize="md" color="whiteAlpha.600">
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
                <Text fontWeight="bold" mb={3} fontSize="lg" color="pink.300">
                  📋 Vista previa del mensaje:
                </Text>
                <Box
                  bg="gray.800"
                  p={3}
                  borderRadius="md"
                  fontSize="md"
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
            top="calc(env(safe-area-inset-top, 0px) + 1rem)"
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
            px={4}
            py={14}
            gap={5}
            overflowY="auto"
            sx={{
              // En celular 100vh cuenta la barra del navegador y el
              // contenido queda más alto que la pantalla: dvh lo corrige.
              '@supports (height: 100dvh)': { minHeight: '100dvh' },
              // Si el contenido desborda, "safe" evita que se recorte
              // arriba dentro del contenedor con scroll.
              justifyContent: 'safe center',
            }}
          >
            {previewItem && (
              <>
                <Image
                  // Versión grande del CDN (game/ es el bucket genérico).
                  // Si no existe, onError cae al thumbnail del card.
                  // Click sobre la foto no cierra; afuera sí (ModalContent).
                  src={previewItem.image?.replace(
                    /pics_webp\/boxart_m\/([a-z0-9]+)m\.jpg\.webp$/,
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
                  maxH={{ base: '55vh', md: '72vh' }}
                  maxW={{ base: '92vw', md: '70vw' }}
                  w="auto"
                  objectFit="contain"
                  borderRadius="lg"
                  boxShadow="0 20px 60px rgba(0,0,0,0.6)"
                />
                <VStack spacing={4} maxW="xl" px={4} onClick={(e) => e.stopPropagation()}>
                  <Text
                    color="white"
                    fontWeight={600}
                    fontSize={{ base: 'lg', md: 'xl' }}
                    textAlign="center"
                    noOfLines={3}
                  >
                    {previewItem.title}
                  </Text>
                  <HStack spacing={3} flexWrap="wrap" justify="center">
                    {previewItem.subLabel && (
                      <Badge bg="whiteAlpha.200" color="white" borderRadius="full" px={4} py={1} fontSize={{ base: 'md', md: 'lg' }}>
                        {previewItem.subLabel}
                      </Badge>
                    )}
                    {previewItem.releaseDate && (
                      <Badge bg="whiteAlpha.300" color="white" borderRadius="full" px={4} py={1} fontSize={{ base: 'md', md: 'lg' }}>
                        {previewItem.releaseDate}
                      </Badge>
                    )}
                    {previewItem.priceBand != null ? (
                      <Badge colorScheme="pink" borderRadius="full" px={4} py={1} fontSize={{ base: 'md', md: 'lg' }}>
                        {JP_PRICE_BANDS[previewItem.priceBand]?.label}
                      </Badge>
                    ) : (
                      <Badge bg="gray.600" color="white" borderRadius="full" px={4} py={1} fontSize={{ base: 'md', md: 'lg' }}>
                        A consultar
                      </Badge>
                    )}
                  </HStack>
                  <HStack spacing={3} flexWrap="wrap" justify="center">
                    <Button
                      size="md"
                      colorScheme="pink"
                      borderRadius="full"
                      leftIcon={<FaInstagram />}
                      onClick={() => {
                        onPreviewClose();
                        openConsult([previewItem]);
                      }}
                    >
                      Consultar por este
                    </Button>
                    <Button
                      size="md"
                      colorScheme="pink"
                      variant={selected[previewItem.id] ? 'solid' : 'outline'}
                      borderRadius="full"
                      onClick={() => toggleSelect(previewItem)}
                    >
                      {selected[previewItem.id] ? 'Quitar de la consulta' : 'Agregar a la consulta'}
                    </Button>
                  </HStack>
                </VStack>
              </>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
