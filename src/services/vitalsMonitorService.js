import { evaluateMonitoringAlert, isAlertStatus } from '../utils/vitalsMonitoring';
import { recordMedicalAlert } from './alertsService';
import { notifyVitalsAlert } from './notificationService';

/**
 * Evalúa vitales y registra alerta in-app + notificación local (paciente o médico).
 */
export async function processVitalsAlert({
  heartRate,
  systolic,
  diastolic,
  spo2,
  patientId = null,
  patientName = null,
  notifyLocal = true,
}) {
  const status = evaluateMonitoringAlert(heartRate, systolic, diastolic, spo2);
  if (!isAlertStatus(status.level)) {
    return { status, recorded: false };
  }

  const vitals = { heartRate, systolic, diastolic, spo2 };
  const title = patientName ? `${patientName}: ${status.title}` : status.title;

  const res = await recordMedicalAlert({
    level: status.level,
    title,
    subtitle: status.subtitle,
    reasons: status.reasons,
    patientId,
    patientName,
    vitals,
  });

  if (notifyLocal && res.recorded) {
    await notifyVitalsAlert({
      title: patientName ? `Paciente: ${status.title}` : 'Alerta de salud',
      body: status.subtitle,
    });
  }

  return { status, recorded: res.recorded };
}
