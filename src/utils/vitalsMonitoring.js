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
 * @param {number} [spo2] Saturación (0-100)
 * @returns {{ level: 'stable' | 'warning' | 'critical', title: string, subtitle: string, reasons: Array<{ code: string, label: string, severity: 'warning'|'critical' }> }}
 */
export function evaluateMonitoringAlert(heartRateBpm, systolic, diastolic, spo2) {
  const reasons = [];

  // FC
  if (heartRateBpm < 50) {
    reasons.push({ code: 'HR_LOW_CRIT', label: 'FC baja', severity: 'critical' });
  } else if (heartRateBpm < 60) {
    reasons.push({ code: 'HR_LOW_WARN', label: 'FC baja', severity: 'warning' });
  } else if (heartRateBpm > 100) {
    reasons.push({ code: 'HR_HIGH_CRIT', label: 'FC alta', severity: 'critical' });
  } else if (heartRateBpm > 90) {
    reasons.push({ code: 'HR_HIGH_WARN', label: 'FC elevada', severity: 'warning' });
  }

  // Presión arterial (muy simplificado)
  const highBpCrit = systolic >= 140 || diastolic >= 90;
  const highBpWarn = systolic >= 130 || diastolic >= 85;
  const lowBpCrit = systolic < 90 || diastolic < 60;
  const lowBpWarn = systolic < 100 || diastolic < 65;

  if (highBpCrit) reasons.push({ code: 'BP_HIGH_CRIT', label: 'Presión alta', severity: 'critical' });
  else if (highBpWarn) reasons.push({ code: 'BP_HIGH_WARN', label: 'Presión elevada', severity: 'warning' });
  else if (lowBpCrit) reasons.push({ code: 'BP_LOW_CRIT', label: 'Presión baja', severity: 'critical' });
  else if (lowBpWarn) reasons.push({ code: 'BP_LOW_WARN', label: 'Presión baja', severity: 'warning' });

  // SpO2
  if (typeof spo2 === 'number') {
    if (spo2 < 92) reasons.push({ code: 'SPO2_LOW_CRIT', label: 'Oxígeno bajo', severity: 'critical' });
    else if (spo2 < 95) reasons.push({ code: 'SPO2_LOW_WARN', label: 'Oxígeno bajo', severity: 'warning' });
  }

  const hasCritical = reasons.some((r) => r.severity === 'critical');
  const hasWarning = reasons.some((r) => r.severity === 'warning');

  if (hasCritical) {
    return {
      level: 'critical',
      title: 'Crítico',
      subtitle:
        reasons.length > 0
          ? `Alerta: ${reasons.map((r) => r.label).join(' · ')}. Si hay síntomas, contacta a tu médico o acude a urgencias.`
          : 'Valores fuera del rango seguro. Se recomienda contactar a su médico o acudir a urgencias si hay síntomas.',
      reasons,
    };
  }
  if (hasWarning) {
    return {
      level: 'warning',
      title: 'Atención',
      subtitle:
        reasons.length > 0
          ? `Observación: ${reasons.map((r) => r.label).join(' · ')}. Repite la medición y vigila síntomas.`
          : 'Algunos valores están elevados. Vigile síntomas y repita la medición en unos minutos.',
      reasons,
    };
  }
  return {
    level: 'stable',
    title: 'Estable',
    subtitle: 'Parámetros dentro de rangos habituales para monitoreo domiciliario.',
    reasons,
  };
}

export function isAlertStatus(level) {
  return level === 'critical' || level === 'warning';
}
