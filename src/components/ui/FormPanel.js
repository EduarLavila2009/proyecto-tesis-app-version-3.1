import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { createFormPanelStyle } from '../../theme/forms';
import { createCardTitleStyle } from '../../theme/screenUi';

/**
 * Panel de formulario: superficie elevada con título opcional.
 * Solo UI — la pantalla padre conserva handlers y estado.
 */
export default function FormPanel({ title, children, style }) {
  const { colors, cardShadow } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        panel: createFormPanelStyle(colors, cardShadow),
        title: createCardTitleStyle(colors),
      }),
    [colors, cardShadow]
  );

  return (
    <View style={[styles.panel, style]}>
      {title ? (
        <Text style={styles.title} allowFontScaling accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
