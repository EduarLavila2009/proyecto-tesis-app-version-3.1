import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { spacing, typography, useTheme } from '../theme';

export default function VideoCallScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  
  const { contactName, role } = route.params || { contactName: 'Médico de Guardia', role: 'doctor' };
  
  const [callState, setCallState] = useState('connecting'); // 'connecting' | 'active' | 'ended'
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    // Simular conexión rápida en 1.5s
    const connTimer = setTimeout(() => {
      setCallState('active');
    }, 1500);

    return () => clearTimeout(connTimer);
  }, []);

  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  const handleEndCall = () => {
    setCallState('ended');
    setTimeout(() => {
      navigation.goBack();
    }, 800);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1) Stream de Video de Fondo (Simulado) */}
      <LinearGradient
        colors={[colors.primaryPressed, colors.background]}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Imagen/Vista simulando al otro participante */}
      <View style={styles.remoteVideoContainer}>
        {isVideoOff && role === 'doctor' ? (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarLetter}>{contactName[0]}</Text>
          </View>
        ) : (
          <View style={styles.callOverlay}>
            <Ionicons name="videocam-outline" size={80} color="rgba(255, 255, 255, 0.15)" />
            <Text style={styles.videoSimText}>Teleconsulta Activa</Text>
          </View>
        )}
      </View>

      {/* 2) Stream de Video Local (Miniatura flotante) */}
      <View style={styles.localVideoContainer}>
        <LinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(0,0,0,0.45)']}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name="person-outline" size={24} color="#FFFFFF" />
        <Text style={styles.localVideoText}>Tú</Text>
      </View>

      {/* 3) Header superior de Información */}
      <SafeAreaView style={styles.safeHeader} edges={['top']}>
        <View style={styles.headerInfo}>
          <Text style={styles.callerName}>{contactName}</Text>
          <Text style={styles.callerStatus}>
            {callState === 'connecting' 
              ? 'Conectando...' 
              : callState === 'active' 
                ? `Llamada en curso · ${formatTime(seconds)}` 
                : 'Llamada finalizada'}
          </Text>
        </View>
      </SafeAreaView>

      {/* 4) Controles Inferiores Flotantes (Glassmorphism) */}
      <SafeAreaView style={styles.safeFooter} edges={['bottom']}>
        <View style={styles.controlsPanel}>
          {/* Botón Silenciar Micrófono */}
          <TouchableOpacity 
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]} 
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons 
              name={isMuted ? 'mic-off-outline' : 'mic-outline'} 
              size={24} 
              color={isMuted ? colors.danger : '#FFFFFF'} 
            />
          </TouchableOpacity>

          {/* Botón Colgar (Rojo) */}
          <TouchableOpacity 
            style={[styles.controlBtn, styles.hangupBtn]} 
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={28} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Botón Apagar Cámara */}
          <TouchableOpacity 
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]} 
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Ionicons 
              name={isVideoOff ? 'videocam-off-outline' : 'videocam-outline'} 
              size={24} 
              color={isVideoOff ? colors.danger : '#FFFFFF'} 
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  remoteVideoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.85,
  },
  videoSimText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 110,
    height: 160,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  localVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    position: 'absolute',
    bottom: 8,
  },
  safeHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerInfo: {
    alignItems: 'center',
    paddingTop: spacing.m,
  },
  callerName: {
    fontSize: typography.h2.fontSize,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  callerStatus: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  safeFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlBtnActive: {
    backgroundColor: '#FFFFFF',
  },
  hangupBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EF4444',
  },
});
