// Sonnerie intrusive Android via notifee.
// - Notif "full-screen intent" : lance l'écran d'alarme automatiquement, même
//   téléphone verrouillé (comme un appel entrant), sans tap.
// - Foreground service : garde le process vivant et joue l'alarme via expo-audio
//   sur le flux média -> AUDIBLE même en mode vibreur/silencieux (le son de notif
//   classique, lui, est coupé par le vibreur).
// - Bouton "Arrêter" dans la notif + écran d'alarme -> stoppe tout.
// iOS n'a pas de full-screen intent ; il garde le chemin expo-notifications.
import { Platform } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidCategory,
  AndroidVisibility,
} from '@notifee/react-native';
import { playAlarm, stopAlarm } from './alarm';

export const NOTIFEE_CHANNEL_ID = 'alarm-notifee';
const NOTIF_ID = 'ring-alarm';

let resolveService = null;

/**
 * Enregistre le foreground service (à appeler UNE fois, au plus tôt, dans index.js).
 * Tant que la promesse n'est pas résolue, le service tourne et l'alarme joue.
 */
export function registerAlarmForegroundService() {
  if (Platform.OS !== 'android') return;
  notifee.registerForegroundService(() => {
    return new Promise((resolve) => {
      resolveService = resolve;
      playAlarm().catch(() => {});
    });
  });
}

export async function ensureAlarmNotifChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: NOTIFEE_CHANNEL_ID,
    name: 'Alerte sonnerie',
    importance: AndroidImportance.HIGH,
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    bypassDnd: true,
    visibility: AndroidVisibility.PUBLIC,
  });
}

/** Affiche la notif full-screen + démarre le service (= son immédiat). */
export async function showAlarmNotification(fromName) {
  if (Platform.OS !== 'android') return;
  await ensureAlarmNotifChannel();
  await notifee.displayNotification({
    id: NOTIF_ID,
    title: `${fromName || 'Quelqu’un'} te cherche`,
    body: 'Ouvre l’app ou appuie sur Arrêter.',
    data: { type: 'ring', from: fromName || '' },
    android: {
      channelId: NOTIFEE_CHANNEL_ID,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      asForegroundService: true,
      ongoing: true,
      autoCancel: false,
      // Lance l'activité même verrouillé, sans tap.
      fullScreenAction: { id: 'default', launchActivity: 'default' },
      pressAction: { id: 'default', launchActivity: 'default' },
      actions: [{ title: 'Arrêter', pressAction: { id: 'stop' } }],
    },
  });
}

/** Arrête tout : son, foreground service, notif. */
export async function stopAlarmNotification() {
  try {
    await stopAlarm();
  } catch {}
  if (resolveService) {
    resolveService();
    resolveService = null;
  }
  if (Platform.OS === 'android') {
    try {
      await notifee.stopForegroundService();
    } catch {}
    try {
      await notifee.cancelNotification(NOTIF_ID);
    } catch {}
  }
}
