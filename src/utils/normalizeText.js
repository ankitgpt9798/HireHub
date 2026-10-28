// Lowercases text and strips accents, so "Montréal" and "MONTREAL" both become "montreal".
export function normalizeText(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
