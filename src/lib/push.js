// Envoi d'une notification via l'API Expo Push, directement depuis l'app.
// Pas de serveur. Le routing se fait via le token récupéré dans Firestore.
import { ALARM_CHANNEL_ID } from './notifications';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Fait sonner l'appareil cible.
 * @param {string} toToken  expoPushToken du destinataire
 * @param {string} fromName prénom de l'émetteur (affiché dans la notif)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function sendRing(toToken, fromName) {
  if (!toToken) return { ok: false, error: 'Aucun token pour ce contact.' };

  const message = {
    to: toToken,
    title: `${fromName || 'Quelqu’un'} te cherche`,
    body: 'Appuie pour ouvrir et arrêter l’alarme.',
    sound: 'default', // iOS : son standard (respecte le silencieux)
    priority: 'high',
    channelId: ALARM_CHANNEL_ID, // Android : canal alarme bypassDnd
    // data lue à la réception pour déclencher l'écran alarme
    data: { type: 'ring', from: fromName || '' },
    // Android : remonte en heads-up
    _displayInForeground: true,
  };

  // Timeout : sans ça, une requête peut bloquer le bouton "Envoi…" à l'infini.
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
      signal: ctrl.signal,
    });
    const json = await res.json();

    if (json?.errors?.length) {
      return { ok: false, error: json.errors[0]?.message || 'Erreur Expo Push.' };
    }

    // Le endpoint single renvoie { data: { status: 'ok' | 'error', details } }.
    const ticket = json?.data;
    if (!ticket || ticket.status !== 'ok') {
      const code = ticket?.details?.error; // ex. DeviceNotRegistered
      const reason =
        code === 'DeviceNotRegistered'
          ? 'Ce contact n’a plus de notifications actives (réinstall ?).'
          : ticket?.message || 'Notification refusée par Expo.';
      return { ok: false, error: reason, code };
    }
    return { ok: true };
  } catch (e) {
    if (e?.name === 'AbortError') return { ok: false, error: 'Délai dépassé.' };
    return { ok: false, error: e?.message || 'Réseau indisponible.' };
  } finally {
    clearTimeout(timer);
  }
}
