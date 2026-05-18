import { spacing } from './spacing';

/**
 * Tokens de layout — padding de pantalla, anchos máximos y contenedores centrados.
 */
export const layout = {
  contentMaxWidth: 440,
  roleContentMaxWidth: 420,
  screenPaddingH: spacing.m,
  screenPaddingTop: spacing.m,
  screenPaddingTopHero: spacing.xl,
  screenPaddingBottom: spacing.screen,
  formCardPadding: spacing.l + spacing.xs,
  sectionGap: spacing.l,
  fieldGap: spacing.m,
  minTouchTarget: spacing.minTouchTarget,
};

/** Estilos base reutilizables para ScrollView contentContainerStyle. */
export function screenScrollContent(overrides = {}) {
  return {
    flexGrow: 1,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom,
    ...overrides,
  };
}

export function screenScrollContentCentered(overrides = {}) {
  return screenScrollContent({
    justifyContent: 'center',
    ...overrides,
  });
}

export function screenScrollContentHero(overrides = {}) {
  return screenScrollContent({
    paddingTop: layout.screenPaddingTopHero,
    ...overrides,
  });
}

/** contentContainerStyle para FlatList en tabs (respeta safe area inferior). */
export function tabListContent(insets, overrides = {}) {
  return {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: layout.screenPaddingTop,
    paddingBottom: layout.screenPaddingBottom + (insets?.bottom ?? 0),
    flexGrow: 1,
    ...overrides,
  };
}

/** Scroll / listas en pantallas Stack (Ajustes, Alertas, etc.). */
export function stackScrollContent(insets, overrides = {}) {
  return screenScrollContent({
    paddingBottom: layout.screenPaddingBottom + (insets?.bottom ?? 0),
    ...overrides,
  });
}
