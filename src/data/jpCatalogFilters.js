// Árbol de subcategorías del catálogo externo (2 niveles).
// parent: categoría toplevel ('books' | 'doujin') para nivel 1,
// o código de la subcategoría padre para nivel 2.

export const JP_CATEGORY_TREE = {
  books: [
    {
      code: '700',
      label: 'Libro',
      children: [
        { code: '70005', label: 'Light novel' },
        { code: '70009', label: 'Novelas' },
        { code: '7000722', label: 'Manga / Anime' },
        { code: '70001', label: 'Guías de juegos' },
        { code: '70004', label: 'Boys Love' },
        { code: '70008', label: 'Photo book' },
        { code: '7000709', label: 'Arte' },
        { code: '70002', label: 'Partituras / música' },
        { code: '7000718', label: 'Política / Economía / Sociedad' },
        { code: '7000714', label: 'Infantil / ilustrados' },
        { code: '7000719', label: 'Hogar / vida cotidiana' },
        { code: '7000706', label: 'Ciencia / Naturaleza' },
        { code: '7000724', label: 'Historia / Geografía' },
        { code: '7000715', label: 'Hobbies / varios' },
        { code: '7000716', label: 'Religión / Filosofía / Autoayuda' },
        { code: '7000708', label: 'Educación / crianza' },
        { code: '7000713', label: 'Industria' },
        { code: '70017', label: 'Ensayos' },
        { code: '7000701', label: 'Computación' },
        { code: '7000712', label: 'Idiomas' },
        { code: '7000710', label: 'Entretenimiento / talentos' },
        { code: '7000703', label: 'Deportes' },
        { code: '7000723', label: 'Cocina / gourmet' },
        { code: '7000717', label: 'Vehículos / transporte' },
        { code: '70012', label: 'Tokusatsu' },
        { code: '7000720', label: 'Adivinación' },
        { code: '70019', label: 'Crítica literaria' },
        { code: '70018', label: 'Poesía' },
        { code: '70010', label: 'Libros extranjeros' },
        { code: '7000721', label: 'Animales / mascotas' },
        { code: '7000705', label: 'Moda' },
        { code: '7000704', label: 'Negocios' },
        { code: '7000702', label: 'Subcultura' },
        { code: '7000711', label: 'Salud / Medicina' },
        { code: '7000700', label: 'Juegos' },
        { code: '70003', label: 'Otros' },
      ],
    },
    {
      code: '701',
      label: 'Cómic',
      children: [
        { code: '70110', label: 'Seinen (B6)' },
        { code: '70109', label: 'Shonen / para chicos' },
        { code: '70108', label: 'Shojo' },
        { code: '70104', label: 'Otros formatos' },
        { code: '70102', label: 'Antología' },
        { code: '70107', label: 'Edición limitada' },
        { code: '70103', label: 'Conbini comic' },
        { code: '70111', label: 'Paperback / bunko' },
        { code: '70106', label: 'Romance' },
        { code: '70101', label: 'Comics americanos' },
        { code: '70105', label: 'BL / para mujeres' },
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
        { code: '70218', label: 'Vehículos' },
        { code: '70205', label: 'Comic magazine' },
        { code: '70206', label: 'Deportes' },
        { code: '70212', label: 'Militaria' },
        { code: '70219', label: 'Seiyuu' },
        { code: '70209', label: 'Moda' },
        { code: '70207', label: 'Digital / tecnología' },
        { code: '70204', label: 'Videojuegos' },
        { code: '70223', label: 'Cocina / gourmet' },
        { code: '70220', label: 'Animales / mascotas' },
        { code: '70221', label: 'Tokusatsu / héroes' },
        { code: '70215', label: 'Ciencia / SF' },
        { code: '70222', label: 'Literatura / novela' },
        { code: '70211', label: 'Misterio / ocultismo' },
        { code: '70224', label: 'Historia / Cultura' },
        { code: '70208', label: 'Pachinko / pachislot' },
        { code: '70217', label: 'Photo book' },
        { code: '70213', label: 'Retro' },
        { code: '70210', label: 'Boys Love' },
        { code: '70200', label: 'Adultos' },
      ],
    },
    {
      code: '703',
      label: 'Panfleto',
      children: [
        { code: '70300', label: 'Mook' },
        { code: '70301', label: 'Panfleto' },
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
