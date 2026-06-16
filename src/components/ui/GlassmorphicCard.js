import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, useTheme } from '../../theme';

/**
 * Contenedor Glassmorphic Card de la Fase 4 y 5.
 * Proporciona un acabado translúcido premium con un destello de neón
 * en su borde superior, logrando una estética médica de alta tecnología.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children Contenido secundario a renderizar dentro de la tarjeta.
 * @param {Object} props.style Estilos adicionales opcionales de contenedor.
 * @param {'critical'|'warning'|'success'} [props.alertType] Tipo de alerta para colorear el destello neón superior.
 */
export default function GlassmorphicCard({ children, style, alertType }) {
  const { isDark, colors } = useTheme();

  const highlightColors = useMemo(() => {
    if (isDark) {
      switch (alertType) {
        case 'critical':
          return ['rgba(239, 68, 68, 0.55)', 'rgba(239, 68, 68, 0)'];
        case 'warning':
          return ['rgba(245, 158, 11, 0.55)', 'rgba(245, 158, 11, 0)'];
        case 'success':
          return ['rgba(16, 185, 129, 0.55)', 'rgba(16, 185, 129, 0)'];
        default:
          return ['rgba(13, 148, 136, 0.38)', 'rgba(13, 148, 136, 0)']; // Clinical Blue
      }
    } else {
      switch (alertType) {
        case 'critical':
          return ['rgba(220, 38, 38, 0.45)', 'rgba(220, 38, 38, 0)'];
        case 'warning':
          return ['rgba(180, 83, 9, 0.45)', 'rgba(180, 83, 9, 0)'];
        case 'success':
          return ['rgba(4, 120, 87, 0.45)', 'rgba(4, 120, 87, 0)'];
        default:
          return ['rgba(15, 118, 110, 0.3)', 'rgba(15, 118, 110, 0)'];
      }
    }
  }, [alertType, isDark]);

  // Aplanar el style prop y separar propiedades de layout externas de las internas de contenido
  const {
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flex,
    position,
    top,
    bottom,
    left,
    right,
    width,
    height,
    alignSelf,
    opacity,
    transform,
    ...innerStyle
  } = StyleSheet.flatten(style || {});

  const outerStyle = {
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    flex,
    position,
    top,
    bottom,
    left,
    right,
    width,
    height,
    alignSelf,
    opacity,
    transform,
  };

  return (
    <View style={[styles.shadowWrap, { shadowColor: colors.shadow }, outerStyle]}>
      <LinearGradient
        colors={isDark ? ['rgba(17, 24, 39, 0.72)', 'rgba(11, 15, 25, 0.94)'] : ['rgba(255, 255, 255, 0.92)', 'rgba(241, 245, 249, 0.96)']}
        style={[
          styles.container,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.08)',
          },
          innerStyle,
        ]}
      >
        {/* Destello sutil de luz en el borde superior para emular relieve cristalino */}
        <LinearGradient
          colors={highlightColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.borderHighlight}
        />
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: spacing.radiusCard * 1.25,
    // Eliminado overflow: 'hidden' para evitar el recorte de la sombra sutil
  },
  container: {
    borderRadius: spacing.radiusCard * 1.25,
    borderWidth: 1,
    padding: spacing.lg,
    position: 'relative',
    overflow: 'hidden', // Forzar recorte dentro de la tarjeta para destellos y contenidos
  },
  borderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
  },
});
