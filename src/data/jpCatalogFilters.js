// Árbol de subcategorías del catálogo externo (2 niveles).
// parent: categoría toplevel ('books' | 'doujin') para nivel 1,
// o código de la subcategoría padre para nivel 2.

export const JP_CATEGORY_TREE = {
  books: [
    {
      code: '700',
      label: 'Libro',
      // Subcategorías excluidas por decisión de la tienda (novelas, BL,
      // académicas, etc.): solo se muestran las de interés del público.
      children: [
        { code: '7000722', label: 'Manga / Anime' },
        { code: '70001', label: 'Guías de juegos' },
        { code: '70008', label: 'Photo book' },
        { code: '7000709', label: 'Arte' },
        { code: '70002', label: 'Partituras / música' },
        { code: '7000714', label: 'Infantil / ilustrados' },
        { code: '7000719', label: 'Hogar / vida cotidiana' },
        { code: '7000715', label: 'Hobbies / varios' },
        { code: '7000701', label: 'Computación' },
        { code: '7000710', label: 'Entretenimiento / talentos' },
        { code: '7000723', label: 'Cocina / gourmet' },
        { code: '70012', label: 'Tokusatsu' },
        { code: '7000721', label: 'Animales / mascotas' },
        { code: '7000705', label: 'Moda' },
        { code: '7000700', label: 'Juegos' },
        { code: '70003', label: 'Otros' },
      ],
    },
    {
      code: '701',
      label: 'Cómic',
      // Solo antologías y ediciones limitadas
      children: [
        { code: '70102', label: 'Antología' },
        { code: '70107', label: 'Edición limitada' },
      ],
    },
    {
      code: '702',
      label: 'Revista',
      children: [
        { code: '70202', label: 'Hobby / juguetes' },
        { code: '70203', label: 'Cultura / Entretenimiento' },
        { code: '70216', label: 'Entretenimiento' },
        { code: '70214', label: 'Música' },
        { code: '70201', label: 'Anime' },
        { code: '70205', label: 'Comic magazine' },
        { code: '70212', label: 'Militaria' },
        { code: '70219', label: 'Seiyuu' },
        { code: '70209', label: 'Moda' },
        { code: '70207', label: 'Digital / tecnología' },
        { code: '70204', label: 'Videojuegos' },
        { code: '70220', label: 'Animales / mascotas' },
        { code: '70221', label: 'Tokusatsu / héroes' },
        { code: '70222', label: 'Literatura / novela' },
        { code: '70211', label: 'Misterio / ocultismo' },
        { code: '70217', label: 'Photo book' },
      ],
    },
    {
      code: '703',
      label: 'Panfleto',
      // Solo los subtipos de interés (verificados: devuelven productos)
      children: [
        { code: '7030000', label: 'Mook' },
        { code: '7030103', label: 'Panfleto' },
      ],
    },
  ],
  // Solo se expone Doujin magazine (la tienda no importa software ni goods)
  doujin: [
    {
      code: '1100',
      label: 'Doujin magazine',
      children: [
        { code: '110001', label: 'Para mujeres' },
        { code: '110000', label: 'Para hombres' },
      ],
    },
  ],
};

// Set con todos los códigos válidos (nivel 1 + nivel 2) para validar requests
export const JP_SUBCATEGORY_CODES = new Set(
  Object.values(JP_CATEGORY_TREE)
    .flat()
    .flatMap((s) => [s.code, ...s.children.map((c) => c.code)])
);

// Rangos de año tal como los publica el sitio origen
export const JP_YEAR_RANGES = [
  '{,2010]',
  '[2011, 2012]',
  '[2013, 2014]',
  '[2015, 2016]',
  '[2017, 2018]',
  '[2019, 2020]',
  '[2021, 2022]',
  '[2023, 2024]',
  '[2025, 2026]',
];

// Bandas de precio en JPY. El crawler splitea los listados capeados por
// estos rangos (el origen recuerda el último precio incluso de items sin
// stock) y guarda price_band = índice de este array en cada fila.
export const JP_PRICE_BANDS = [
  { range: '-300', label: 'Hasta ¥300 · ~$15–35 mil', ars: '~$15–35 mil' },
  { range: '301-700', label: '¥301–700 · ~$15–45 mil', ars: '~$15–45 mil' },
  { range: '701-1200', label: '¥701–1.200 · ~$25–45 mil', ars: '~$25–45 mil' },
  { range: '1201-2500', label: '¥1.201–2.500 · ~$35–70 mil', ars: '~$35–70 mil' },
  { range: '2501-5000', label: '¥2.501–5.000 · ~$55–100 mil', ars: '~$55–100 mil' },
  { range: '5001-', label: '+¥5.000 · desde ~$90 mil', ars: 'desde ~$90 mil' },
];
