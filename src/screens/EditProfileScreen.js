import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { configureLayoutAnimation } from '../utils/layoutAnimation';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { Card, TextInputField, PrimaryButton, ScreenContainer } from '../components';
import { spacing, typography, useTheme } from '../theme';
import { updateUserProfile } from '../services/profileService';

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
    configureLayoutAnimation();
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
        <TextInputField
          label="Nombre completo"
          required
          containerStyle={styles.field}
          value={name}
          error={errors.name}
          validationType="text"
          onChangeText={(t) => {
            setName(t);
            if (errors.name) setErrors((e) => ({ ...e, name: null }));
          }}
          placeholder="Tu nombre"
          accessibilityLabel="Nombre completo"
          style={styles.input}
        />
        <TextInputField
          label="Correo electrónico"
          required
          containerStyle={styles.field}
          value={email}
          error={errors.email}
          validationType="email"
          onChangeText={(t) => {
            setEmail(t);
            if (errors.email) setErrors((e) => ({ ...e, email: null }));
          }}
          placeholder="nombre@correo.com"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Correo electrónico"
          style={styles.input}
        />
        <TextInputField
          label="Teléfono"
          containerStyle={styles.field}
          value={phone}
          error={errors.phone}
          validationType="phone"
          onChangeText={(t) => {
            setPhone(t);
            if (errors.phone) setErrors((e) => ({ ...e, phone: null }));
          }}
          placeholder="Opcional — ej. +34 600 000 000"
          accessibilityLabel="Teléfono"
          style={styles.input}
        />
      </Card>

      <PrimaryButton
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
