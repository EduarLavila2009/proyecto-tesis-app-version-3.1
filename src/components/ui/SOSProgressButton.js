import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme, spacing, typography } from '../../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Botón SOS flotante interactivo de la Fase 2.
 * Requiere ser presionado continuamente por 3 segundos para activarse.
 * Incorpora un anillo de radar pulsante, animación circular de progreso en SVG, y pulsos hápticos acelerados.
 * 
 * @param {Object} props
 * @param {Function} props.onTrigger Callback disparado al activarse tras 3s continuos de retención.
 */
export default function SOSProgressButton({ onTrigger }) {
  const { colors, isDark } = useTheme();
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;
  
  const timerRef = useRef(null);
  const pulseIntervalRef = useRef(null);

  // Bucle de radar concéntrico de fondo para estado en reposo
  useEffect(() => {
    const radarLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(radarAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    radarLoop.start();
    return () => radarLoop.stop();
  }, []);

  const triggerHaptic = (type) => {
    try {
      const Haptics = require('expo-haptics');
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (_) {
      // Fallback silencioso en simuladores o Expo Go si la API no está disponible
    }
  };

  const handlePressIn = () => {
    // Escalar el botón sutilmente hacia adentro
    Animated.spring(scaleAnim, {
      toValue: 0.91,
      useNativeDriver: true,
    }).start();

    // Retroalimentación táctil inicial
    triggerHaptic('impact');

    // Reiniciar y animar progreso de la circunferencia (useNativeDriver: false por ser propiedad del SVG)
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();

    // Latido háptico dinámico: acelera a medida que se acerca al límite de los 3 segundos (600ms -> 100ms)
    const startTime = Date.now();
    const scheduleNextPulse = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= 3000) return;

      triggerHaptic('impact');

      const ratio = elapsed / 3000;
      const nextInterval = Math.max(100, 600 - ratio * 500); 
      pulseIntervalRef.current = setTimeout(scheduleNextPulse, nextInterval);
    };

    pulseIntervalRef.current = setTimeout(scheduleNextPulse, 150);

    // Temporizador de activación del SOS
    timerRef.current = setTimeout(() => {
      cleanupTimers();
      triggerHaptic('success');
      
      if (onTrigger) {
        onTrigger();
      }

      // Restablecer estilos visuales con rebote orgánico
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      progressAnim.setValue(0);
    }, 3000);
  };

  const handlePressOut = () => {
    cleanupTimers();
    
    // Regresar escala a su valor original
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    // Desvanecer el trazo circular de forma rápida
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  };

  const cleanupTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pulseIntervalRef.current) {
      clearTimeout(pulseIntervalRef.current);
      pulseIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupTimers();
  }, []);

  // Parámetros de dimensiones y física de la circunferencia circular SVG
  const SIZE = 72;
  const strokeWidth = 4.5;
  const radius = (SIZE - strokeWidth) / 2 - 3.5; 
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      {/* Anillo de Radar Pulsante */}
      <Animated.View
        style={[
          styles.radarRing,
          {
            borderColor: colors.danger,
            transform: [
              {
                scale: radarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.85],
                }),
              },
            ],
            opacity: radarAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0.55, 0.25, 0],
            }),
          },
        ]}
      />

      <Animated.View style={[styles.floatingBtn, { transform: [{ scale: scaleAnim }] }]}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.pressable,
            { backgroundColor: colors.danger }
          ]}
          accessibilityRole="button"
          accessibilityLabel="Botón de Emergencia SOS. Mantenga presionado por 3 segundos para activar."
        >
          {/* Capa de Dibujo SVG para el progreso circular concéntrico */}
          <View style={styles.svgOverlay} pointerEvents="none">
            <Svg width={SIZE} height={SIZE}>
              <G transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
                {/* Línea circular guía de fondo */}
                <Circle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  fill="transparent"
                  stroke={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
                  strokeWidth={strokeWidth}
                />
                {/* Circunferencia activa animada */}
                <AnimatedCircle
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={radius}
                  fill="transparent"
                  stroke={colors.surface} 
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </G>
            </Svg>
          </View>

          {/* Texto central */}
          <Text style={styles.btnText}>SOS</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.lg + 4,
    right: spacing.lg + 4,
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  radarRing: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    zIndex: 1,
  },
  floatingBtn: {
    width: 66,
    height: 66,
    borderRadius: 33,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.5,
    backgroundColor: 'transparent',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  svgOverlay: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    ...typography.subtitle,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
