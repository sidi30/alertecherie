// Persistance locale : mon identité + ma liste de contacts.
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELF_KEY = '@alertcherie/self';
const CONTACTS_KEY = '@alertcherie/contacts';

/** { id, prenom, numero } de l'utilisateur courant, ou null au 1er lancement. */
export async function getSelf() {
  const raw = await AsyncStorage.getItem(SELF_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function saveSelf(self) {
  await AsyncStorage.setItem(SELF_KEY, JSON.stringify(self));
}

/** Liste de contacts : [{ id, prenom, numero }]. */
export async function getContacts() {
  const raw = await AsyncStorage.getItem(CONTACTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveContacts(contacts) {
  await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

/** Ajoute un contact (dédup par id). Retourne la nouvelle liste. */
export async function addContact(contact) {
  const contacts = await getContacts();
  if (contacts.some((c) => c.id === contact.id)) return contacts;
  const next = [...contacts, contact];
  await saveContacts(next);
  return next;
}

/** Supprime un contact par id. Retourne la nouvelle liste. */
export async function removeContact(id) {
  const contacts = await getContacts();
  const next = contacts.filter((c) => c.id !== id);
  await saveContacts(next);
  return next;
}
