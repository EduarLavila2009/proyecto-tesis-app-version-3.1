import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useScreenEnter } from '../../hooks/useScreenEnter';

/**
 * Layout base: Safe Area + scroll opcional.
 * Con animateEnter: opacity/translateY en Animated.View; layout estático en View hijo (evita mezclar drivers).
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
  animateEnter = false,
}) {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.background;
  const enter = useScreenEnter(animateEnter);

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
      {animateEnter ? (
        <Animated.View style={enter.style}>{children}</Animated.View>
      ) : (
        children
      )}
    </ScrollView>
  ) : animateEnter ? (
    <Animated.View style={[styles.flex, enter.style]}>
      <View style={contentContainerStyle}>{children}</View>
    </Animated.View>
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
