import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CommonActions, useNavigation } from '@react-navigation/native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, typography, layout, stackScrollContent, useTheme } from '../theme';
import { PressableScale, Card, ScreenContainer } from '../components';
import { logout } from '../services/authService';

function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  destructive,
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createRowStyles(colors), [colors]);

  const textColor = destructive ? colors.danger : colors.textPrimary;

  return (
    <PressableScale
      containerStyle={styles.rowPressable}
      style={styles.row}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: `${(iconColor || colors.primary)}14` }]}>
          <Ionicons name={icon} size={20} color={iconColor || colors.primary} />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: textColor }]} allowFontScaling>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} allowFontScaling numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : onPress ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      ) : null}
    </PressableScale>
  );
}

export default function SettingsScreen() {
  const { colors, isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors, insets), [colors, insets]);
  const navigation = useNavigation();

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleNotifications = () => {
    // Simulado por ahora: podrías abrir pantalla dedicada más adelante
    navigation.navigate('Alerts');
  };

  const handlePrivacy = () => {
    // En una app real podrías abrir una WebView con política de privacidad
  };

  const handleLogout = async () => {
    const res = await logout();
    if (res.success) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'RoleSelection' }],
        })
      );
    }
  };

  return (
    <ScreenContainer scroll contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <SettingsRow
            icon="moon"
            title="Modo oscuro"
            subtitle="Reduce el brillo en entornos con poca luz."
            rightElement={
              <Switch
                value={isDark}
                onValueChange={(v) => setMode(v ? 'dark' : 'light')}
                trackColor={{
                  false: colors.borderSubtle,
                  true: `${colors.primary}99`,
                }}
                thumbColor={isDark ? colors.primary : colors.surface}
                ios_backgroundColor={colors.borderSubtle}
              />
            }
          />
        </Card>

        <Card style={styles.card}>
          <SettingsRow
            icon="person-circle-outline"
            title="Editar perfil"
            subtitle="Nombre, correo, teléfono y foto."
            onPress={handleEditProfile}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="notifications-outline"
            title="Notificaciones"
            subtitle="Ver últimas alertas médicas internas."
            onPress={handleNotifications}
          />
          <View style={styles.separator} />
          <SettingsRow
            icon="shield-checkmark-outline"
            title="Privacidad"
            subtitle="Información orientativa. Tus datos se guardan solo en este dispositivo."
            onPress={handlePrivacy}
          />
        </Card>

        <Card style={styles.card}>
          <SettingsRow
            icon="log-out-outline"
            iconColor={colors.danger}
            title="Cerrar sesión"
            subtitle="Volverás a la pantalla de inicio de la app."
            destructive
            onPress={handleLogout}
          />
        </Card>
    </ScreenContainer>
  );
}

function createStyles(colors, insets) {
  return StyleSheet.create({
    scroll: stackScrollContent(insets, {
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      width: '100%',
    }),
    card: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.lg,
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderSubtle,
      marginHorizontal: spacing.sm,
    },
  });
}

function createRowStyles(colors) {
  return StyleSheet.create({
    rowPressable: {
      width: '100%',
      alignSelf: 'stretch',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      minWidth: 0,
      gap: spacing.md,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    textBlock: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: typography.body.fontSize,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    subtitle: {
      marginTop: 2,
      fontSize: typography.caption.fontSize,
      color: colors.textSecondary,
      lineHeight: typography.caption.fontSize * 1.45,
    },
  });
}

