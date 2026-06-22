// Premier lancement : prénom (requis) + numéro (optionnel).
// L'identifiant est déjà généré ; la permission notif est demandée juste après.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius } from '../theme';

export default function OnboardingScreen({ id, onDone, busy }) {
  const [prenom, setPrenom] = useState('');
  const [numero, setNumero] = useState('');

  const submit = () => {
    const p = prenom.trim();
    if (!p) return;
    onDone?.({ prenom: p, numero: numero.trim() || null });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.logo}>🔔</Text>
      <Text style={styles.title}>AlerteCherie</Text>
      <Text style={styles.sub}>Fais sonner le téléphone de tes proches.</Text>

      <View style={styles.idBox}>
        <Text style={styles.idLabel}>Ton identifiant</Text>
        <Text style={styles.id}>{id}</Text>
      </View>

      <TextInput
        style={styles.input}
        value={prenom}
        onChangeText={setPrenom}
        placeholder="Ton prénom"
        placeholderTextColor={colors.textMuted}
        maxLength={24}
      />
      <TextInput
        style={styles.input}
        value={numero}
        onChangeText={setNumero}
        placeholder="Ton numéro (optionnel)"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        maxLength={20}
      />

      <Pressable
        style={[styles.btn, (!prenom.trim() || busy) && styles.btnDisabled]}
        onPress={submit}
        disabled={!prenom.trim() || busy}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnLabel}>Commencer</Text>
        )}
      </Pressable>
      <Text style={styles.note}>
        On va te demander l’autorisation des notifications : indispensable pour
        recevoir les sonneries.
      </Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 28,
    justifyContent: 'center',
    gap: 14,
  },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', textAlign: 'center' },
  sub: { color: colors.textMuted, fontSize: 15, textAlign: 'center', marginBottom: 10 },
  idBox: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    alignItems: 'center',
    marginBottom: 6,
  },
  idLabel: { color: colors.textMuted, fontSize: 13 },
  id: { color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: 6 },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 17,
  },
  btn: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  btnDisabled: { opacity: 0.5 },
  btnLabel: { color: '#fff', fontWeight: '800', fontSize: 17 },
  note: { color: colors.textMuted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
