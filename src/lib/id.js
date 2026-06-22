// Génération d'un identifiant court lisible (sans caractères ambigus 0/O/1/I).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 6;

export function generateId() {
  let out = '';
  for (let i = 0; i < LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Normalise une saisie utilisateur (maj, trim, retire espaces/tirets). */
export function normalizeId(raw) {
  return (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
