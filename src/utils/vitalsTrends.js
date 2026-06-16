/**
 * Utilidad de Triage Predictivo - Medical Corp.
 * Analiza tendencias longitudinales en las mediciones de los signos vitales.
 */

/**
 * Evalúa las mediciones históricas para detectar anomalías de tendencia.
 * @param {Array} records Historial de mediciones (ordenado de más nuevo a más antiguo, records[0] es el más reciente).
 * @returns {{ level: 'stable'|'warning'|'critical', title: string, message: string }}
 */
export function evaluatePredictiveTriage(records) {
  if (!Array.isArray(records) || records.length < 3) {
    return {
      level: 'stable',
      title: 'Normal (Tendencia)',
      message: 'Estable. No hay suficientes mediciones históricas para evaluar tendencias.',
    };
  }

  // Tomamos los últimos 4 registros y los ordenamos cronológicamente (de más antiguo a más reciente)
  const recentRecords = [...records].slice(0, 4).reverse();

  const heartRates = recentRecords.map(r => r.heartRate).filter(v => typeof v === 'number');
  const systolics = recentRecords.map(r => r.bloodPressure?.systolic).filter(v => typeof v === 'number');
  const oxygenLevels = recentRecords.map(r => r.oxygen).filter(v => typeof v === 'number');

  // 1) Tendencia de Desaturación de Oxígeno (SpO2 descendente)
  if (oxygenLevels.length >= 3) {
    let oxygenDecreasing = true;
    for (let i = 1; i < oxygenLevels.length; i++) {
      if (oxygenLevels[i] >= oxygenLevels[i - 1]) {
        oxygenDecreasing = false;
        break;
      }
    }
    const latestOxygen = oxygenLevels[oxygenLevels.length - 1];
    // Si desciende constantemente y el último valor ya es de cuidado (<= 95)
    if (oxygenDecreasing && latestOxygen <= 95) {
      return {
        level: latestOxygen < 92 ? 'critical' : 'warning',
        title: 'Tendencia: Desaturación',
        message: `¡Alerta preventiva! Se observa un descenso constante de oxígeno en las últimas ${oxygenLevels.length} mediciones (${oxygenLevels.join('% → ')}%).`,
      };
    }
  }

  // 2) Tendencia de Hipertensión (Presión Sistólica ascendente)
  if (systolics.length >= 3) {
    let systolicIncreasing = true;
    for (let i = 1; i < systolics.length; i++) {
      if (systolics[i] <= systolics[i - 1]) {
        systolicIncreasing = false;
        break;
      }
    }
    const latestSystolic = systolics[systolics.length - 1];
    // Si incrementa constantemente y el último valor ya está elevado (>= 130)
    if (systolicIncreasing && latestSystolic >= 130) {
      return {
        level: latestSystolic >= 140 ? 'critical' : 'warning',
        title: 'Tendencia: Presión Arterial',
        message: `¡Atención! Incremento constante de la presión arterial sistólica en las últimas ${systolics.length} mediciones (${systolics.join(' → ')} mmHg). Evite esfuerzos físicos.`,
      };
    }
  }

  // 3) Tendencia de Ritmo Cardíaco (FC ascendente)
  if (heartRates.length >= 3) {
    let hrIncreasing = true;
    for (let i = 1; i < heartRates.length; i++) {
      if (heartRates[i] <= heartRates[i - 1]) {
        hrIncreasing = false;
        break;
      }
    }
    const latestHr = heartRates[heartRates.length - 1];
    if (hrIncreasing && latestHr >= 95) {
      return {
        level: latestHr > 105 ? 'critical' : 'warning',
        title: 'Tendencia: Ritmo Cardíaco',
        message: `¡Atención! Aumento progresivo en el ritmo cardíaco en reposo en las últimas ${heartRates.length} mediciones (${heartRates.join(' → ')} bpm). Descanse y controle síntomas.`,
      };
    }
  }

  return {
    level: 'stable',
    title: 'Normal (Tendencia)',
    message: 'Estable. No se detectan anomalías de tendencia longitudinal en los signos vitales.',
  };
}
