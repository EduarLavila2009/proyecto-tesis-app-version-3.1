/**
 * Signos vitales y reglas de alerta de demostración (misma fuente para Inicio y Panel).
 */

export const DEMO_FORCE_CRITICAL = false;
export const SIM_HEART_RATE_BPM = DEMO_FORCE_CRITICAL ? 108 : 82;
export const SIM_TEMP_C = 36.6;
export const SIM_BP_SYSTOLIC = DEMO_FORCE_CRITICAL ? 148 : 118;
export const SIM_BP_DIASTOLIC = DEMO_FORCE_CRITICAL ? 92 : 76;
export const SIM_SPO2 = 98;

/**
 * @param {number} heartRateBpm
 * @param {number} systolic
 * @param {number} diastolic
 * @returns {{ level: 'stable' | 'warning' | 'critical', title: string, subtitle: string }}
 */
export function evaluateMonitoringAlert(heartRateBpm, systolic, diastolic) {
  const highHr = heartRateBpm > 100;
  const highBp = systolic >= 140 || diastolic >= 90;
  const borderHr = heartRateBpm > 90;
  const borderBp = systolic >= 130 || diastolic >= 85;

  if (highHr || highBp) {
    return {
      level: 'critical',
      title: 'Crítico',
      subtitle:
        'Valores fuera del rango seguro. Se recomienda contactar a su médico o acudir a urgencias si hay síntomas.',
    };
  }
  if (borderHr || borderBp) {
    return {
      level: 'warning',
      title: 'Atención',
      subtitle:
        'Algunos valores están elevados. Vigile síntomas y repita la medición en unos minutos.',
    };
  }
  return {
    level: 'stable',
    title: 'Estable',
    subtitle: 'Parámetros dentro de rangos habituales para monitoreo domiciliario.',
  };
}

export function isAlertStatus(level) {
  return level === 'critical' || level === 'warning';
}
