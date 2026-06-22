// Orchestrateur : 1er lancement (id + onboarding + push), écran principal,
// écoute des notifs et écran d'alarme.
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, SafeAreaView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

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
    await playAlarm();
  };

  const stop = async () => {
    await stopAlarm();
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
          if (token) await registerSelf(existing.id, { ...existing, pushToken: token });
        } catch {}
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
    recvSub.current = Notifications.addNotificationReceivedListener((n) => {
      triggerAlarm(n.request.content.data, n.request.identifier);
    });
    // Réponse (tap) depuis background / killed
    respSub.current = Notifications.addNotificationResponseReceivedListener((r) => {
      const req = r.notification.request;
      triggerAlarm(req.content.data, req.identifier);
    });
    // Cold start via notif : ne déclencher que si la notif est récente (<30 s),
    // sinon un relancement normal rejouerait un ancien tap (faux positif).
    Notifications.getLastNotificationResponseAsync().then((r) => {
      if (!r) return;
      const req = r.notification.request;
      // `date` est en secondes (iOS) ou millisecondes (Android) selon la plateforme.
      let ts = r.notification.date || 0;
      if (ts > 0 && ts < 1e12) ts *= 1000; // normalise s -> ms
      if (!ts || Date.now() - ts < 30000) triggerAlarm(req.content.data, req.identifier);
    });

    // Coupe l'alarme si l'app passe en arrière-plan (évite une boucle orpheline).
    const appStateSub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') stopAlarm();
    });

    return () => {
      recvSub.current?.remove();
      respSub.current?.remove();
      appStateSub.remove();
    };
  }, []);

  // ---- Fin onboarding : permission push + enregistrement Firestore ----
  const finishOnboarding = async ({ prenom, numero }) => {
    setBusy(true);
    try {
      const token = await registerForPush();
      const me = { id: pendingId, prenom, numero };
      await registerSelf(pendingId, { ...me, pushToken: token });
      await saveSelf(me);
      setSelf(me);
      setContacts(await getContacts());
      setPhase('ready');
    } catch (e) {
      // Même sans token (émulateur / refus), on continue : l'app reste utilisable
      const me = { id: pendingId, prenom, numero };
      await saveSelf(me);
      setSelf(me);
      setPhase('ready');
    } finally {
      setBusy(false);
    }
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
