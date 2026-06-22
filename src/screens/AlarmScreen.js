// Plein écran quand un proche te cherche : alarme en boucle + bouton Arrêter.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export default function AlarmScreen({ fromName, onStop }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.ring, { transform: [{ scale: pulse }] }]}>
        <Text style={styles.bell}>🔔</Text>
      </Animated.View>

      <Text style={styles.title}>
        {fromName ? `${fromName} te cherche` : 'Quelqu’un te cherche'}
      </Text>
      <Text style={styles.sub}>Réponds-lui dès que possible.</Text>

      <Pressable style={styles.stop} onPress={onStop}>
        <Text style={styles.stopLabel}>Arrêter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 18,
  },
  ring: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ffffff22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bell: { fontSize: 72 },
  title: { color: '#fff', fontSize: 30, fontWeight: '800', textAlign: 'center' },
  sub: { color: '#ffffffcc', fontSize: 16, textAlign: 'center' },
  stop: {
    marginTop: 30,
    backgroundColor: '#fff',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 100,
  },
  stopLabel: { color: colors.primary, fontSize: 20, fontWeight: '900' },
});
