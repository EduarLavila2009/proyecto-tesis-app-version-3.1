/**
 * Espaciado — escala base 4px.
 * Valores pedidos: 4, 8, 12, 16, 24, 32 → xs, sm, s, md, lg, xl
 * Tokens extra para secciones y radios de componentes.
 */
export const spacing = {
  /** 4 */
  xs: 4,
  /** 8 */
  sm: 8,
  /** 12 */
  s: 12,
  /** 16 — padding estándar de bloques */
  md: 16,
  /** 24 */
  lg: 24,
  /** 32 */
  xl: 32,

  /** Mínimo recomendado (Apple HIG / accesibilidad táctil) */
  minTouchTarget: 44,

  xxl: 40,
  xxxl: 48,
  section: 40,
  screen: 48,

  /** Radios (16–24px, UI tipo SaaS) */
  radiusInput: 14,
  radiusButton: 16,
  radiusCard: 16,
  radiusLg: 20,
  radiusXl: 24,

  /** Legado: opacidad sombra en tarjetas (iOS) */
  shadowOpacityCard: 0.08,
};
