import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

/**
 * Layout base: opcional KeyboardAvoidingView (por fuera del SafeArea para mejor comportamiento en iOS)
 * + Safe Area + scroll opcional.
 */
export default function ScreenContainer({
  children,
  scroll = false,
  keyboardAvoiding = false,
  keyboardVerticalOffset = 0,
  behavior,
  edges = ['top', 'right', 'left', 'bottom'],
  backgroundColor,
  style,
  contentContainerStyle,
  scrollProps = {},
  scrollViewRef,
}) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.background;

  const kBehavior =
    behavior ??
    Platform.select({
      ios: 'padding',
      android: 'height',
      default: 'height',
    });

  const body = scroll ? (
    <ScrollView
      ref={scrollViewRef}
      style={styles.flex}
      contentContainerStyle={[
        styles.scrollContent,
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  const safeInner = (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: bg }, style]}
      edges={edges}
    >
      {body}
    </SafeAreaView>
  );

  if (!keyboardAvoiding) {
    return safeInner;
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: bg }]}
      behavior={kBehavior}
      keyboardVerticalOffset={keyboardVerticalOffset}
      enabled
    >
      <SafeAreaView
        style={[styles.flex, { backgroundColor: bg }, style]}
        edges={edges}
      >
        {body}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },
});
