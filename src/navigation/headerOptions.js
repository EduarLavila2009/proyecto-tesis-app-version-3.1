import { Platform, StyleSheet } from 'react-native';
import { typography, spacing, motion } from '../theme';
import { stackHeaderSideInsetStyle } from './headerInsets';

/**
 * Opciones uniformes para Native Stack — fondo primary, título h2 blanco, sin sombra.
 * @param {import('../theme/colors').lightColors} colors
 */
export function createStackScreenOptions(colors) {
  return {
    // Sin paddingHorizontal aquí — no aplica en headerStyle (ver headerInsets.js).
    headerStyle: {
      backgroundColor: colors.primary,
      borderBottomWidth: 0,
      ...Platform.select({
        android: { elevation: 0 },
        ios: {
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
        },
        default: {},
      }),
    },
    headerLeftContainerStyle: stackHeaderSideInsetStyle.left,
    headerRightContainerStyle: stackHeaderSideInsetStyle.right,
    headerTintColor: colors.onPrimary,
    headerTitleAlign: 'center',
    headerTitleStyle: {
      fontFamily: typography.h2.fontFamily,
      fontSize: typography.h2.fontSize,
      fontWeight: typography.h2.fontWeight,
      lineHeight: typography.h2.lineHeight,
      color: colors.onPrimary,
    },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    headerBackVisible: true,
    animation: Platform.select({
      ios: 'default',
      android: 'slide_from_right',
      default: 'default',
    }),
    animationDuration: motion.duration.normal,
    gestureEnabled: true,
    fullScreenGestureEnabled: Platform.OS === 'ios',
    contentStyle: {
      backgroundColor: colors.background,
    },
  };
}

/**
 * Opciones para Bottom Tabs — íconos y etiquetas alineados al tema.
 * @param {import('../theme/colors').lightColors} colors
 */
const TAB_BAR_BASE_HEIGHT = 56;

/**
 * @param {import('../theme/colors').lightColors} colors
 * @param {{ bottom?: number }} [safeArea]
 */
export function createTabScreenOptions(colors, safeArea = {}) {
  const bottomInset = safeArea.bottom ?? 0;
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSecondary,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
      paddingTop: spacing.xs,
      paddingBottom: Math.max(bottomInset, spacing.xs),
      height: TAB_BAR_BASE_HEIGHT + bottomInset,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarLabelStyle: {
      fontFamily: typography.caption.fontFamily,
      fontSize: typography.caption.fontSize,
      fontWeight: '500',
      marginBottom: spacing.xs,
    },
    tabBarItemStyle: {
      paddingVertical: spacing.xs,
    },
  };
}
