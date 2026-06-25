// Lecture en boucle du son d'alarme bundlé via expo-audio.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

let player = null;
let loading = false; // garde synchrone : empêche 2 démarrages concurrents (fuite)
let safetyTimer = null;

const MAX_MS = 60000; // arrêt de sécurité : ne sonne jamais > 60 s

/** Démarre l'alarme en boucle, volume max. Idempotent + anti-race. */
export async function playAlarm() {
  if (player || loading) return;
  loading = true;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true, // l'app est ouverte : on autorise le son
      shouldPlayInBackground: true,
      interruptionModeAndroid: 'doNotMix', // ne pas baisser/ducker
      shouldRouteThroughEarpiece: false,
    });
    const p = createAudioPlayer(require('../../assets/alarm.wav'));
    p.loop = true;
    p.volume = 1.0;
    p.play();
    player = p;
    safetyTimer = setTimeout(() => {
      stopAlarm();
    }, MAX_MS);
  } finally {
    loading = false;
  }
}

/** Arrête et libère le son. */
export async function stopAlarm() {
  if (safetyTimer) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
  if (!player) return;
  const p = player;
  player = null;
  try {
    p.pause();
    p.remove();
  } catch {
    // ignore
  }
}
