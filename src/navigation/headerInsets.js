import { StyleSheet } from 'react-native';
import { spacing } from '../theme/spacing';

/**
 * React Navigation ignora paddingHorizontal en headerStyle.
 * Usar headerLeftContainerStyle / headerRightContainerStyle (ver NavigationHeader).
 */
export const stackHeaderSideInset = {
  paddingHorizontal: spacing.xs,
};

export const stackHeaderSideInsetStyle = StyleSheet.create({
  left: stackHeaderSideInset,
  right: stackHeaderSideInset,
});

/** Quita padding lateral inválido de headerStyle antes de aplicarlo. */
export function sanitizeHeaderStyle(style) {
  const flat = StyleSheet.flatten(style);
  if (!flat) return {};
  const {
    paddingHorizontal: _ph,
    paddingLeft: _pl,
    paddingRight: _pr,
    ...safe
  } = flat;
  return safe;
}
