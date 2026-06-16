import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, spacing, typography } from '../../theme';
import PressableScale from '../PressableScale';

/**
 * Componente LiveHeartRateCard (Fase 4).
 * Muestra el ritmo cardíaco en tiempo real mediante un latido elástico animado a 60 FPS (sístole/diástole),
 * sincronizado matemáticamente con el valor de la FC y retroalimentación háptica rítmica.
 * 
 * @param {Object} props
 * @param {number} props.heartRate Frecuencia cardíaca actual (bpm).
 * @param {'stable'|'warning'|'critical'} props.statusLevel Nivel de triage clínico de la métrica.
 * @param {Function} props.onPress Callback ejecutado al pulsar la tarjeta de constante vital.
 */
export default function LiveHeartRateCard({ heartRate = 72, statusLevel = 'stable', onPress }) {
  const { colors, isDark } = useTheme();
  
  // Referencias para animación
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current; // Aura de brillo del latido

  // Definir colores y copys clínicos dinámicos según el estado de triage
  const statusConfig = useMemo(() => {
    switch (statusLevel) {
      case 'critical':
        return {
          color: '#FF3B30', // Rojo emergencia
          label: 'CRÍTICO',
          insight: 'Ritmo cardíaco anómalo. Solicita asistencia.',
          icon: 'alert-circle-outline'
        };
      case 'warning':
        return {
          color: '#FFA500', // Naranja clínico
          label: 'ELEVADO',
          insight: 'Métrica por encima del rango. Reposa.',
          icon: 'warning-outline'
        };
      case 'stable':
      default:
        return {
          color: '#00E676', // Emerald Jade estable
          label: 'NORMAL',
          insight: 'Ritmo sin alteraciones detectadas.',
          icon: 'checkmark-circle-outline'
        };
    }
  }, [statusLevel]);

  const triggerHaptic = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } catch (_) {
      // Fallback silencioso en simuladores o Expo Go
    }
  };

  // Latido cardíaco sincronizado dinámicamente con los bpm reales
  useEffect(() => {
    const bpm = Math.max(40, Math.min(220, heartRate)); // Limitar rango lógico
    const intervalMs = 60000 / bpm; // Ej: 75 bpm = latido cada 800ms

    let timerId = null;
    let isCancelled = false;

    const executeHeartbeat = () => {
      if (isCancelled) return;

      // Disparar háptico coordinado con el impacto inicial del latido (sístole)
      triggerHaptic();

      // Animación elástica doble (latido humano: sístole + diástole) en el hilo nativo
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.22,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.94,
            duration: 90,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.12,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.0,
            duration: 140,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 110,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 310,
            useNativeDriver: true,
          }),
        ])
      ]).start();

      // Programar recursivamente el siguiente latido basado en el intervalo de BPM
      timerId = setTimeout(executeHeartbeat, intervalMs);
    };

    // Iniciar latido inicial con un breve delay
    timerId = setTimeout(executeHeartbeat, 250);

    return () => {
      isCancelled = true;
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [heartRate]);

  // Interpolación para el aura de brillo alrededor del corazón
  const auraScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.7],
  });

  const auraOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0],
  });

  return (
    <PressableScale onPress={onPress} style={styles.cardWrapper}>
      <LinearGradient
        colors={isDark ? ['#151B26', '#0B0F19'] : ['#FFFFFF', '#F8FAFC']}
        style={[
          styles.card,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 114, 255, 0.06)',
            borderLeftColor: statusConfig.color,
            borderLeftWidth: 4.5,
          }
        ]}
      >
        {/* Línea de luz superior de estilo Glassmorphic */}
        <LinearGradient
          colors={[`${statusConfig.color}44`, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topLightBorder}
        />

        <View style={styles.contentRow}>
          {/* Lado Izquierdo: Icono del Corazón Latiente con Aura de Brillo */}
          <View style={styles.iconSection}>
            {/* Aura de pulso de fondo */}
            <Animated.View
              style={[
                styles.aura,
                {
                  backgroundColor: statusConfig.color,
                  transform: [{ scale: auraScale }],
                  opacity: auraOpacity,
                }
              ]}
            />
            {/* Corazón latiente */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }], zIndex: 2 }}>
              <Ionicons name="heart" size={38} color={statusConfig.color} style={styles.heartShadow} />
            </Animated.View>
          </View>

          {/* Lado Central/Derecho: Métricas en grande e insights clínicos */}
          <View style={styles.textSection}>
            <View style={styles.headerRow}>
              <Text style={[styles.titleText, { color: colors.textSecondary }]}>Frecuencia Cardíaca</Text>
              
              {/* Etiqueta de Triage Clínico */}
              <View style={[styles.badge, { backgroundColor: `${statusConfig.color}15`, borderColor: `${statusConfig.color}35` }]}>
                <Ionicons name={statusConfig.icon} size={10} color={statusConfig.color} style={{ marginRight: 3 }} />
                <Text style={[styles.badgeText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
            </View>

            <View style={styles.valueRow}>
              <Text style={[styles.valueText, { color: colors.textPrimary }]} allowFontScaling>{heartRate}</Text>
              <Text style={[styles.unitText, { color: colors.textSecondary }]}>bpm</Text>
              <Text style={[styles.liveIndicator, { color: statusConfig.color }]}>· EN VIVO</Text>
            </View>

            <Text style={[styles.insightText, { color: statusConfig.color }]} numberOfLines={1}>
              {statusConfig.insight}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    marginVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    borderRadius: spacing.radiusCard * 1.25,
    borderWidth: 1.5,
    padding: spacing.md + 2,
    position: 'relative',
    overflow: 'hidden',
  },
  topLightBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconSection: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aura: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    zIndex: 1,
  },
  heartShadow: {
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  textSection: {
    flex: 1,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs / 2,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9EADBA',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 29,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9EADBA',
    marginLeft: 3,
  },
  liveIndicator: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00E676',
    marginLeft: spacing.sm,
    letterSpacing: 0.5,
    opacity: 0.85,
  },
  insightText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
