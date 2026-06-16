import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ClinicalTooltip from './ClinicalTooltip';
import { useTheme, spacing, typography } from '../../theme';

/**
 * Subcomponente animado para cada insignia individual.
 * Realiza un spring de escala y una rotación de 360 grados concéntrica al pulsarlo.
 */
function BadgeItem({ badge, onPress }) {
  const { colors, isDark } = useTheme();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {
      // Fallback silencioso en simuladores o Expo Go
    }
  };

  const handlePress = () => {
    triggerHaptic();
    
    // Secuencia de animación combinada: escala spring + rotación 360 grados
    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.92,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 220,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    if (onPress) {
      // Retraso intencional para permitir ver la rotación de la insignia antes de desplegar el modal informativo
      setTimeout(() => {
        onPress(badge);
      }, 180);
    }
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const tooltipInfo = `${badge.detail}\n\nNota Médica: ${badge.medicalFact}`;

  return (
    <Animated.View style={[styles.badgeWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <ClinicalTooltip
        title={badge.title}
        value={badge.unlocked ? 'LOGRO DESBLOQUEADO' : 'LOGRO BLOQUEADO'}
        clinicalInfo={tooltipInfo}
      >
        <Pressable
          onPress={handlePress}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel={`Insignia ${badge.title}. Estado: ${badge.unlocked ? 'Desbloqueado' : 'Bloqueado'}. Mantén presionado para ver información clínica.`}
        >
          {badge.unlocked ? (
            <LinearGradient
              colors={badge.color}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGlowContainer}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name={badge.icon} size={28} color="#FFFFFF" />
              </Animated.View>
              <Text style={styles.badgeTitleUnlocked} allowFontScaling numberOfLines={1}>
                {badge.title}
              </Text>
              <View style={styles.unlockedTag}>
                <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                <Text style={styles.unlockedTagText}>COMPLETO</Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.badgeLockedContainer, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }]}>
              <View style={styles.lockIconWrap}>
                <Ionicons name="lock-closed" size={20} color={colors.textPlaceholder} />
              </View>
              <Text style={styles.badgeTitleLocked} allowFontScaling numberOfLines={1}>
                {badge.title}
              </Text>
              
              {/* Barra de progreso visual */}
              <View style={styles.badgeProgressBar}>
                <View
                  style={[
                    styles.badgeProgressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(badge.progress / badge.target) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.badgeProgressLabel} allowFontScaling>
                {badge.progressLabel}
              </Text>
            </View>
          )}
        </Pressable>
      </ClinicalTooltip>
    </Animated.View>
  );
}

/**
 * Sistema de gamificación de insignias de la Fase 3.
 * Muestra una cuadrícula fluida de logros obtenidos a partir del historial del paciente.
 */
export default function BadgeSystem({ badges = [], onBadgePress }) {
  return (
    <View style={styles.container}>
      <Text style={styles.badgesCardHint} allowFontScaling>
        Completa hábitos saludables para desbloquear insignias clínicas
      </Text>
      
      <View style={styles.badgesGrid}>
        {badges.map((badge) => (
          <BadgeItem
            key={badge.id}
            badge={badge}
            onPress={onBadgePress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  badgesCardHint: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(120, 130, 150, 0.85)',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badgeWrapper: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  pressable: {
    width: '100%',
  },
  badgeGlowContainer: {
    borderRadius: spacing.radiusCard,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 124,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
  },
  badgeLockedContainer: {
    borderRadius: spacing.radiusCard,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 124,
    borderWidth: 1,
    borderColor: 'rgba(120,130,150,0.15)',
  },
  lockIconWrap: {
    marginBottom: spacing.xs,
    opacity: 0.45,
  },
  badgeTitleUnlocked: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  badgeTitleLocked: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(120,130,150,0.6)',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  unlockedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: spacing.sm,
  },
  unlockedTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  badgeProgressBar: {
    height: 4,
    width: '80%',
    backgroundColor: 'rgba(120,130,150,0.15)',
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  badgeProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  badgeProgressLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(120,130,150,0.5)',
    marginTop: 4,
  },
});
