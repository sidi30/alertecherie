// ============================================================================
//  CONFIG FIREBASE — À REMPLIR
// ----------------------------------------------------------------------------
//  1. Console Firebase → crée un projet → "Ajouter une application Web (</>)".
//  2. Copie l'objet firebaseConfig ci-dessous (apiKey, etc.).
//  3. Firestore Database → "Créer une base" en mode production.
//  4. Règles Firestore minimales (onglet "Règles") — voir README section Firebase.
//
//  NB : ces clés Web ne sont PAS des secrets (elles sont visibles côté client).
//  La sécurité vient des règles Firestore, pas du masquage de la clé.
// ============================================================================

export const firebaseConfig = {
  apiKey: 'AIzaSyCIqvq3c6Ohk_lnZvqo4GASwi_r4S_dd8Q',
  authDomain: 'diaspora-connect-c8473.firebaseapp.com',
  projectId: 'diaspora-connect-c8473',
  storageBucket: 'diaspora-connect-c8473.firebasestorage.app',
  messagingSenderId: '958624990787',
  appId: '1:958624990787:web:624e03b64f00a9425b36f6',
  measurementId: 'G-C7CD9VY3C1',
};

// Nom de la collection qui mappe identifiant -> { pushToken, prenom, numero }.
export const USERS_COLLECTION = 'users';
