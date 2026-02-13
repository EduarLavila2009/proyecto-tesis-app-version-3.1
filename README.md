🏥 MEDICAL corp – Aplicación Digital del Sistema RAMP

Aplicación móvil desarrollada como parte del proyecto de tesis:

“Construcción de un Robot Mecánico Médico Personal para la asistencia de la salud pública integral haciendo uso de la Inteligencia Artificial”

Esta aplicación representa el componente digital del sistema RAMP (Robot Asistente Médico Personal), funcionando como interfaz de interacción entre pacientes, especialistas y el prototipo robótico.

🎯 Objetivo del Sistema

La aplicación busca:

Digitalizar el registro clínico básico del paciente.

Facilitar la organización de datos médicos.

Integrar un asistente médico virtual con IA simulada.

Servir como base para la futura conexión con el robot físico NEUROBOT.

Establecer una arquitectura escalable hacia un sistema clínico más robusto.

🧠 Arquitectura del Proyecto

La aplicación está diseñada bajo una arquitectura modular preparada para escalar hacia:

Integración con backend clínico.

Comunicación con hardware robótico.

Implementación futura de IA real basada en modelos externos.

Gestión avanzada de pacientes para especialistas.

⚙ Tecnologías Utilizadas

Expo SDK 54

React Native

React Navigation (Stack Navigator)

AsyncStorage (persistencia local)

JavaScript

🏗 Estructura del Proyecto
src/
├── screens/        # Pantallas principales del sistema
├── navigation/     # Configuración de navegación
├── components/     # Componentes reutilizables
├── constants/      # Colores, claves de almacenamiento

🔐 Sistema de Autenticación

Registro con generación automática de ID único:

PAC-000X (Paciente)

MED-000X (Médico)

Persistencia de sesión automática.

Separación por roles.

Gestión local de usuarios mediante AsyncStorage.

🩺 Funcionalidades Implementadas
Fase 1 – Base del Sistema

Selección de rol (Paciente / Médico)

Registro de usuario con ID único

Inicio de sesión con validaciones

Persistencia automática de sesión

Menú dinámico según rol

Fase 2 – Gestión Clínica del Paciente

Historial médico editable:

Tipo de sangre

Alergias

Enfermedades crónicas

Medicamentos

Notas

Persistencia estructurada en almacenamiento local

Identificación por ID único

Fase 3 – Módulo Médico

Lista de pacientes registrados

Visualización del historial médico por ID

Restricción de acceso por rol

Fase 4 – Asistente Médico Virtual (IA Simulada)

Chat interactivo tipo conversación

Detección básica de síntomas por palabras clave

Respuestas responsables con advertencia médica

Simulación de escritura

Scroll automático

Persistencia de experiencia conversacional

🤖 Visión Futura

El sistema está diseñado para integrarse con:

Robot físico NEUROBOT.

Sensores biomédicos.

Monitoreo remoto.

IA predictiva real.

Infraestructura hospitalaria pública.

La aplicación constituye el núcleo digital del ecosistema RAMP.

🚀 Instalación y Ejecución
cd medical-corp-app
npm install
npx expo start


Abrir Expo Go y escanear el código QR.

📌 Estado Actual del Proyecto

Versión funcional con:

Control de roles.

Persistencia estructurada.

Identificación única por paciente.

Arquitectura lista para backend.

Base preparada para expansión clínica y robótica.
