// Datos del minijuego "Adivina el Anime" (PixelAnimeGame)

export const GAME_LEVELS = [
  {
    id: 1,
    name: 'Nivel 1 - Muy fácil',
    pixelSize: 10,
    image: '/images/muyfacil.webp',
    discount: 5,
  },
  {
    id: 2,
    name: 'Nivel 2 - Fácil',
    pixelSize: 10,
    image: '/images/facil.webp',
    discount: 5,
  },
  {
    id: 3,
    name: 'Nivel 3 - Normal',
    pixelSize: 10,
    image: '/images/normal.webp',
    discount: 5,
  },
  {
    id: 4,
    name: 'Nivel 4 - Difícil',
    pixelSize: 10,
    image: '/images/dificil.webp',
    discount: 5,
  },
  {
    id: 5,
    name: 'Nivel 5 - Imposible',
    pixelSize: 10,
    image: '/images/imposible.webp',
    discount: 10,
  },
];

// Fecha límite del juego actual - EDITABLE
// Formato: 'YYYY-MM-DDTHH:MM:SS' (ej: '2026-07-15T00:00:00')
// Cuando pasa esta fecha, el juego se bloquea y se reinicia para la próxima ronda
export const GAME_DEADLINE = '2026-07-03T00:00:00';

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

const GOOGLE_FORM_BASE_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfPRLSQt1aahTOOER5hUUtlolxvV0WRBss_E9inaajpFzVyRQ/formResponse';
const ENTRY_1 = 'entry.1583645955';   // Nivel 1
const ENTRY_2 = 'entry.885633228';    // Nivel 2
const ENTRY_3 = 'entry.543856572';     // Nivel 3
const ENTRY_4 = 'entry.109907129';     // Nivel 4
const ENTRY_5 = 'entry.1015080073';   // Nivel 5
const ENTRY_USER = 'entry.428186057';  // Usuario (último)

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
