import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, useTheme } from '../../theme';

/**
 * Componente premium de Tooltip Clínico.
 * Envuelve cualquier elemento y, tras mantenerlo presionado,
 * despliega una superposición táctil con animación de rebote y micro-información médica.
 */
export default function ClinicalTooltip({
  title,
  value,
  clinicalInfo,
  children,
}) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const triggerHaptic = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } catch (_) {}
  };

  const showTooltip = () => {
    triggerHaptic();
    setVisible(true);
    
    // Animación de entrada suave con spring elástico
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const hideTooltip = () => {
    // Animación de salida antes de cerrar
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  return (
    <>
      <Pressable
        onLongPress={showTooltip}
        delayLongPress={350}
        style={styles.triggerPressable}
      >
        {children}
      </Pressable>

      <Modal
        visible={visible}
        transparent={true}
        animationType="none"
        onRequestClose={hideTooltip}
      >
        <Pressable style={styles.overlay} onPress={hideTooltip}>
          <Animated.View
            style={[
              styles.cardContainer,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.shadowWrap}>
              <LinearGradient
                colors={['rgba(21, 27, 38, 0.96)', 'rgba(11, 15, 25, 0.98)']}
                style={styles.card}
              >
                {/* Neon Top Highlight */}
                <LinearGradient
                  colors={['rgba(0, 201, 255, 0.45)', 'rgba(0, 201, 255, 0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.borderHighlight}
                />

                <View style={styles.header}>
                  <View style={[styles.iconWrap, { backgroundColor: 'rgba(0, 201, 255, 0.08)' }]}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.headerText}>
                    <Text style={styles.title} allowFontScaling numberOfLines={1}>
                      {title}
                    </Text>
                    {value ? (
                      <Text style={[styles.value, { color: colors.primary }]} allowFontScaling>
                        {value}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.clinicalTitle} allowFontScaling>
                  MICRO-INFORMACIÓN CLÍNICA
                </Text>
                
                <Text style={styles.clinicalInfo} allowFontScaling>
                  {clinicalInfo}
                </Text>

                <View style={styles.footer}>
                  <Ionicons name="finger-print-outline" size={14} color={colors.textPlaceholder} />
                  <Text style={styles.footerText} allowFontScaling>
                    Toca en cualquier parte para cerrar
                  </Text>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  triggerPressable: {
    alignSelf: 'stretch',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 7, 12, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 340,
  },
  shadowWrap: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderRadius: spacing.radiusCard * 1.5,
    overflow: 'hidden',
  },
  card: {
    borderRadius: spacing.radiusCard * 1.5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.lg,
    position: 'relative',
  },
  borderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 201, 255, 0.15)',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.caption,
    fontWeight: '900',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: spacing.md,
  },
  clinicalTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00C9FF',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  clinicalInfo: {
    fontSize: 13,
    color: '#F8FAFC',
    lineHeight: 18.5,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    opacity: 0.5,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
});
