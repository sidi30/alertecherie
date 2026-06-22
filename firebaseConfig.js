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
  apiKey: 'REMPLIR',
  authDomain: 'REMPLIR.firebaseapp.com',
  projectId: 'REMPLIR',
  storageBucket: 'REMPLIR.appspot.com',
  messagingSenderId: 'REMPLIR',
  appId: 'REMPLIR',
};

// Nom de la collection qui mappe identifiant -> { pushToken, prenom, numero }.
export const USERS_COLLECTION = 'users';
