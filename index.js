import { registerRootComponent } from 'expo';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import notifee, { EventType } from '@notifee/react-native';

import App from './App';
import {
  registerAlarmForegroundService,
  showAlarmNotification,
  stopAlarmNotification,
} from './src/lib/alarmNotif';

// 1) Foreground service notifee : joue l'alarme tant que le service tourne.
//    À enregistrer au plus tôt (avant le rendu de l'app).
registerAlarmForegroundService();

// 2) Action "Arrêter" quand la notif est touchée app en fond / tuée.
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
    await stopAlarmNotification();
  }
});

// 3) Réception d'un push "ring" quand l'app est en arrière-plan / tuée (Android,
//    data-only) -> on construit la notif full-screen + son.
const BG_TASK = 'ALARM_BACKGROUND_NOTIFICATION';
TaskManager.defineTask(BG_TASK, async ({ data, error }) => {
  if (error) return;
  // Selon la plateforme/version, la charge utile peut arriver sous plusieurs formes.
  const payload =
    data?.notification?.request?.content?.data ||
    data?.notification?.data ||
    data?.data ||
    data ||
    {};
  if (payload?.type === 'ring') {
    await showAlarmNotification(payload.from || '');
  }
});
Notifications.registerTaskAsync(BG_TASK).catch(() => {});

registerRootComponent(App);
