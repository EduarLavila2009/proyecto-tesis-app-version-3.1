import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

/**
 * Genera y comparte un archivo PDF profesional del historial médico.
 * @param {string} userName Nombre del paciente
 * @param {Array} records Historial de mediciones médicas
 * @param {Object} history Ficha de antecedentes clínicos
 * @returns {Promise<{ success: boolean, error?: any }>}
 */
export async function exportMedicalHistoryToPdf(userName, records, history) {
  if (Platform.OS === 'web') {
    Alert.alert('No disponible', 'La exportación a PDF nativo solo funciona en dispositivos móviles.');
    return { success: false, error: 'Web not supported' };
  }

  const bloodType = history?.bloodType || '—';
  const allergies = history?.allergies || 'Ninguna conocida';
  const chronicDiseases = history?.chronicDiseases || 'Ninguna conocida';
  const medications = history?.medications || 'Ninguno registrado';
  const notes = history?.notes || 'Sin observaciones adicionales';

  const recordsHtml = Array.isArray(records) && records.length > 0
    ? records.map(r => {
        const date = new Date(r.date).toLocaleString();
        const bp = r.bloodPressure
          ? `${r.bloodPressure.systolic}/${r.bloodPressure.diastolic} mmHg`
          : '—';
        const temp = typeof r.temperature === 'number' ? `${r.temperature.toFixed(1)} °C` : '—';
        const hr = typeof r.heartRate === 'number' ? `${r.heartRate} bpm` : '—';
        const spo2 = typeof r.oxygen === 'number' ? `${r.oxygen}%` : '—';

        return `
          <tr>
            <td>${date}</td>
            <td style="font-weight: 600;">${hr}</td>
            <td>${temp}</td>
            <td>${bp}</td>
            <td style="color: #10B981; font-weight: 600;">${spo2}</td>
            <td><span class="source-badge">${r.source === 'device' ? 'Automático' : 'Manual'}</span></td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="6" style="text-align: center; color: #64748B;">No hay mediciones clínicas registradas.</td></tr>';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <title>Reporte Médico - Medical Corp</title>
      <style>
        body {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          color: #0F172A;
          margin: 0;
          padding: 30px;
          line-height: 1.5;
          background-color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #1A56DB;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .logo-area h1 {
          color: #1A56DB;
          font-size: 26px;
          margin: 0;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .logo-area span {
          color: #10B981;
        }
        .report-info {
          text-align: right;
          font-size: 12px;
          color: #64748B;
        }
        .section-title {
          color: #1A56DB;
          font-size: 16px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 6px;
          margin-top: 30px;
          margin-bottom: 15px;
          font-weight: 700;
        }
        .grid-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          background-color: #F8FAFC;
          padding: 20px;
          border-radius: 8px;
          border: 1px solid #F1F5F9;
        }
        .info-item {
          font-size: 13px;
        }
        .info-label {
          font-weight: bold;
          color: #64748B;
          text-transform: uppercase;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .info-value {
          color: #0F172A;
          font-size: 14px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        th {
          background-color: #F1F5F9;
          color: #475569;
          font-weight: 700;
          text-align: left;
          padding: 10px 12px;
          font-size: 12px;
          text-transform: uppercase;
          border-bottom: 2px solid #E2E8F0;
        }
        td {
          padding: 12px;
          font-size: 13px;
          border-bottom: 1px solid #E2E8F0;
          color: #334155;
        }
        .source-badge {
          background-color: #E2E8F0;
          color: #475569;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .footer {
          margin-top: 50px;
          border-top: 1px solid #E2E8F0;
          padding-top: 15px;
          text-align: center;
          font-size: 11px;
          color: #94A3B8;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>MEDICAL<span>corp</span></h1>
          <div style="font-size: 12px; color: #64748B; font-weight: 600; margin-top: 2px;">Expediente Clínico Digital</div>
        </div>
        <div class="report-info">
          <div><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString()}</div>
          <div><strong>Paciente:</strong> ${userName}</div>
        </div>
      </div>

      <div class="section-title">Antecedentes Clínicos</div>
      <div class="grid-info">
        <div class="info-item">
          <div class="info-label">Tipo de Sangre</div>
          <div class="info-value" style="font-weight: bold; color: #EF4444; font-size: 16px;">${bloodType}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Alergias Conocidas</div>
          <div class="info-value">${allergies}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Enfermedades Crónicas</div>
          <div class="info-value">${chronicDiseases}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Tratamientos / Medicación Activa</div>
          <div class="info-value">${medications}</div>
        </div>
        <div class="info-item" style="grid-column: span 2;">
          <div class="info-label">Observaciones y Notas Clínicas</div>
          <div class="info-value" style="font-style: italic;">${notes}</div>
        </div>
      </div>

      <div class="section-title">Registro de Mediciones Fisiológicas</div>
      <table>
        <thead>
          <tr>
            <th>Fecha y Hora</th>
            <th>Frecuencia Cardíaca</th>
            <th>Temperatura</th>
            <th>Presión Arterial</th>
            <th>Saturación SpO₂</th>
            <th>Origen</th>
          </tr>
        </thead>
        <tbody>
          ${recordsHtml}
        </tbody>
      </table>

      <div class="footer">
        <p>Este reporte contiene información médica confidencial de monitoreo domiciliario. No reemplaza a un diagnóstico médico presencial formal.</p>
        <p>MEDICAL corp &copy; ${new Date().getFullYear()} · Sistema de Monitoreo de Signos Vitales de Alta Fidelidad</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Ficha Clínica de ${userName}`,
        UTI: 'com.adobe.pdf',
      });
      return { success: true };
    } else {
      Alert.alert('Error', 'Compartir archivos no está disponible en este dispositivo.');
      return { success: false, error: 'Sharing not available' };
    }
  } catch (error) {
    console.error('Error al generar PDF:', error);
    Alert.alert('Error', 'No se pudo generar el reporte en PDF.');
    return { success: false, error };
  }
}
