// Orchestrateur : 1er lancement (id + onboarding + push), écran principal,
// écoute des notifs et écran d'alarme.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import notifee, { EventType } from '@notifee/react-native';

import HomeScreen from './src/screens/HomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import AlarmScreen from './src/screens/AlarmScreen';

import { colors } from './src/theme';
import { generateId } from './src/lib/id';
import {
  getSelf,
  saveSelf,
  getContacts,
  addContact as addContactStore,
  removeContact as removeContactStore,
} from './src/lib/storage';
import { registerForPush } from './src/lib/notifications';
import { registerSelf, idExists } from './src/firebase';
import { playAlarm, stopAlarm } from './src/lib/alarm';
import { showAlarmNotification, stopAlarmNotification } from './src/lib/alarmNotif';

export default function App() {
  const [phase, setPhase] = useState('loading'); // loading | onboarding | ready
  const [self, setSelf] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [alarm, setAlarm] = useState(null); // { from } quand l'alarme sonne

  const recvSub = useRef(null);
  const respSub = useRef(null);
  const handledIds = useRef(new Set()); // dédup : une notif ne sonne qu'une fois

  // ---- Déclenche l'écran d'alarme + son ----
  const triggerAlarm = async (data, id) => {
    if (data?.type !== 'ring') return;
    if (id) {
      if (handledIds.current.has(id)) return;
      handledIds.current.add(id);
    }
    setAlarm({ from: data.from || '' });
    if (Platform.OS === 'android') {
      // Android : la notif full-screen + foreground service jouent le son
      // (audible même en vibreur). On affiche juste l'écran d'alarme.
      await showAlarmNotification(data.from || '');
    } else {
      await playAlarm();
    }
  };

  const stop = async () => {
    // Coupe tout : son, foreground service Android, notif.
    await stopAlarmNotification();
    setAlarm(null);
  };

  // ---- Init ----
  useEffect(() => {
    (async () => {
      const existing = await getSelf();
      if (existing) {
        setSelf(existing);
        setContacts(await getContacts());
        // re-sync token (peut changer après réinstall / update)
        try {
          const token = await registerForPush();
          // Toujours re-écrire l'identité (recrée le doc s'il manque) ;
          // registerSelf n'écrase pas un token existant par null si token est nul.
          await registerSelf(existing.id, { ...existing, pushToken: token });
        } catch (e) {
          // Non bloquant, mais ne pas avaler en silence : un token non resynchronisé
          // = ce user devient injoignable (les proches reçoivent DeviceNotRegistered).
          console.warn('[push] resync échoué :', e?.message || e);
        }
        setPhase('ready');
      } else {
        // génère un id unique
        let id = generateId();
        try {
          for (let i = 0; i < 5 && (await idExists(id)); i++) id = generateId();
        } catch {}
        setPendingId(id);
        setPhase('onboarding');
      }
    })();

    // Écoute des notifs reçues app au 1er plan
    try {
      recvSub.current = Notifications.addNotificationReceivedListener((n) => {
        triggerAlarm(n.request.content.data, n.request.identifier);
      });
    } catch {}
    // Réponse (tap) depuis background / killed
    try {
      respSub.current = Notifications.addNotificationResponseReceivedListener((r) => {
        const req = r.notification.request;
        triggerAlarm(req.content.data, req.identifier);
      });
    } catch {}
    // Cold start via notif : ne déclencher que si la notif est récente (<30 s),
    // sinon un relancement normal rejouerait un ancien tap (faux positif).
    try {
      Notifications.getLastNotificationResponseAsync().then((r) => {
        if (!r) return;
        const req = r.notification.request;
        // `date` est en secondes (iOS) ou millisecondes (Android) selon la plateforme.
        let ts = r.notification.date || 0;
        if (ts > 0 && ts < 1e12) ts *= 1000; // normalise s -> ms
        if (!ts || Date.now() - ts < 30000) triggerAlarm(req.content.data, req.identifier);
      });
    } catch {}

    // notifee (Android) : app ouverte via la notif full-screen -> afficher
    // l'écran d'alarme ; bouton "Arrêter" / appui notif -> stopper / afficher.
    let notifeeUnsub = () => {};
    try {
      notifee.getInitialNotification().then((init) => {
        const d = init?.notification?.data;
        if (d?.type === 'ring') setAlarm({ from: d.from || '' });
      });
      notifeeUnsub = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'stop') {
          stop();
        } else if (type === EventType.PRESS && detail.notification?.data?.type === 'ring') {
          setAlarm({ from: detail.notification.data.from || '' });
        }
      });
    } catch {}

    // iOS seulement : pas de foreground service, on coupe le son si l'app part
    // vraiment en arrière-plan. Android : le service gère la durée -> ne pas couper.
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (Platform.OS === 'ios' && s === 'background') stopAlarm();
    });

    return () => {
      recvSub.current?.remove();
      respSub.current?.remove();
      appStateSub.remove();
      notifeeUnsub();
    };
  }, []);

  // ---- Fin onboarding : permission push + enregistrement Firestore ----
  const finishOnboarding = async ({ prenom, numero }) => {
    setBusy(true);
    const me = { id: pendingId, prenom, numero };
    // Récupère le token push ; un échec (émulateur, refus, Android sans FCM)
    // ne doit PAS empêcher l'inscription Firestore.
    let token = null;
    try {
      token = await registerForPush();
    } catch (e) {
      console.warn('[push] token onboarding échoué :', e?.message || e);
    }
    // Inscrit l'identité quoi qu'il arrive : l'utilisateur doit être trouvable.
    // Le token sera ajouté à la prochaine resync une fois le push disponible.
    try {
      await registerSelf(pendingId, { ...me, pushToken: token });
    } catch (e) {
      console.warn('[firestore] registerSelf onboarding échoué :', e?.message || e);
    }
    await saveSelf(me);
    setSelf(me);
    setContacts(await getContacts());
    setPhase('ready');
    setBusy(false);
  };

  const onAddContact = async (c) => setContacts(await addContactStore(c));
  const onRemoveContact = async (id) => setContacts(await removeContactStore(id));

  // ---- Rendu ----
  if (alarm) {
    return (
      <View style={styles.fill}>
        <StatusBar style="light" />
        <AlarmScreen fromName={alarm.from} onStop={stop} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.fill}>
      <StatusBar style="light" />
      {phase === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}
      {phase === 'onboarding' && (
        <OnboardingScreen id={pendingId} onDone={finishOnboarding} busy={busy} />
      )}
      {phase === 'ready' && self && (
        <HomeScreen
          self={self}
          contacts={contacts}
          setContacts={setContacts}
          onAddContact={onAddContact}
          onRemoveContact={onRemoveContact}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
