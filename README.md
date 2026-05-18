# 🏥 MEDICAL corp — App de Monitoreo de Salud Inteligente

Aplicación móvil desarrollada con **React Native + Expo** enfocada en el monitoreo de salud en tiempo real, conexión entre pacientes y médicos, y asistencia mediante inteligencia artificial.

---

## 🚀 Descripción

**MEDICAL corp** es una app diseñada para mejorar el seguimiento médico remoto, permitiendo a los usuarios visualizar sus métricas de salud, recibir orientación mediante IA y conectar con profesionales de la salud de forma sencilla.

---

## ✨ Funcionalidades principales

### 👤 Sistema de usuarios

* Registro e inicio de sesión
* Perfil editable
* Imagen de perfil personalizada
* Persistencia de datos con AsyncStorage

---

### 🎨 Sistema de diseño global

* Tema unificado (`src/theme/`: colores, tipografía, espaciado, layout)
* Componentes UI reutilizables (`Button`, `Input`, `Card`, `ScreenHeader`, etc.)
* Modo claro/oscuro con `ThemeProvider` y `expo-system-ui`
* Accesibilidad: español, contraste ≥4.5:1, targets táctiles ≥44px
* Guía completa: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

---

### 🌙 Modo oscuro / claro

* Cambio dinámico de tema
* Persistencia de preferencia
* Aplicado en toda la aplicación

---

### 📊 Monitoreo de salud

* Ritmo cardíaco (bpm)
* Temperatura corporal
* Presión arterial
* Nivel de oxígeno (SpO₂)

---

### 📁 Historial clínico

* Registros médicos organizados por fecha
* Visualización clara y estructurada

---

### 🤖 IA médica (asistente virtual)

* Chat interactivo
* Orientación básica sobre síntomas
* Diseño tipo mensajería moderna

---

### 🔗 Conexión médico - paciente (QR)

* Generación de QR para pacientes
* Escaneo desde cuenta médica
* Vinculación entre usuarios

---

### 👨‍⚕️ Panel médico

* Visualización de pacientes conectados
* Acceso a métricas y datos
* Interfaz profesional

---

### 🔔 Sistema de alertas

* Detección de valores anormales
* Indicadores visuales de estado

---

## 🛠️ Tecnologías utilizadas

* React Native
* Expo
* AsyncStorage
* Expo Image Picker
* Expo Camera (escáner QR)
* Expo System UI (fondo del sistema / status bar)
* React Navigation
* React Native SVG

---

## 📦 Instalación

```bash
git clone https://github.com/EduarLavila2009/proyecto-tesis-app-version-3.1
cd proyecto-tesis-app-version-3.1
npm install
npx expo install expo-system-ui expo-camera
npx expo start -c
```

### Capturas en Expo Go

1. Ejecuta `npx expo start -c` y abre el proyecto en **Expo Go** (Android/iOS).
2. Revisa: selección de rol → login → registro → (médico) vincular paciente / escáner QR.
3. En Ajustes, alterna modo oscuro para validar el tema.
4. Toma capturas desde el dispositivo o el menú de desarrollo de Expo.

---

## 📱 Uso

1. Seleccionar tipo de usuario (Paciente o Médico)
2. Crear cuenta o iniciar sesión
3. Acceder al dashboard
4. Visualizar métricas de salud
5. Conectar con médico mediante QR
6. Usar IA médica

---

## 🎯 Estado del proyecto

🚧 En desarrollo activo

Próximas mejoras:

* Gráficas de métricas
* Backend real (API / Firebase)
* Notificaciones push
* IA avanzada con contexto del usuario

---

## 📌 Autor

Desarrollado por **Eduar Lavila**

---

## ⚠️ Aviso

Esta aplicación es únicamente informativa y **no reemplaza una consulta médica profesional**.
