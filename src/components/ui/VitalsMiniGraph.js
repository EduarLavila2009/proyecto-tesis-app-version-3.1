import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Platform } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import { useTheme, spacing, typography } from '../../theme';

/**
 * Gráfico SVG interactivo de tendencia de signos vitales.
 * Muestra una línea de progreso suave con soporte táctil, tooltips dinámicos y retroalimentación háptica.
 */
export default function VitalsMiniGraph({
  data = [72, 75, 82, 68, 88, 79, 74],
  label = 'Frecuencia cardíaca (bpm)',
  colorAccent,
  style,
}) {
  const { colors } = useTheme();
  
  const [activeIndex, setActiveIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const activeColor = colorAccent || colors.primary;
  const dataPoints = data.length > 0 ? data : [70, 70];

  // Estadísticas básicas
  const minVal = useMemo(() => Math.min(...dataPoints), [dataPoints]);
  const maxVal = useMemo(() => Math.max(...dataPoints), [dataPoints]);
  const avgVal = useMemo(() => {
    const sum = dataPoints.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / dataPoints.length);
  }, [dataPoints]);

  const width = 310;
  const height = 90;
  const paddingX = 14;
  const paddingY = 14;

  const points = useMemo(() => {
    const rangeVal = maxVal - minVal || 10;
    return dataPoints.map((val, idx) => {
      const x = paddingX + (idx * (width - paddingX * 2)) / (dataPoints.length - 1);
      const y = height - paddingY - ((val - minVal) * (height - paddingY * 2)) / rangeVal;
      return { x, y, val };
    });
  }, [dataPoints, minVal, maxVal]);

  const { pathLine, pathArea } = useMemo(() => {
    if (points.length === 0) return { pathLine: '', pathArea: '' };

    const line = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Cerrar el área para el gradiente
    const first = points[0];
    const last = points[points.length - 1];
    const area = `${line} L ${last.x} ${height} L ${first.x} ${height} Z`;

    return { pathLine: line, pathArea: area };
  }, [points]);

  const triggerHaptic = () => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.selectionAsync();
    } catch (_) {
      // Fallback silencioso si no está en Expo Go / no está instalado
    }
  };

  const handleTouch = (touchX) => {
    if (!points || points.length === 0) return;
    
    // Buscar el punto más cercano en el eje X
    let closestIndex = 0;
    let minDistance = Math.abs(points[0].x - touchX);

    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - touchX);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const closestPoint = points[closestIndex];
    
    setActiveIndex((prevActive) => {
      if (prevActive !== closestIndex) {
        triggerHaptic();
      }
      return closestIndex;
    });

    setTooltipPos({
      x: closestPoint.x,
      y: closestPoint.y - 10,
    });
  };

  // Configuración del PanResponder táctil
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        handleTouch(evt.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        // Fades out tooltip after 1.5s of touch release
        setTimeout(() => {
          setActiveIndex(null);
        }, 1500);
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderSubtle }, style]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.mainVal, { color: colors.textPrimary }]}>
            {activeIndex !== null ? points[activeIndex].val : dataPoints[dataPoints.length - 1]} 
            <Text style={styles.unit}> {activeIndex !== null ? 'actual' : 'prom.'}</Text>
          </Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textPlaceholder }]}>MÍN</Text>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>{minVal}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textPlaceholder }]}>PROM</Text>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>{avgVal}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statLabel, { color: colors.textPlaceholder }]}>MÁX</Text>
            <Text style={[styles.statValue, { color: colors.textSecondary }]}>{maxVal}</Text>
          </View>
        </View>
      </View>

      <View style={styles.graphWrap} {...panResponder.panHandlers}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={activeColor} stopOpacity={0.16} />
              <Stop offset="100%" stopColor={activeColor} stopOpacity={0.0} />
            </LinearGradient>
          </Defs>

          {/* Área sombreada */}
          <Path d={pathArea} fill="url(#fillGrad)" />

          {/* Línea principal */}
          <Path d={pathLine} fill="none" stroke={activeColor} strokeWidth={2.5} />

          {/* Línea vertical de guía al punto seleccionado */}
          {activeIndex !== null && points[activeIndex] && (
            <Line
              x1={points[activeIndex].x}
              y1={points[activeIndex].y}
              x2={points[activeIndex].x}
              y2={height}
              stroke={activeColor}
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.6}
            />
          )}

          {/* Puntos destacados */}
          {points.map((p, idx) => {
            const isActive = activeIndex === idx;
            return (
              <React.Fragment key={idx}>
                {isActive ? (
                  // Punto seleccionado activo
                  <>
                    <Circle cx={p.x} cy={p.y} r={7} fill={activeColor} opacity={0.35} />
                    <Circle cx={p.x} cy={p.y} r={4} fill={colors.surface} stroke={activeColor} strokeWidth={2} />
                  </>
                ) : idx === points.length - 1 ? (
                  // Último punto destacado si no hay toques activos
                  <>
                    <Circle cx={p.x} cy={p.y} r={6} fill={activeColor} opacity={0.2} />
                    <Circle cx={p.x} cy={p.y} r={3.5} fill={activeColor} />
                  </>
                ) : (
                  <Circle cx={p.x} cy={p.y} r={2.5} fill={colors.surface} stroke={activeColor} strokeWidth={1.5} />
                )}
              </React.Fragment>
            );
          })}
        </Svg>

        {/* Tooltip Dinámico Flotante */}
        {activeIndex !== null && points[activeIndex] && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.max(4, Math.min(width - 84, tooltipPos.x - 40)),
                top: Math.max(4, tooltipPos.y - 42),
                backgroundColor: colors.textPrimary,
              },
            ]}
          >
            <Text style={[styles.tooltipValue, { color: colors.surface }]}>
              {points[activeIndex].val}
            </Text>
            <Text style={[styles.tooltipLabel, { color: colors.textPlaceholder }]}>
              Medición {activeIndex + 1}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: spacing.radiusCard,
    borderWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mainVal: {
    ...typography.subtitle,
    fontWeight: '800',
    marginTop: 2,
  },
  unit: {
    fontSize: 12,
    fontWeight: '400',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  graphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs - 2,
    borderRadius: 8,
    width: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  tooltipValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  tooltipLabel: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 1,
  },
});
