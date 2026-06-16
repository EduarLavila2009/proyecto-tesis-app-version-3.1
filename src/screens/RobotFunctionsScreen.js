import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import {
  ScreenContainer,
  Card,
  GlassmorphicCard,
  PressableScale,
  PrimaryButton,
  SecondaryButton,
  SaveFeedbackBanner,
  IconCircle,
  SOSProgressButton,
} from '../components';
import { useSaveFeedback } from '../hooks/useSaveFeedback';
import {
  spacing,
  typography,
  layout,
  stackScrollContent,
  useTheme,
  createSectionHeadingStyle,
} from '../theme';

export default function RobotFunctionsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = useMemo(() => createStyles(colors, insets, isDark), [colors, insets, isDark]);

  const { feedbackMessage, showSuccess, clearFeedback } = useSaveFeedback();

  // Estado de Pestaña Principal: 'data' (Identidad/Triage) | 'mobility' (Rondas/Logística) | 'hri' (Interacción/SOS)
  const [activeTab, setActiveTab] = useState('data');

  // --- ESTADOS: 1. Identidad y Datos ---
  const [syncState, setSyncState] = useState('synced'); // 'synced' | 'syncing'
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [triageState, setTriageState] = useState('idle'); // 'idle' | 'evaluating' | 'completed'

  const handleSyncCloud = useCallback(async () => {
    setSyncState('syncing');
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}

    // Simular retraso de red
    setTimeout(() => {
      setSyncState('synced');
      setLastSync(new Date().toLocaleTimeString());
      showSuccess('Expediente clínico sincronizado con la nube');
      try {
        const Haptics = require('expo-haptics');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (_) {}
    }, 1800);
  }, [showSuccess]);

  const handleEvaluateTriage = useCallback(() => {
    setTriageState('evaluating');
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}

    setTimeout(() => {
      setTriageState('completed');
      try {
        const Haptics = require('expo-haptics');
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch (_) {}
    }, 1500);
  }, []);

  // --- ESTADOS: 2. Movilidad Asistida y Logística ---
  const routes = useMemo(
    () => [
      { id: 'route1', name: 'Ronda General de Pasillos A y B', desc: 'Vigilancia autónoma preventiva' },
      { id: 'route2', name: 'Entrega de Insumos - Cuna 102', desc: 'Transporte de insumos ligeros' },
      { id: 'route3', name: 'Trayecto de Retorno a Base', desc: 'Carga de batería en estación' },
    ],
    []
  );
  const [selectedRoute, setSelectedRoute] = useState('route1');
  const [routeStatus, setRouteStatus] = useState('idle'); // 'idle' | 'running' | 'paused' | 'finished'
  const [routeProgress, setRouteProgress] = useState(0);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressListener = useRef(null);

  // Escuchar cambios de animación para actualizar texto de UI
  useEffect(() => {
    progressListener.current = progressAnim.addListener(({ value }) => {
      setRouteProgress(Math.round(value));
    });
    return () => {
      if (progressListener.current) {
        progressAnim.removeListener(progressListener.current);
      }
    };
  }, [progressAnim]);

  const handleStartRoute = useCallback(() => {
    setRouteStatus('running');
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}

    // Iniciar o continuar animación de 0-100% (8 segundos duración de simulación)
    const currentVal = progressAnim._value;
    const duration = 8000 * (1 - currentVal / 100);

    Animated.timing(progressAnim, {
      toValue: 100,
      duration: duration > 0 ? duration : 8000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setRouteStatus('finished');
        try {
          const Haptics = require('expo-haptics');
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } catch (_) {}
      }
    });
  }, [progressAnim]);

  const handlePauseRoute = useCallback(() => {
    Animated.timing(progressAnim).stop();
    setRouteStatus('paused');
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, [progressAnim]);

  const handleResetRoute = useCallback(() => {
    Animated.timing(progressAnim).stop();
    progressAnim.setValue(0);
    setRouteStatus('idle');
    setRouteProgress(0);
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, [progressAnim]);

  // --- ESTADOS: 3. Interacción Empática y HRI ---
  const eyeExpressions = useMemo(
    () => [
      { id: 'happy', label: 'Feliz', icon: 'happy-outline', desc: 'Ojos sonrientes' },
      { id: 'alert', label: 'Atento', icon: 'eye-outline', desc: 'Ojos vigilantes' },
      { id: 'neutral', label: 'Neutro', icon: 'remove-circle-outline', desc: 'Expresión estándar' },
      { id: 'sleep', label: 'Dormido', icon: 'moon-outline', desc: 'Modo ahorro energía' },
    ],
    []
  );
  const [activeExpression, setActiveExpression] = useState('happy');

  const handleSelectExpression = useCallback((id) => {
    setActiveExpression(id);
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
    showSuccess(`Expresión facial "${id.toUpperCase()}" enviada a pantalla Nextion`);
  }, [showSuccess]);

  // Recordatorios de medicación
  const [reminders, setReminders] = useState([
    { id: 'rem1', time: '08:00', med: 'Paracetamol 500mg', active: true },
    { id: 'rem2', time: '21:00', med: 'Loratadina 10mg', active: true },
  ]);

  const handleToggleReminder = useCallback((id) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, []);

  // --- ESTADOS: 4. Botón de Auxilio (SOS) ---
  const [sosOverlayVisible, setSosOverlayVisible] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(5);
  const [sosState, setSosState] = useState('navigating'); // 'navigating' | 'arrived'

  const sosIntervalRef = useRef(null);

  const handleTriggerSos = useCallback(() => {
    setSosState('navigating');
    setSosCountdown(5);
    setSosOverlayVisible(true);

    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);

    sosIntervalRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(sosIntervalRef.current);
          setSosState('arrived');
          try {
            const Haptics = require('expo-haptics');
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          } catch (_) {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleCancelSos = useCallback(() => {
    if (sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
      sosIntervalRef.current = null;
    }
    setSosOverlayVisible(false);
    try {
      const Haptics = require('expo-haptics');
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    return () => {
      if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    };
  }, []);

  // Estilo animado para el pulso rojo de SOS
  const sosPulseAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (sosOverlayVisible && sosState === 'navigating') {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sosPulseAnim, {
            toValue: 0.95,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(sosPulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
    return undefined;
  }, [sosOverlayVisible, sosState, sosPulseAnim]);

  return (
    <View style={styles.rootWrapper}>
      <ScreenContainer
        scroll
        contentContainerStyle={styles.scrollContainer}
        scrollProps={{ showsVerticalScrollIndicator: false }}
      >
        <SaveFeedbackBanner message={feedbackMessage} onHidden={clearFeedback} />

        {/* Encabezado Principal */}
        <View style={styles.headerArea}>
          <IconCircle color={colors.primary} size={64} style={styles.headerIconCircle}>
            <Ionicons name="hardware-chip-outline" size={32} color={colors.primary} />
          </IconCircle>
          <Text style={styles.mainTitle} allowFontScaling accessibilityRole="header">
            Asistente Robótico NEUROBOT
          </Text>
          <Text style={styles.mainSubtitle} allowFontScaling>
            Panel de control telemático y telemetría de funciones autónomas
          </Text>
        </View>

        {/* Selector de Pestañas */}
        <View style={styles.tabBar}>
          {[
            { id: 'data', label: 'Datos y Triaje', icon: 'pulse-outline' },
            { id: 'mobility', label: 'Movilidad', icon: 'navigate-outline' },
            { id: 'hri', label: 'Interacción HRI', icon: 'sparkles-outline' },
          ].map((tab) => (
            <PressableScale
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => {
                try {
                  const Haptics = require('expo-haptics');
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                } catch (_) {}
                setActiveTab(tab.id);
              }}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={activeTab === tab.id ? '#FFFFFF' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabButtonLabel,
                  activeTab === tab.id && styles.tabButtonLabelActive,
                ]}
                allowFontScaling
              >
                {tab.label}
              </Text>
            </PressableScale>
          ))}
        </View>

        {/* --- CONTENIDO PESTAÑA: DATOS Y TRIAJE --- */}
        {activeTab === 'data' && (
          <Animated.View style={styles.fadeContainer}>
            {/* Gestión de Identidad y Datos */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Gestión de Identidad y Expediente
            </Text>
            <GlassmorphicCard style={styles.cardSpacing} alertType="success">
              <View style={styles.cardHeaderRow}>
                <View style={styles.statusPillCloud}>
                  <Ionicons name="cloud-done-outline" size={16} color={colors.success} />
                  <Text style={styles.statusPillCloudText}>NUBE SINCRONIZADA</Text>
                </View>
                <Text style={styles.timestampText}>Última Sinc: {lastSync}</Text>
              </View>
              <Text style={styles.cardDesc} allowFontScaling>
                NEUROBOT actualiza y consulta el expediente clínico digital en tiempo real en la nube, evitando papeleo físico y desplazamientos de enfermería.
              </Text>

              {syncState === 'syncing' ? (
                <View style={styles.syncProgress}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.syncProgressText} allowFontScaling>
                    Conectando con base de datos en la nube...
                  </Text>
                </View>
              ) : (
                <PrimaryButton
                  title="Sincronizar expediente clínico"
                  icon="refresh-outline"
                  onPress={handleSyncCloud}
                  style={styles.actionBtn}
                />
              )}
            </GlassmorphicCard>

            {/* Evaluación Clínica Autónoma */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Telemetría Autónoma del Robot
            </Text>
            <Card style={styles.cardSpacing}>
              <Text style={styles.cardTitle} allowFontScaling>
                Lecturas de Sensores del Robot
              </Text>
              <Text style={styles.cardDesc} allowFontScaling>
                Signos vitales medidos de forma autónoma por los módulos integrados en NEUROBOT.
              </Text>

              <View style={styles.sensorGrid}>
                {[
                  { label: 'Presión Arterial', value: '120/78 mmHg', icon: 'heart-outline', status: 'Estable' },
                  { label: 'Oxígeno (SpO₂)', value: '98%', icon: 'water-outline', status: 'Estable' },
                  { label: 'Temperatura', value: '36.6 °C', icon: 'thermometer-outline', status: 'Normal' },
                  { label: 'Pulso Cardíaco', value: '72 bpm', icon: 'pulse-outline', status: 'Normal' },
                ].map((s, idx) => (
                  <View key={idx} style={styles.sensorCell}>
                    <View style={styles.sensorIconCircle}>
                      <Ionicons name={s.icon} size={20} color={colors.primary} />
                    </View>
                    <View style={styles.sensorDataCol}>
                      <Text style={styles.sensorLabel}>{s.label}</Text>
                      <Text style={styles.sensorValue}>{s.value}</Text>
                      <Text style={styles.sensorStatus}>{s.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Triaje IA */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Triaje Predictivo con IA
            </Text>
            <GlassmorphicCard
              style={styles.cardSpacing}
              alertType={triageState === 'completed' ? 'success' : undefined}
            >
              <Text style={styles.cardTitle} allowFontScaling>
                Analítica de Triaje Inteligente
              </Text>
              <Text style={styles.cardDesc} allowFontScaling>
                Nuestra IA proactiva evalúa el comportamiento longitudinal del paciente para detectar alarmas antes de la crisis.
              </Text>

              {triageState === 'idle' && (
                <SecondaryButton
                  title="Evaluar Triage con IA"
                  icon="sparkles-outline"
                  onPress={handleEvaluateTriage}
                  style={styles.actionBtn}
                />
              )}

              {triageState === 'evaluating' && (
                <View style={styles.syncProgress}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.syncProgressText} allowFontScaling>
                    Analizando patrones fisiológicos en tiempo real...
                  </Text>
                </View>
              )}

              {triageState === 'completed' && (
                <View style={styles.triageResult}>
                  <View style={styles.triageResultHeader}>
                    <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                    <Text style={styles.triageResultTitle}>DIAGNÓSTICO: ESTABLE (VERDE)</Text>
                  </View>
                  <Text style={styles.triageResultBody} allowFontScaling>
                    El paciente se encuentra dentro de los rangos fisiológicos estándar. No se detectan anomalías de tendencia clínica. Próxima evaluación recomendada en 60 min.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetTriageLink}
                    onPress={() => setTriageState('idle')}
                  >
                    <Text style={styles.resetTriageText}>Volver a evaluar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </GlassmorphicCard>
          </Animated.View>
        )}

        {/* --- CONTENIDO PESTAÑA: MOVILIDAD Y LOGÍSTICA --- */}
        {activeTab === 'mobility' && (
          <Animated.View style={styles.fadeContainer}>
            <Text style={styles.sectionHeading} allowFontScaling>
              Rutas Autónomas y Logística
            </Text>
            <Card style={styles.cardSpacing}>
              <Text style={styles.cardTitle} allowFontScaling>
                Configuración de Trayectoria
              </Text>
              <Text style={styles.cardDesc} allowFontScaling>
                Asigna rutas autónomas preconfiguradas para rondas de vigilancia hospitalaria o entrega de medicamentos y suministros ligeros.
              </Text>

              {/* Selector de Ruta */}
              <View style={styles.routesList}>
                {routes.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.routeCard,
                      selectedRoute === r.id && styles.routeCardActive,
                    ]}
                    onPress={() => {
                      if (routeStatus !== 'running') {
                        setSelectedRoute(r.id);
                        handleResetRoute();
                      } else {
                        Alert.alert('Ronda Activa', 'Pausa la ruta en curso antes de cambiar de trayecto.');
                      }
                    }}
                  >
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={selectedRoute === r.id ? colors.primary : colors.textPlaceholder}
                    />
                    <View style={styles.routeTextCol}>
                      <Text
                        style={[
                          styles.routeName,
                          selectedRoute === r.id && styles.routeNameActive,
                        ]}
                      >
                        {r.name}
                      </Text>
                      <Text style={styles.routeDesc}>{r.desc}</Text>
                    </View>
                    {selectedRoute === r.id && (
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Barra de Progreso de Navegación */}
              <View style={styles.navigationSection}>
                <View style={styles.navigationHeaderRow}>
                  <Text style={styles.navigationLabel}>Estado de Navegación</Text>
                  <Text style={styles.navigationPercent}>{routeProgress}%</Text>
                </View>

                {/* Contenedor de barra */}
                <View style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.navigationStatusText} allowFontScaling>
                  {routeStatus === 'idle' ? '🤖 NEUROBOT listo en Base de Carga' : ''}
                  {routeStatus === 'running' ? '⚡ Navegando de forma autónoma... (Evitación de obstáculos activa)' : ''}
                  {routeStatus === 'paused' ? '⚠️ Movimiento en pausa por operador humano' : ''}
                  {routeStatus === 'finished' ? '🎉 Ruta finalizada con éxito. Reporte cargado.' : ''}
                </Text>
              </View>

              {/* Acciones de Control */}
              <View style={styles.controlButtonsRow}>
                {routeStatus !== 'running' && routeStatus !== 'finished' && (
                  <PrimaryButton
                    title="Iniciar Ronda"
                    icon="play"
                    onPress={handleStartRoute}
                    style={styles.flexBtn}
                  />
                )}
                {routeStatus === 'running' && (
                  <PrimaryButton
                    title="Pausar Ruta"
                    icon="pause"
                    onPress={handlePauseRoute}
                    style={styles.flexBtn}
                  />
                )}
                {routeStatus !== 'idle' && (
                  <SecondaryButton
                    title="Reiniciar"
                    appearance="outline"
                    icon="refresh-outline"
                    onPress={handleResetRoute}
                    style={styles.resetBtn}
                  />
                )}
              </View>
            </Card>
          </Animated.View>
        )}

        {/* --- CONTENIDO PESTAÑA: INTERACCIÓN Y HRI --- */}
        {activeTab === 'hri' && (
          <Animated.View style={styles.fadeContainer}>
            {/* Ojos Nextion */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Expresión de Ojos (Pantalla Nextion)
            </Text>
            <Card style={styles.cardSpacing}>
              <Text style={styles.cardDesc} allowFontScaling>
                La HRI (Interacción Humano-Robot) ayuda a disminuir el estrés hospitalario. Selecciona la expresión del rostro físico de NEUROBOT.
              </Text>

              <View style={styles.expressionRow}>
                {eyeExpressions.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={[
                      styles.expressionCard,
                      activeExpression === e.id && styles.expressionCardActive,
                    ]}
                    onPress={() => handleSelectExpression(e.id)}
                  >
                    <Ionicons
                      name={e.icon}
                      size={28}
                      color={activeExpression === e.id ? colors.primary : colors.textPlaceholder}
                    />
                    <Text
                      style={[
                        styles.expressionLabel,
                        activeExpression === e.id && styles.expressionLabelActive,
                      ]}
                    >
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* Recordatorios de Medicación */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Recordatorios de Medicación Autónomos
            </Text>
            <Card style={styles.cardSpacing}>
              <Text style={styles.cardDesc} allowFontScaling>
                NEUROBOT anuncia verbalmente y mediante notificaciones la toma de dosis indicadas por enfermería.
              </Text>

              <View style={styles.remindersList}>
                {reminders.map((r) => (
                  <View key={r.id} style={styles.reminderRow}>
                    <View style={styles.reminderInfo}>
                      <View style={styles.reminderTimeBox}>
                        <Text style={styles.reminderTimeText}>{r.time}</Text>
                      </View>
                      <Text style={styles.reminderMedText}>{r.med}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.reminderToggleBtn,
                        r.active ? styles.reminderToggleBtnActive : styles.reminderToggleBtnInactive,
                      ]}
                      onPress={() => handleToggleReminder(r.id)}
                    >
                      <Ionicons
                        name={r.active ? 'notifications' : 'notifications-off-outline'}
                        size={16}
                        color={r.active ? '#FFFFFF' : colors.textPlaceholder}
                      />
                      <Text style={[styles.reminderToggleText, { color: r.active ? '#FFFFFF' : colors.textSecondary }]}>
                        {r.active ? 'Activo' : 'Pausa'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <SecondaryButton
                title="Agregar recordatorio simulado"
                icon="add-outline"
                appearance="outline"
                onPress={() => {
                  const newRem = {
                    id: `rem-${Date.now()}`,
                    time: '14:30',
                    med: 'Medicina simulada de Tesis',
                    active: true,
                  };
                  setReminders((prev) => [...prev, newRem]);
                  showSuccess('Nuevo recordatorio agregado al robot');
                }}
                style={styles.actionBtn}
              />
            </Card>

            {/* SOS Virtual Instructivo */}
            <Text style={styles.sectionHeading} allowFontScaling>
              Botón de Auxilio Virtual
            </Text>
            <GlassmorphicCard style={styles.cardSpacing} alertType="critical">
              <Text style={styles.cardTitle} allowFontScaling>
                Llamada de Emergencia a NEUROBOT
              </Text>
              <Text style={styles.cardDesc} allowFontScaling>
                Diseñado para situaciones de auxilio. Al activarse, conecta el paciente de inmediato con el robot físico del pasillo asignado a su área.
              </Text>
              <Text style={styles.sosGuideText} allowFontScaling>
                👈 **INSTRUCCIÓN**: Mantén presionado firmemente el botón flotante rojo **SOS** a la derecha por **3 segundos** para probar esta simulación interactiva.
              </Text>
            </GlassmorphicCard>
          </Animated.View>
        )}

        <View style={styles.footerSpacer} />
      </ScreenContainer>

      {/* Botón SOS Flotante - Solo visible en Tab de Interacción HRI para limpieza visual */}
      {activeTab === 'hri' && (
        <SOSProgressButton onTrigger={handleTriggerSos} />
      )}

      {/* --- OVERLAY DE SIMULACIÓN DE EMERGENCIA SOS --- */}
      {sosOverlayVisible && (
        <View style={styles.sosOverlay}>
          {sosState === 'navigating' ? (
            <Animated.View
              style={[
                styles.sosOverlayContent,
                {
                  opacity: sosPulseAnim,
                },
              ]}
            >
              <View style={styles.sosEmergencyIconWrap}>
                <Ionicons name="alert-circle" size={80} color="#FF3B30" />
              </View>
              <Text style={styles.sosOverlayTitle}>🚨 ALERTA DE AUXILIO EMITIDA</Text>
              <Text style={styles.sosOverlayText} allowFontScaling>
                NEUROBOT se encuentra en camino de forma prioritaria a tu ubicación asignada:
              </Text>
              <View style={styles.locationPill}>
                <Text style={styles.locationPillText}>HABITACIÓN CLINICA 102</Text>
              </View>
              <Text style={styles.sosCountdownText}>
                Llegada del robot en: {sosCountdown}s
              </Text>
              <Text style={styles.sosDisclaimer}>
                Navegación robótica autónoma y evitación dinámica de obstáculos en curso...
              </Text>
              <TouchableOpacity style={styles.sosCancelBtn} onPress={handleCancelSos}>
                <Text style={styles.sosCancelBtnText}>Cancelar Alerta de Auxilio</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.sosOverlayContent}>
              <IconCircle color={colors.success} size={100} style={styles.sosSuccessCircle}>
                <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              </IconCircle>
              <Text style={styles.sosOverlayTitle}>¡NEUROBOT Ha Llegado!</Text>
              <Text style={styles.sosOverlayText} allowFontScaling>
                El robot de asistencia médica ha arribado a tu posición y se ha vinculado a tu red de llamada.
              </Text>

              <PrimaryButton
                title="Iniciar teleconsulta instantánea"
                icon="videocam"
                onPress={() => {
                  setSosOverlayVisible(false);
                  navigation.navigate('VideoCall', { contactName: 'NEUROBOT Asistente', role: 'doctor' });
                }}
                style={styles.sosActionBtn}
              />

              <SecondaryButton
                title="Finalizar Atención del Robot"
                appearance="outline"
                onPress={() => setSosOverlayVisible(false)}
                style={styles.sosActionBtnSec}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function createStyles(colors, insets, isDark) {
  return StyleSheet.create({
    rootWrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: stackScrollContent(insets, {
      maxWidth: layout.contentMaxWidth,
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: spacing.md,
    }),
    headerArea: {
      alignItems: 'center',
      marginTop: spacing.md,
      marginBottom: spacing.lg,
    },
    headerIconCircle: {
      marginBottom: spacing.sm,
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.12)' : 'rgba(15, 118, 110, 0.08)',
    },
    mainTitle: {
      ...typography.h2,
      color: colors.primary,
      textAlign: 'center',
      fontWeight: '800',
    },
    mainSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.md,
      lineHeight: 16,
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: spacing.radiusCard,
      padding: spacing.xs,
      gap: spacing.xs,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    tabButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: spacing.radiusInput,
    },
    tabButtonActive: {
      backgroundColor: colors.primary,
    },
    tabButtonLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    tabButtonLabelActive: {
      color: '#FFFFFF',
    },
    fadeContainer: {
      width: '100%',
    },
    sectionHeading: {
      ...createSectionHeadingStyle(colors),
      marginTop: 0,
      marginBottom: spacing.sm,
    },
    cardSpacing: {
      marginBottom: spacing.lg,
    },
    cardTitle: {
      ...typography.subtitle,
      color: colors.textPrimary,
      fontWeight: '800',
      marginBottom: spacing.xs,
    },
    cardDesc: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 18.5,
      marginBottom: spacing.md,
      fontSize: 13,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.m,
    },
    statusPillCloud: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: `${colors.success}15`,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 0.5,
      borderColor: colors.success,
    },
    statusPillCloudText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.success,
    },
    timestampText: {
      fontSize: 11,
      color: colors.textPlaceholder,
      fontWeight: '600',
    },
    syncProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    syncProgressText: {
      ...typography.caption,
      color: colors.primary,
      fontWeight: '700',
    },
    actionBtn: {
      width: '100%',
    },
    sensorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    sensorCell: {
      width: '46%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.02)',
      borderRadius: spacing.radiusInput,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.sm,
    },
    sensorIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.12)' : 'rgba(15, 118, 110, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    sensorDataCol: {
      flex: 1,
    },
    sensorLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    sensorValue: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.textPrimary,
      marginVertical: 1,
    },
    sensorStatus: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
    },
    triageResult: {
      backgroundColor: `${colors.success}08`,
      borderColor: `${colors.success}22`,
      borderWidth: 1,
      borderRadius: spacing.radiusInput,
      padding: spacing.md,
      marginTop: spacing.xs,
    },
    triageResultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.xs,
    },
    triageResultTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.success,
    },
    triageResultBody: {
      fontSize: 12,
      color: colors.textPrimary,
      lineHeight: 17,
      fontWeight: '500',
    },
    resetTriageLink: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    resetTriageText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
    routesList: {
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    routeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
      borderWidth: 1.5,
      borderRadius: spacing.radiusInput,
      padding: spacing.md,
      gap: spacing.sm,
    },
    routeCardActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.03)' : 'rgba(15, 118, 110, 0.02)',
    },
    routeTextCol: {
      flex: 1,
    },
    routeName: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    routeNameActive: {
      color: colors.primary,
    },
    routeDesc: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },
    navigationSection: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(0, 0, 0, 0.02)',
      borderRadius: spacing.radiusInput,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      marginBottom: spacing.md,
    },
    navigationHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    navigationLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    navigationPercent: {
      fontSize: 12,
      fontWeight: '900',
      color: colors.primary,
    },
    progressBarBg: {
      height: 8,
      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    navigationStatusText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
      lineHeight: 15,
    },
    controlButtonsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    flexBtn: {
      flex: 1,
    },
    resetBtn: {
      width: 100,
    },
    expressionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    expressionCard: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.borderSubtle,
      borderRadius: spacing.radiusInput,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    expressionCardActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? 'rgba(13, 148, 136, 0.03)' : 'rgba(15, 118, 110, 0.02)',
    },
    expressionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textPlaceholder,
    },
    expressionLabelActive: {
      color: colors.primary,
    },
    remindersList: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    reminderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.01)' : 'rgba(15, 23, 42, 0.01)',
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      borderRadius: spacing.radiusInput,
      padding: spacing.sm,
    },
    reminderInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    reminderTimeBox: {
      backgroundColor: colors.secondaryMuted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 6,
    },
    reminderTimeText: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.primary,
    },
    reminderMedText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    reminderToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
      borderRadius: 12,
    },
    reminderToggleBtnActive: {
      backgroundColor: colors.success,
    },
    reminderToggleBtnInactive: {
      backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
    },
    reminderToggleText: {
      fontSize: 10,
      fontWeight: '800',
    },
    sosGuideText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
      backgroundColor: `${colors.danger}10`,
      borderColor: `${colors.danger}22`,
      borderWidth: 1,
      borderRadius: spacing.radiusInput,
      padding: spacing.sm,
      lineHeight: 16,
      textAlign: 'center',
    },
    footerSpacer: {
      height: 100,
    },

    // SOS Overlay
    sosOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: '#0F0F0F',
      zIndex: 99999,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    sosOverlayContent: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
    },
    sosEmergencyIconWrap: {
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: 'rgba(255, 59, 48, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    sosOverlayTitle: {
      fontSize: 22,
      fontWeight: '900',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: spacing.m,
      letterSpacing: 0.5,
    },
    sosOverlayText: {
      fontSize: 15,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
      fontWeight: '500',
    },
    locationPill: {
      backgroundColor: 'rgba(255, 59, 48, 0.2)',
      borderColor: '#FF3B30',
      borderWidth: 1.5,
      paddingHorizontal: spacing.lg,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: spacing.xl,
    },
    locationPillText: {
      fontSize: 13,
      fontWeight: '900',
      color: '#FF453A',
      letterSpacing: 0.8,
    },
    sosCountdownText: {
      fontSize: 20,
      fontWeight: '900',
      color: '#FFFFFF',
      marginBottom: spacing.xs,
    },
    sosDisclaimer: {
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.4)',
      textAlign: 'center',
      marginBottom: spacing.xxl,
      fontWeight: '600',
    },
    sosCancelBtn: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.25)',
      borderWidth: 1.5,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderRadius: spacing.radiusButton,
      width: '100%',
      alignItems: 'center',
    },
    sosCancelBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    sosSuccessCircle: {
      marginBottom: spacing.lg,
      backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    sosActionBtn: {
      width: '100%',
      marginBottom: spacing.md,
    },
    sosActionBtnSec: {
      width: '100%',
    },
  });
}
