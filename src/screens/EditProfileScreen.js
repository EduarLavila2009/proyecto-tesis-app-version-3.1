import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  Alert,
  StatusBar,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { Card, Input, Button, ScreenContainer } from '../components';
import { spacing, typography, useTheme } from '../theme';
import { updateUserProfile } from '../services/profileService';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePhone(phone) {
  const t = String(phone || '').trim();
  if (!t) return true;
  const digits = t.replace(/\D/g, '');
  return digits.length >= 9;
}

export default function EditProfileScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = useHeaderHeight();
  const keyboardOffset =
    headerHeight + (Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadFromStorage = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (!raw) return;
      const u = JSON.parse(raw);
      setName(u?.name ?? '');
      setEmail(u?.email ?? '');
      setPhone(typeof u?.phone === 'string' ? u.phone : '');
    } catch (_) {
      /* ignore */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFromStorage();
    }, [loadFromStorage])
  );

  const validate = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = {};
    if (!name.trim()) next.name = 'El nombre es obligatorio';
    if (!email.trim()) next.email = 'El correo es obligatorio';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Formato de correo no válido';
    if (!validatePhone(phone)) {
      next.phone = 'Introduce un teléfono válido (mín. 9 dígitos) o déjalo vacío';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await updateUserProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      if (res.success) {
        Alert.alert('Éxito', 'Tu perfil se ha actualizado.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', res.message || 'No se pudo guardar.');
      }
    } catch (_) {
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      scroll
      keyboardAvoiding
      keyboardVerticalOffset={keyboardOffset}
      contentContainerStyle={styles.scroll}
    >
      <Text style={styles.intro} allowFontScaling>
        Actualiza tus datos. Los cambios se guardan en este dispositivo.
      </Text>

      <Card style={styles.card}>
        <Input
          label="Nombre completo"
          containerStyle={styles.field}
          value={name}
          error={errors.name}
          onChangeText={(t) => {
            setName(t);
            if (errors.name) setErrors((e) => ({ ...e, name: null }));
          }}
          placeholder="Tu nombre"
          accessibilityLabel="Nombre completo"
          style={styles.input}
        />
        <Input
          label="Correo electrónico"
          containerStyle={styles.field}
          value={email}
          error={errors.email}
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: null }));
          }}
          placeholder="nombre@correo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Correo electrónico"
          style={styles.input}
        />
        <Input
          label="Teléfono"
          containerStyle={styles.field}
          value={phone}
          error={errors.phone}
          onChangeText={(t) => {
            setPhone(t);
            if (errors.phone) setErrors((e) => ({ ...e, phone: null }));
          }}
          placeholder="Opcional — ej. +34 600 000 000"
          keyboardType="phone-pad"
          accessibilityLabel="Teléfono"
          style={styles.input}
        />
      </Card>

      <Button
        title={saving ? 'Guardando…' : 'Guardar cambios'}
        onPress={handleSave}
        disabled={saving}
        style={styles.saveBtn}
        accessibilityLabel="Guardar cambios del perfil"
      />
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.screen,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.body.fontSize * 1.45,
  },
  card: {
    padding: spacing.lg,
    borderRadius: spacing.radiusLg,
    marginBottom: spacing.xl,
  },
  field: {
    marginBottom: spacing.md,
  },
  input: {
    width: '100%',
  },
  saveBtn: {
    minHeight: spacing.minTouchTarget + spacing.sm,
  },
  });
}
