// Carte d'un proche : prénom + bouton Appeler + bouton Faire sonner (hold).
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import HoldToRing from './HoldToRing';
import { colors, radius } from '../theme';

export default function ContactCard({ contact, onRing, ringingBusy, onRemove }) {
  const call = async () => {
    if (!contact.numero) {
      Alert.alert('Pas de numéro', `${contact.prenom || contact.id} n’a pas partagé de numéro.`);
      return;
    }
    // Numéro saisi par autrui : on ne garde que chiffres, +, *, #.
    const clean = String(contact.numero).replace(/[^0-9+*#]/g, '');
    if (!clean) {
      Alert.alert('Numéro invalide', 'Ce numéro ne peut pas être appelé.');
      return;
    }
    const url = `tel:${clean}`;
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) {
        Alert.alert('Indisponible', 'Cet appareil ne peut pas passer d’appel.');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Erreur', 'Impossible d’ouvrir le composeur.');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{contact.prenom || contact.id}</Text>
          <Text style={styles.id}>ID {contact.id}</Text>
        </View>
        <Pressable onPress={() => onRemove?.(contact)} hitSlop={10}>
          <Text style={styles.remove}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.callBtn]} onPress={call}>
          <Text style={styles.callIcon}>📞</Text>
          <Text style={styles.callLabel}>Appeler</Text>
        </Pressable>
        <HoldToRing
          onComplete={() => onRing?.(contact)}
          busy={ringingBusy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.text, fontSize: 20, fontWeight: '700' },
  id: { color: colors.textMuted, fontSize: 13, marginTop: 2, letterSpacing: 1 },
  remove: { color: colors.textMuted, fontSize: 18, paddingHorizontal: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.callDim,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  callIcon: { fontSize: 18 },
  callLabel: { color: colors.call, fontSize: 16, fontWeight: '700' },
});
