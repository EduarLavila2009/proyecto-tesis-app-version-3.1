import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, typography, useThemedStyles } from '../../theme';

/**
 * Encabezado de pantalla (auth, formularios, flujos guiados).
 * @param {'h1'|'h2'} [titleVariant='h2']
 */
export default function ScreenHeader({
  brand,
  title,
  subtitle,
  centered = true,
  titleVariant = 'h2',
  style,
  titleStyle,
  subtitleStyle,
}) {
  const styles = useThemedStyles(createStyles);
  const titleTypo = titleVariant === 'h1' ? typography.h1 : typography.h2;

  return (
    <View style={[styles.root, centered && styles.centered, style]}>
      {brand ? (
        <Text
          style={[styles.brand, centered ? styles.textCenter : styles.textLeft]}
          allowFontScaling
          accessibilityRole="header"
        >
          {brand}
        </Text>
      ) : null}
      {title ? (
        <Text
          style={[
            titleTypo,
            styles.titleColor,
            centered ? styles.textCenter : styles.textLeft,
            titleStyle,
          ]}
          allowFontScaling
          accessibilityRole="header"
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text
          style={[
            typography.body,
            styles.subtitle,
            centered ? styles.textCenter : styles.textLeft,
            subtitleStyle,
          ]}
          allowFontScaling
          accessibilityRole="text"
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    root: {
      marginBottom: 0,
    },
    centered: {
      alignItems: 'center',
    },
    brand: {
      ...typography.label,
      color: colors.primary,
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: spacing.s,
    },
    titleColor: {
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
      marginTop: spacing.s,
      maxWidth: 360,
    },
    textCenter: {
      textAlign: 'center',
    },
    textLeft: {
      textAlign: 'left',
      alignSelf: 'stretch',
    },
  });
}
