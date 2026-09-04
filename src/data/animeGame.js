// Datos del minijuego "Adivina el Anime" (PixelAnimeGame)

export const GAME_LEVELS = [
  {
    id: 1,
    name: 'Nivel 1 - Muy fácil',
    pixelSize: 15,
    image: '/images/muyfacil6.webp',
    discount: 5,
  },
  {
    id: 2,
    name: 'Nivel 2 - Fácil',
    pixelSize: 20,
    image: '/images/facil6.webp',
    discount: 5,
  },
  {
    id: 3,
    name: 'Nivel 3 - Normal',
    pixelSize: 30,
    image: '/images/normal6.webp',
    discount: 5,
  },
  {
    id: 4,
    name: 'Nivel 4 - Difícil',
    pixelSize: 45,
    image: '/images/dificil6.webp',
    discount: 7,
  },
  {
    id: 5,
    name: 'Nivel 5 - Imposible',
    pixelSize: 40,
    image: '/images/imposible6.webp',
    discount: 10,
  },
];

// Fecha límite del juego actual - EDITABLE
// Formato: 'YYYY-MM-DDTHH:MM:SS' (ej: '2026-07-15T00:00:00')
// Cuando pasa esta fecha, el juego se bloquea y se reinicia para la próxima ronda
export const GAME_DEADLINE = '2026-09-05T03:00:00';

// --- RESPUESTAS DE LA RONDA ANTERIOR ---
// Personalizá imágenes y nombres de la ronda que ya terminó.
// Estas se muestran en la pantalla de "juego terminado".
export const PAST_ROUND_ANSWERS = [
  {
    level: 'Nivel 1 - Muy Fácil',
    image: '/images/muyfacil.webp',
    answer: 'Naruto',
    answerAlt: '',
    color: 'green',
  },
  {
    level: 'Nivel 2 - Fácil',
    image: '/images/facil.webp',
    answer: 'The Promised Neverland',
    answerAlt: 'Yakusoku no Neverland',
    color: 'teal',
  },
  {
    level: 'Nivel 3 - Normal',
    image: '/images/normal.webp',
    answer: 'Elfen Lied',
    answerAlt: '',
    color: 'yellow',
  },
  {
    level: 'Nivel 4 - Difícil',
    image: '/images/dificil.webp',
    answer: 'A Destructive God Sits Next to Me',
    answerAlt: 'Boku no Tonari ni Ankoku Hakaishin ga Imasu',
    color: 'orange',
  },
  {
    level: 'Nivel 5 - Imposible',
    image: '/images/imposible.webp',
    answer: 'Kamitsubaki City Under Construction',
    answerAlt: '',
    color: 'red',
  },
];

// --- HISTORIAL DE RONDAS ---
// Agregá acá todas las rondas pasadas que quieras recordar.
// Cada ronda tiene un id, nombre, fecha límite y las 5 respuestas.
// En la página se ordenan por deadline de más reciente a más antigua.
export const GAME_HISTORY = [
  {
    id: "ronda5",
    name: "Ronda 5 - Julio 2026",
    deadline: "5",
    answers: [
      {
        level: "Nivel 1 - Muy Fácil",
        image: "/images/muyfacil.webp",
        answer: "Naruto",
        answerAlt: "",
        color: "green",
        malUrl: "https://myanimelist.net/anime/20/Naruto",
      },
      {
        level: "Nivel 2 - Fácil",
        image: "/images/facil.webp",
        answer: "The Promised Neverland",
        answerAlt: "Yakusoku no Neverland",
        color: "teal",
        malUrl: "https://myanimelist.net/anime/37779/Yakusoku_no_Neverland",
      },
      {
        level: "Nivel 3 - Normal",
        image: "/images/normal.webp",
        answer: "Elfen Lied",
        answerAlt: "",
        color: "yellow",
        malUrl: "https://myanimelist.net/anime/226/Elfen_Lied",
      },
      {
        level: "Nivel 4 - Difícil",
        image: "/images/dificil.webp",
        answer: "A Destructive God Sits Next to Me",
        answerAlt: "Boku no Tonari ni Ankoku Hakaishin ga Imasu",
        color: "orange",
        malUrl:
          "https://myanimelist.net/anime/38302/Boku_no_Tonari_ni_Ankoku_Hakaishin_ga_Imasu",
      },
      {
        level: "Nivel 5 - Imposible",
        image: "/images/imposible.webp",
        answer: "Kamitsubaki City Under Construction",
        answerAlt: "",
        color: "red",
        malUrl:
          "https://myanimelist.net/anime/57820/Kamitsubaki-shi_Kensetsuchuu",
      },
    ],
  },
  {
    id: "ronda4",
    name: "Ronda 4 - Abril 2026",
    deadline: "4",
    answers: [
      {
        level: "Nivel 1 - Muy Fácil",
        image: "/images/muyfacil4.webp",
        answer: "Frieren",
        answerAlt: "",
        color: "green",
        malUrl: "https://myanimelist.net/anime/52991/Sousou_no_Frieren",
      },
      {
        level: "Nivel 2 - Fácil",
        image: "/images/facil4.webp",
        answer: "Dr. Stone",
        answerAlt: "",
        color: "teal",
        malUrl: "https://myanimelist.net/anime/38691/Dr_Stone",
      },
      {
        level: "Nivel 3 - Normal",
        image: "/images/normal4.webp",
        answer: "Durarara!!",
        answerAlt: "",
        color: "yellow",
        malUrl: "https://myanimelist.net/anime/6746/Durarara",
      },
      {
        level: "Nivel 4 - Difícil",
        image: "/images/dificil4.webp",
        answer: "Akuma no Riddle",
        answerAlt: "",
        color: "orange",
        malUrl: "https://myanimelist.net/anime/19429/Akuma_no_Riddle",
      },
      {
        level: "Nivel 5 - Imposible",
        image: "/images/imposible4.webp",
        answer: "Bus Gamer",
        answerAlt: "",
        color: "red",
        malUrl: "https://myanimelist.net/anime/3389/Bus_Gamer",
      },
    ],
  },
  {
    id: "ronda3",
    name: "Ronda 3 - Enero 2026",
    deadline: "3",
    answers: [
      {
        level: "Nivel 1 - Muy Fácil",
        image: "/images/muyfacil3.webp",
        answer: "Chainsaw Man",
        answerAlt: "Chainsaw Man – The Movie: Reze Arc",
        color: "green",
        malUrl:
          "https://myanimelist.net/anime/57555/Chainsaw_Man_Movie__Reze-hen",
      },
      {
        level: "Nivel 2 - Fácil",
        image: "/images/facil3.webp",
        answer: "Ponyo",
        answerAlt: "",
        color: "teal",
        malUrl: "https://myanimelist.net/anime/2890/Gake_no_Ue_no_Ponyo",
      },
      {
        level: "Nivel 3 - Normal",
        image: "/images/normal3.webp",
        answer: "Kabaneri of the Iron Fortress",
        answerAlt: "Kōtetsujō no Kabaneri",
        color: "yellow",
        malUrl: "https://myanimelist.net/anime/28623/Koutetsujou_no_Kabaneri",
      },
      {
        level: "Nivel 4 - Difícil",
        image: "/images/dificil3.webp",
        answer: "Mahou Shoujo Nante Mouiidesukara",
        answerAlt: "I've Had Enough of Being a Magical Girl",
        color: "orange",
        malUrl:
          "https://myanimelist.net/anime/31793/Mahou_Shoujo_Nante_Mou_Ii_desu_kara",
      },
      {
        level: "Nivel 5 - Imposible",
        image: "/images/imposible3.webp",
        answer: "Fireball",
        answerAlt: "Fireball Charming",
        color: "red",
        malUrl: "https://myanimelist.net/anime/10348/Fireball_Charming",
      },
    ],
  },
  {
    id: "ronda2",
    name: "Ronda 2 - Noviembre 2025",
    deadline: "2",
    answers: [
      {
        level: "Nivel 1 - Muy Fácil",
        image: "/images/muyfacil2.webp",
        answer: "Jujutsu Kaisen",
        answerAlt: "",
        color: "green",
        malUrl: "https://myanimelist.net/anime/40748/Jujutsu_Kaisen",
      },
      {
        level: "Nivel 2 - Fácil",
        image: "/images/facil2.webp",
        answer: "Re:Zero kara Hajimeru Isekai Seikatsu",
        answerAlt: "",
        color: "teal",
        malUrl:
          "https://myanimelist.net/anime/31240/Re_Zero_kara_Hajimeru_Isekai_Seikatsu",
      },
      {
        level: "Nivel 3 - Normal",
        image: "/images/normal2.webp",
        answer: "Kill la Kill",
        answerAlt: "",
        color: "yellow",
        malUrl: "https://myanimelist.net/anime/18679/Kill_la_Kill",
      },
      {
        level: "Nivel 4 - Difícil",
        image: "/images/dificil2.webp",
        answer: "Occultic;Nine",
        answerAlt: "",
        color: "orange",
        malUrl: "https://myanimelist.net/anime/32962/Occultic_Nine",
      },
      {
        level: "Nivel 5 - Imposible",
        image: "/images/imposible2.webp",
        answer: "Lockdown Zone Lv. X",
        answerAlt: "Kankin Kuiki Level X",
        color: "red",
        malUrl: "https://myanimelist.net/anime/59505/Kankin_Kuiki_Level_X",
      },
    ],
  },
  {
    id: "ronda1",
    name: "Ronda 1 - Octubre 2025",
    deadline: "1",
    answers: [
      {
        level: "Nivel 1 - Muy Fácil",
        image: "/images/muyfacil1.webp",
        answer: "Death Note",
        answerAlt: "",
        color: "green",
        malUrl: "https://myanimelist.net/anime/1535/Death_Note",
      },
      {
        level: "Nivel 2 - Fácil",
        image: "/images/facil1.webp",
        answer: "Chainsaw Man",
        answerAlt: "",
        color: "teal",
        malUrl: "https://myanimelist.net/anime/44511/Chainsaw_Man",
      },
      {
        level: "Nivel 3 - Normal",
        image: "/images/normal1.webp",
        answer: "Bungou Stray Dogs",
        answerAlt: "",
        color: "yellow",
        malUrl: "https://myanimelist.net/anime/31478/Bungou_Stray_Dogs",
      },
      {
        level: "Nivel 4 - Difícil",
        image: "/images/dificil1.webp",
        answer: "Kobato",
        answerAlt: "",
        color: "orange",
        malUrl: "https://myanimelist.net/anime/5678/Kobato",
      },
      {
        level: "Nivel 5 - Imposible",
        image: "/images/imposible1.webp",
        answer: "Cat Soup",
        answerAlt: "Nekojiru-sou",
        color: "red",
        malUrl: "https://myanimelist.net/anime/601/Nekojiru-sou",
      },
    ],
  },
];

const ROUND_KEY = 'pixelGameRound';

export const GAME_CONFIG = {
  levelsCount: 5,
  discountPerLevel: 5,
  get maxDiscount() {
    return GAME_LEVELS.reduce((sum, lvl) => sum + (lvl.discount || 0), 0);
  },
  localStorageKey: 'pixelGameProgress',
  submissionsKey: 'pixelGameSubmissions',
  userKey: 'pixelGameUser',
  playedKey: 'pixelGamePlayed',
  roundKey: ROUND_KEY,
  deadline: GAME_DEADLINE,
};

// --- CONFIGURACIÓN GOOGLE FORMS ---
// Mismo patrón que useLikes.js:
// 1. Creá un Google Form con campos: Usuario, Nivel 1, Nivel 2, Nivel 3, Nivel 4, Nivel 5, Respuestas (todo junto)
// 2. Hacé clic en los 3 puntos > Obtener enlace para enviar prellenado.
// 3. Elegí "Obtener enlace" y copiá la URL base (sin parámetros entry).
// 4. Reemplazá los entry.XXX con los IDs reales de tus campos.

const GOOGLE_FORM_BASE_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSd4zxuxYMWOvfIovFL2JLKjuC3T0zRt8xessEHOav9csvUX5g/formResponse";
const ENTRY_1 = "entry.1583645955";   // Nivel 1
const ENTRY_2 = "entry.885633228";    // Nivel 2
const ENTRY_3 = "entry.543856572";     // Nivel 3
const ENTRY_4 = "entry.109907129";     // Nivel 4
const ENTRY_5 = "entry.1015080073";   // Nivel 5
const ENTRY_USER = "entry.428186057";  // Usuario (último)

export function getGameUser() {
  try {
    return localStorage.getItem(GAME_CONFIG.userKey) || '';
  } catch {
    return '';
  }
}

export function setGameUser(user) {
  localStorage.setItem(GAME_CONFIG.userKey, user);
}

export function hasGameBeenPlayed() {
  try {
    const played = localStorage.getItem(GAME_CONFIG.playedKey) === 'true';
    const round = localStorage.getItem(GAME_CONFIG.roundKey);
    // Si no hay round guardado o es diferente al actual, no se jugó esta ronda
    if (round !== GAME_DEADLINE) return false;
    return played;
  } catch {
    return false;
  }
}

export function markGameAsPlayed() {
  try {
    localStorage.setItem(GAME_CONFIG.playedKey, 'true');
    localStorage.setItem(GAME_CONFIG.roundKey, GAME_DEADLINE);
  } catch (e) {
    console.error('Error marcando juego como jugado:', e);
  }
}

// Limpia progreso si cambió la ronda (nueva fecha de juego)
export function clearGameIfNewRound() {
  try {
    const round = localStorage.getItem(GAME_CONFIG.roundKey);
    if (round && round !== GAME_DEADLINE) {
      localStorage.removeItem(GAME_CONFIG.playedKey);
      localStorage.removeItem(GAME_CONFIG.localStorageKey);
      localStorage.removeItem(GAME_CONFIG.userKey);
      localStorage.setItem(GAME_CONFIG.roundKey, GAME_DEADLINE);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error limpiando ronda previa:', e);
    return false;
  }
}

// Guardar progreso actual del juego (mientras juega)
export const saveGameProgress = (progress) => {
  try {
    localStorage.setItem(GAME_CONFIG.localStorageKey, JSON.stringify(progress));
  } catch (e) {
    console.error('Error guardando progreso:', e);
  }
};

// Cargar progreso desde localStorage
export const loadGameProgress = () => {
  try {
    const saved = localStorage.getItem(GAME_CONFIG.localStorageKey);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error cargando progreso:', e);
  }
  return null;
};

// Guardar una submission completa en localStorage (para que el admin la revise)
export const saveGameSubmission = (submission) => {
  try {
    const existing = JSON.parse(localStorage.getItem(GAME_CONFIG.submissionsKey) || '[]');
    existing.push(submission);
    localStorage.setItem(GAME_CONFIG.submissionsKey, JSON.stringify(existing));
  } catch (e) {
    console.error('Error guardando submission:', e);
  }
};

// Cargar todas las submissions
export const loadGameSubmissions = () => {
  try {
    return JSON.parse(localStorage.getItem(GAME_CONFIG.submissionsKey) || '[]');
  } catch (e) {
    console.error('Error cargando submissions:', e);
    return [];
  }
};

// Eliminar una submission
export const deleteGameSubmission = (submissionId) => {
  try {
    const existing = JSON.parse(localStorage.getItem(GAME_CONFIG.submissionsKey) || '[]');
    const filtered = existing.filter(s => s.id !== submissionId);
    localStorage.setItem(GAME_CONFIG.submissionsKey, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error('Error eliminando submission:', e);
    return [];
  }
};

// Enviar respuestas a Google Form (sin esperar respuesta, modo no-cors)
// Mismo patrón que useLikes.js
export const submitToGoogleForm = (answers, user) => {
  if (!GOOGLE_FORM_BASE_URL) {
    console.warn('Google Form no configurado para el juego. Respuestas guardadas solo en localStorage.');
    return false;
  }
  try {
    const url = new URL(GOOGLE_FORM_BASE_URL);

    if (ENTRY_USER) url.searchParams.set(ENTRY_USER, user || 'Anónimo');
    if (ENTRY_1) url.searchParams.set(ENTRY_1, answers[0]?.answer || '');
    if (ENTRY_2) url.searchParams.set(ENTRY_2, answers[1]?.answer || '');
    if (ENTRY_3) url.searchParams.set(ENTRY_3, answers[2]?.answer || '');
    if (ENTRY_4) url.searchParams.set(ENTRY_4, answers[3]?.answer || '');
    if (ENTRY_5) url.searchParams.set(ENTRY_5, answers[4]?.answer || '');

    // Enviar sin esperar respuesta (no-cors para evitar CORS en static hosting)
    fetch(url.toString(), { mode: 'no-cors', method: 'GET' }).catch(() => {});
    return true;
  } catch (e) {
    console.error('Error enviando a Google Form:', e);
    return false;
  }
};
