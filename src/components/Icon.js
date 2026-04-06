import React from 'react';
import { View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { medicalCrossOutlineXml } from '../assets/icons/svgStrings';
import { colors } from '../theme';

/**
 * Iconos con licencia clara: Ionicons y MaterialCommunityIcons vía @expo/vector-icons (MIT).
 * SVG locales: `src/assets/icons/*.svg` + cadenas en `svgStrings.js` para `SvgXml`.
 *
 * Uso:
 *   <Icon preset="tabHome" size={24} color={colors.primary} />
 *   <Icon ionicon="pulse-outline" size={22} color={colors.primary} />
 *   <Icon mci="stethoscope" size={24} color={colors.primary} />
 *   <Icon svg="medicalCrossOutline" size={20} color={colors.primary} />
 */

const LOCAL_SVG_XML = {
  medicalCrossOutline: medicalCrossOutlineXml,
};

/** Nombres Ionicons (outline) para tabs y patrones repetidos. */
export const ICON_PRESETS = {
  tabHome: 'home-outline',
  tabDashboard: 'speedometer-outline',
  tabHistory: 'folder-open-outline',
  tabProfile: 'person-outline',
};

export default function Icon({
  preset,
  ionicon,
  mci,
  svg,
  size = 24,
  color = colors.primary,
  style,
  accessibilityLabel,
  ...rest
}) {
  if (svg) {
    const xml = LOCAL_SVG_XML[svg];
    if (!xml) {
      return (
        <Ionicons
          name="help-circle-outline"
          size={size}
          color={color}
          style={style}
          accessibilityLabel={accessibilityLabel}
          {...rest}
        />
      );
    }
    const tinted = xml.replace(/currentColor/g, color);
    return (
      <View
        accessible={!!accessibilityLabel}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="image"
        style={[{ width: size, height: size }, style]}
      >
        <SvgXml xml={tinted} width={size} height={size} />
      </View>
    );
  }

  if (preset && ICON_PRESETS[preset]) {
    return (
      <Ionicons
        name={ICON_PRESETS[preset]}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
        {...rest}
      />
    );
  }

  if (mci) {
    return (
      <MaterialCommunityIcons
        name={mci}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
        {...rest}
      />
    );
  }

  if (ionicon) {
    return (
      <Ionicons
        name={ionicon}
        size={size}
        color={color}
        style={style}
        accessibilityLabel={accessibilityLabel}
        {...rest}
      />
    );
  }

  return (
    <Ionicons
      name="help-circle-outline"
      size={size}
      color={color}
      style={style}
      accessibilityLabel={accessibilityLabel}
      {...rest}
    />
  );
}
