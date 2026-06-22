// Génère assets/alarm.wav : sirène montante/descendante, bouclable, fort.
// 44.1 kHz, mono, 16-bit PCM, ~2 s. `npm run gen-alarm`.
const fs = require('fs');
const path = require('path');

const SR = 44100;
const DUR = 2.0; // secondes (boucle propre)
const N = Math.floor(SR * DUR);
const AMP = 0.85;

const data = Buffer.alloc(N * 2);
let phase = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  // sirène : fréquence balaye 600 <-> 1100 Hz (triangle sur 0.5 s)
  const m = (t % 0.5) / 0.5; // 0..1
  const sweep = m < 0.5 ? m * 2 : (1 - m) * 2; // 0..1..0
  const freq = 600 + sweep * 500;
  phase += (2 * Math.PI * freq) / SR;
  // enveloppe douce aux bords pour éviter le clic de boucle
  let env = 1;
  const edge = 0.02 * SR;
  if (i < edge) env = i / edge;
  else if (i > N - edge) env = (N - i) / edge;
  const s = Math.sin(phase) * AMP * env;
  data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(s * 32767))), i * 2);
}

function wavHeader(dataLen) {
  const b = Buffer.alloc(44);
  b.write('RIFF', 0);
  b.writeUInt32LE(36 + dataLen, 4);
  b.write('WAVE', 8);
  b.write('fmt ', 12);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20); // PCM
  b.writeUInt16LE(1, 22); // mono
  b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * 2, 28); // byte rate
  b.writeUInt16LE(2, 32); // block align
  b.writeUInt16LE(16, 34); // bits
  b.write('data', 36);
  b.writeUInt32LE(dataLen, 40);
  return b;
}

const out = path.join(__dirname, '..', 'assets', 'alarm.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([wavHeader(data.length), data]));
console.log('Écrit', out, (data.length / 1024).toFixed(1), 'KiB');
