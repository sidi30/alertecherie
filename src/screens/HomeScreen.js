// Écran principal : mon ID (partage), liste des contacts, ajout.
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import ContactCard from '../components/ContactCard';
import AddContactModal from '../components/AddContactModal';
import { colors, radius } from '../theme';
import { lookupUser } from '../firebase';
import { sendRing } from '../lib/push';

export default function HomeScreen({ self, contacts, setContacts, onAddContact, onRemoveContact }) {
  const [showAdd, setShowAdd] = useState(false);
  const [ringingId, setRingingId] = useState(null);

  const shareId = async () => {
    try {
      await Share.share({
        message: `Ajoute-moi sur AlerteCherie pour me faire sonner. Mon identifiant : ${self.id}`,
      });
    } catch {
      // ignore (annulation)
    }
  };

  const copyId = async () => {
    await Clipboard.setStringAsync(self.id);
    Alert.alert('Copié', `Identifiant ${self.id} copié.`);
  };

  const ring = async (contact) => {
    setRingingId(contact.id);
    try {
      // token frais depuis Firestore
      const fresh = await lookupUser(contact.id);
      if (!fresh?.pushToken) {
        Alert.alert('Indisponible', `${contact.prenom || contact.id} n’a pas de notifications actives.`);
        return;
      }
      const res = await sendRing(fresh.pushToken, self.prenom);
      if (res.ok) {
        Alert.alert('Envoyé', `${contact.prenom || contact.id} va sonner.`);
      } else {
        Alert.alert('Échec', res.error || 'Impossible d’envoyer.');
      }
    } catch (e) {
      Alert.alert('Erreur', e?.message || 'Réessaie.');
    } finally {
      setRingingId(null);
    }
  };

  const confirmRemove = (contact) => {
    Alert.alert('Retirer', `Retirer ${contact.prenom || contact.id} de ta liste ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: () => onRemoveContact(contact.id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <View style={styles.topbar}>
        <Text style={styles.appName}>AlerteCherie</Text>
      </View>

      {/* Carte "Mon identifiant" */}
      <View style={styles.selfCard}>
        <Text style={styles.selfLabel}>Mon identifiant</Text>
        <Pressable onPress={copyId}>
          <Text style={styles.selfId}>{self.id}</Text>
        </Pressable>
        <Pressable style={styles.shareBtn} onPress={shareId}>
          <Text style={styles.shareLabel}>Partager mon ID</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Mes proches</Text>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addLabel}>+ Ajouter</Text>
        </Pressable>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>
              Aucun proche. Ajoute l’identifiant de quelqu’un pour pouvoir le faire sonner.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ContactCard
            contact={item}
            onRing={ring}
            ringingBusy={ringingId === item.id}
            onRemove={confirmRemove}
          />
        )}
      />

      <AddContactModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={onAddContact}
        selfId={self.id}
        existingIds={contacts.map((c) => c.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 18 },
  topbar: { paddingTop: 8, paddingBottom: 12 },
  appName: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  selfCard: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  selfLabel: { color: colors.textMuted, fontSize: 13 },
  selfId: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: 8 },
  shareBtn: {
    marginTop: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 100,
  },
  shareLabel: { color: '#fff', fontWeight: '800', fontSize: 15 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  addBtn: {
    backgroundColor: colors.cardBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  addLabel: { color: colors.text, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: colors.textMuted, textAlign: 'center', fontSize: 15, lineHeight: 22 },
});
