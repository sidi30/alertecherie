// Modale "Ajouter" : saisir/coller l'identifiant d'un proche -> lookup Firestore.
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors, radius } from '../theme';
import { lookupUser } from '../firebase';
import { normalizeId } from '../lib/id';

export default function AddContactModal({ visible, onClose, onAdd, selfId, existingIds }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setValue('');
    setError('');
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose?.();
  };

  const paste = async () => {
    const txt = await Clipboard.getStringAsync();
    if (txt) setValue(normalizeId(txt));
  };

  const submit = async () => {
    const id = normalizeId(value);
    setError('');
    if (id.length < 4) return setError('Identifiant trop court.');
    if (id === selfId) return setError('C’est ton propre identifiant.');
    if (existingIds?.includes(id)) return setError('Déjà dans ta liste.');

    setLoading(true);
    try {
      const user = await lookupUser(id);
      if (!user) {
        setError('Aucun proche avec cet identifiant.');
      } else {
        onAdd?.({ id: user.id, prenom: user.prenom, numero: user.numero });
        close();
      }
    } catch (e) {
      setError('Erreur réseau / Firebase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Ajouter un proche</Text>
          <Text style={styles.sub}>Saisis ou colle son identifiant.</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(t) => setValue(normalizeId(t))}
              placeholder="EX. A3F9K2"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
            />
            <Pressable style={styles.pasteBtn} onPress={paste}>
              <Text style={styles.pasteLabel}>Coller</Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.btns}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={close}>
              <Text style={styles.cancelLabel}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.add]} onPress={submit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addLabel}>Ajouter</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#0009' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 24,
    paddingBottom: 40,
    gap: 14,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 20,
    letterSpacing: 4,
    fontWeight: '700',
  },
  pasteBtn: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.cardBorder,
  },
  pasteLabel: { color: colors.text, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 14 },
  btns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { backgroundColor: colors.cardBorder },
  cancelLabel: { color: colors.text, fontWeight: '700', fontSize: 16 },
  add: { backgroundColor: colors.primary },
  addLabel: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
