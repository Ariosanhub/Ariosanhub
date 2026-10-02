// Pictogramas pretos (estilo editorial). Cada um é um SVG 100x100 com fill preto.
const svg = (body, cls = "pict") =>
  `<svg class="${cls}" viewBox="0 0 100 100" fill="#141414" aria-hidden="true">${body}</svg>`;

const ui = (body) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="#141414" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const pict = {
  // Duas pessoas conversando com balões
  talk: svg(`
    <circle cx="28" cy="40" r="9"/><path d="M14 82c0-12 6-22 14-22s14 10 14 22z"/>
    <circle cx="72" cy="40" r="9"/><path d="M58 82c0-12 6-22 14-22s14 10 14 22z"/>
    <path d="M34 10h30a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H52l-8 7v-7h-10a6 6 0 0 1-6-6V16a6 6 0 0 1 6-6z"/>`),
  // Calendário
  calendar: svg(`
    <rect x="16" y="22" width="68" height="62" rx="6"/>
    <rect x="22" y="38" width="56" height="40" fill="#fff" rx="2"/>
    <rect x="28" y="12" width="8" height="18" rx="3"/><rect x="64" y="12" width="8" height="18" rx="3"/>
    <rect x="28" y="46" width="10" height="9"/><rect x="45" y="46" width="10" height="9"/><rect x="62" y="46" width="10" height="9"/>
    <rect x="28" y="62" width="10" height="9"/><rect x="45" y="62" width="10" height="9"/>
    <path d="M63 66l4 4 8-9" stroke="#141414" stroke-width="4" fill="none"/>`),
  // Cérebro levantando peso (revisão = musculação da memória)
  brain: svg(`
    <path d="M30 30c0-10 9-16 18-14 4-6 16-6 20 1 9 0 14 8 12 15 6 4 6 14-1 18 1 8-6 14-14 12-4 5-13 5-17 0-8 2-16-4-15-11-7-3-8-13-3-18z"/>
    <path d="M44 22v34M58 22v20M44 38h-8M58 42h8" stroke="#fff" stroke-width="2.5" fill="none"/>
    <rect x="16" y="76" width="68" height="5" rx="2"/><rect x="20" y="66" width="6" height="22" rx="2"/><rect x="74" y="66" width="6" height="22" rx="2"/>`),
  // Pessoa no computador
  desk: svg(`
    <circle cx="30" cy="26" r="8"/><path d="M22 38h14l6 22h14v6H38l-4-14-4 30h-8z"/>
    <rect x="56" y="22" width="30" height="22" rx="2"/><rect x="60" y="26" width="22" height="14" fill="#fff"/>
    <circle cx="71" cy="33" r="4"/><rect x="69" y="44" width="4" height="8"/><rect x="48" y="52" width="44" height="4"/>
    <rect x="80" y="56" width="4" height="30"/>`),
  // Globo com balão (vender pro mundo / idiomas)
  globe: svg(`
    <circle cx="46" cy="54" r="30"/>
    <path d="M16 54h60M46 24c-12 14-12 46 0 60M46 24c12 14 12 46 0 60M22 38h48M22 70h48" stroke="#fff" stroke-width="3" fill="none"/>
    <path d="M62 8h26a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4h-6l-6 6v-6H62a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4z"/>`),
  // Sol com raios-pessoa (rotina / lifestyle)
  sun: svg(`
    <circle cx="50" cy="50" r="18"/>
    <g stroke="#141414" stroke-width="6" stroke-linecap="round">
      <path d="M50 8v14M50 78v14M8 50h14M78 50h14M20 20l10 10M70 70l10 10M80 20L70 30M30 70L20 80"/>
    </g>`),
  // Escalada (progresso / fluência)
  climb: svg(`
    <rect x="30" y="6" width="40" height="5"/><rect x="48" y="6" width="4" height="88"/>
    <circle cx="60" cy="26" r="6"/><path d="M52 34l10 2 6 12-4 2-6-8-4 14 8 10-4 3-10-11z"/>
    <circle cx="40" cy="58" r="5"/><path d="M46 64l-8 4-4 12 4 1 4-8 4 8 4-2-4-10z"/>`),
  // Coração com raios (motivação)
  heart: svg(`
    <path d="M50 80L22 52c-8-8-8-20 0-27 7-6 18-5 24 2l4 4 4-4c6-7 17-8 24-2 8 7 8 19 0 27z"/>
    <g stroke="#141414" stroke-width="5" stroke-linecap="round"><path d="M50 4v8M14 16l6 6M86 16l-6 6"/></g>`),
  // Livro aberto
  book: svg(`
    <path d="M10 24c14-6 28-4 38 4v58c-10-8-24-10-38-4z"/>
    <path d="M90 24c-14-6-28-4-38 4v58c10-8 24-10 38-4z"/>
    <path d="M18 38c8-2 16-1 22 3M18 50c8-2 16-1 22 3M60 41c6-4 14-5 22-3M60 53c6-4 14-5 22-3" stroke="#fff" stroke-width="3" fill="none"/>`),
  // Fone de ouvido
  headphones: svg(`
    <path d="M16 60V50a34 34 0 0 1 68 0v10" stroke="#141414" stroke-width="8" fill="none"/>
    <rect x="12" y="56" width="18" height="30" rx="6"/><rect x="70" y="56" width="18" height="30" rx="6"/>`),
  // Chama (streak)
  flame: svg(`<path d="M50 6c4 18 24 26 24 50a24 24 0 0 1-48 0c0-12 6-18 10-24 2 8 6 12 10 12-2-14 0-26 4-38z"/>
    <path d="M50 52c3 8 12 10 12 22a12 12 0 0 1-24 0c0-6 4-10 6-12 1 4 3 6 5 6-1-6 0-12 1-16z" fill="#fff"/>`),
};

export const icon = {
  home: ui(`<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>`),
  chat: ui(`<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>`),
  plan: ui(`<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`),
  review: ui(`<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>`),
  words: ui(`<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M8 9h8M8 13h6"/>`),
  mic: ui(`<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>`),
  send: ui(`<path d="M4 12l16-8-6 16-2-6z"/>`),
  speaker: ui(`<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>`),
  logout: ui(`<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l4-4-4-4M14 12H3"/>`),
};

export const logo = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true">
  <rect width="32" height="32" rx="8" fill="#fab9a8"/>
  <path d="M8 9h13a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-6l-5 4v-4H8a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3z" fill="#141414"/>
  <circle cx="11" cy="15" r="1.6" fill="#fab9a8"/><circle cx="15" cy="15" r="1.6" fill="#fab9a8"/><circle cx="19" cy="15" r="1.6" fill="#fab9a8"/>
</svg>`;
