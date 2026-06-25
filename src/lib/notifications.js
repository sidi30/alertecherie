// Permissions, canal Android haute priorité, récupération du push token Expo.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export const ALARM_CHANNEL_ID = 'alarm';

// Affichage quand une notif arrive app au premier plan.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    // false : au 1er plan c'est playAlarm() (expo-audio) qui joue le son en boucle.
    // Laisser true ferait jouer 2 sons en même temps (canal + alarme).
    shouldPlaySound: false,
    shouldSetBadge: false,
    // SDK 52+ : champs iOS list/banner
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Crée le canal Android "alarm" :
 * - IMPORTANCE MAX (heads-up + son)
 * - son custom bundlé (alarm.wav)
 * - bypassDnd: sonne même en "Ne pas déranger" (nécessite l'accès politique DND)
 * iOS ignore les canaux ; le contournement du silencieux y est impossible
 * sans l'entitlement Critical Alerts -> notif standard (respecte le silencieux).
 */
export async function ensureAlarmChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
    name: 'Alerte sonnerie',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'alarm.wav',
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    lightColor: '#FF3B6B',
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableVibrate: true,
  });
}

/**
 * Demande la permission notifications + récupère le token Expo Push.
 * @returns {string|null} expoPushToken
 */
export async function registerForPush() {
  await ensureAlarmChannel();

  if (!Device.isDevice) {
    // Un émulateur ne reçoit pas de push réel.
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const tokenResp = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined
  );
  return tokenResp.data;
}
