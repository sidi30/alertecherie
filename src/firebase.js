// Accès Firestore : enregistrement de soi + lookup d'un proche par identifiant.
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig, USERS_COLLECTION } from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Enregistre / met à jour le doc de l'utilisateur courant.
 * docId = identifiant court (ex. "A3F9K2").
 */
export async function registerSelf(id, { pushToken, prenom, numero }) {
  const ref = doc(db, USERS_COLLECTION, id);
  const data = {
    prenom: prenom ?? null,
    numero: numero ?? null,
    updatedAt: serverTimestamp(),
  };
  // N'inclure pushToken que si on en a un : l'identité reste enregistrée même
  // sans token (Android sans FCM, refus de permission), et une resync sans
  // token n'écrase pas un token déjà valide par null.
  if (pushToken) data.pushToken = pushToken;
  await setDoc(ref, data, { merge: true });
}

/** Vrai si l'identifiant est déjà pris (pour éviter les collisions). */
export async function idExists(id) {
  const snap = await getDoc(doc(db, USERS_COLLECTION, id));
  return snap.exists();
}

/**
 * Cherche un proche par identifiant.
 * @returns {null | { id, pushToken, prenom, numero }}
 */
export async function lookupUser(id) {
  const snap = await getDoc(doc(db, USERS_COLLECTION, id));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id,
    pushToken: data.pushToken ?? null,
    prenom: data.prenom ?? null,
    numero: data.numero ?? null,
  };
}
