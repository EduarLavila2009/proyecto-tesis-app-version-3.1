import React, { useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Header, HeaderBackButton, getHeaderTitle } from '@react-navigation/elements';
import { useTheme, typography } from '../../theme';
import {
  stackHeaderSideInsetStyle,
  sanitizeHeaderStyle,
} from '../../navigation/headerInsets';

/**
 * Barra superior de navegación (Stack) — fondo primary, título h2, ícono volver onPrimary.
 * paddingHorizontal en headerStyle no tiene efecto en React Navigation; va en *ContainerStyle.
 */
export default function NavigationHeader({ options, route, back, navigation }) {
  const { colors } = useTheme();
  const title = getHeaderTitle(options, route?.name ?? '');
  const CustomTitle = options?.headerTitle;

  const headerStyle = useMemo(
    () => [
      styles.bar,
      { backgroundColor: colors.primary },
      sanitizeHeaderStyle(options?.headerStyle),
      Platform.select({
        android: { elevation: 0 },
        ios: {
          shadowOpacity: 0,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 0,
        },
        default: {},
      }),
    ],
    [colors.primary, options?.headerStyle]
  );

  return (
    <Header
      title={CustomTitle ? undefined : title}
      headerTitle={CustomTitle}
      headerTitleAlign="center"
      headerTintColor={colors.onPrimary}
      headerStyle={headerStyle}
      headerLeftContainerStyle={stackHeaderSideInsetStyle.left}
      headerRightContainerStyle={stackHeaderSideInsetStyle.right}
      headerTitleStyle={{
        ...typography.h2,
        color: colors.onPrimary,
      }}
      headerShadowVisible={false}
      headerBackTitleVisible={false}
      headerLeft={
        back
          ? (props) => (
              <HeaderBackButton
                {...props}
                tintColor={colors.onPrimary}
                onPress={navigation.goBack}
                accessibilityLabel="Volver"
              />
            )
          : () => null
      }
    />
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 0,
  },
});
