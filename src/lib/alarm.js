// Lecture en boucle du son d'alarme bundlé via expo-av.
import { Audio } from 'expo-av';

let sound = null;
let loading = false; // garde synchrone : empêche 2 createAsync concurrents (fuite)
let safetyTimer = null;

const MAX_MS = 60000; // arrêt de sécurité : ne sonne jamais > 60 s

/** Démarre l'alarme en boucle, volume max. Idempotent + anti-race. */
export async function playAlarm() {
  if (sound || loading) return;
  loading = true;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // l'app est ouverte : on autorise le son
      staysActiveInBackground: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    const { sound: s } = await Audio.Sound.createAsync(
      require('../../assets/alarm.wav'),
      { shouldPlay: true, isLooping: true, volume: 1.0 }
    );
    sound = s;
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
  if (!sound) return;
  const s = sound;
  sound = null;
  try {
    await s.stopAsync();
    await s.unloadAsync();
  } catch {
    // ignore
  }
}
