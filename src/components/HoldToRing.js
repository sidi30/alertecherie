// Bouton "Faire sonner" anti-erreur : appui maintenu ~1,5 s avec anneau de
// progression. Un simple tap ne déclenche rien.
import React, { useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius } from '../theme';

const HOLD_MS = 1500;

export default function HoldToRing({ onComplete, disabled, busy }) {
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef(null);
  const [holding, setHolding] = useState(false);

  const start = () => {
    if (disabled || busy) return;
    setHolding(true);
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      setHolding(false);
      progress.setValue(0);
      if (finished) onComplete?.();
    });
  };

  const cancel = () => {
    anim.current?.stop();
    anim.current = null;
    setHolding(false);
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const label = busy
    ? 'Envoi…'
    : holding
    ? 'Maintiens…'
    : 'Faire sonner';

  return (
    <Pressable
      onPressIn={start}
      onPressOut={cancel}
      disabled={disabled || busy}
      style={[styles.btn, (disabled || busy) && styles.btnDisabled]}
    >
      <Animated.View style={[styles.fill, { width: fillWidth }]} />
      <View style={styles.content}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primaryDim,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  fill: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: { fontSize: 18 },
  label: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
