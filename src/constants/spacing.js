/**
 * Sistema de diseño MEDICAL corp — Espaciados estándar
 * Escala base 4px. Usar estos valores para padding, margin y gaps consistentes.
 */

const base = 4;

export default {
  /** 4px */
  xs: base,
  /** 8px */
  sm: base * 2,
  /** 12px */
  md: base * 3,
  /** 16px */
  lg: base * 4,
  /** 20px */
  xl: base * 5,
  /** 24px */
  xxl: base * 6,
  /** 32px */
  xxxl: base * 8,
  /** 40px */
  section: base * 10,
  /** 48px */
  screen: base * 12,
  /** 64px */
  large: base * 16,

  // Alias semánticos (opcionales)
  /** Padding interno de tarjeta / input */
  cardPadding: base * 4,
  /** Separación entre secciones */
  sectionGap: base * 6,
  /** Separación entre elementos en lista */
  listGap: base * 3,
  /** Radio de borde estándar */
  radiusSm: base,
  radiusMd: base * 2,
  radiusLg: base * 3,
};
