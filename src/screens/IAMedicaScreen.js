import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import spacing from '../constants/spacing';
import { fontSizes } from '../constants/typography';
import { ICON_SIZES } from '../constants/icons';
import { PressableScale } from '../components';

/**
 * IA médica simulada - Chat de demostración
 * Respuestas basadas en reglas y palabras clave (sin APIs externas)
 * Base para futura implementación con IA real
 *
 * Mejoras:
 * - Experiencia de chat más humana, responsable y empática
 * - Mejor manejo de teclado en iOS / Android
 * - Input siempre visible y cómodo para escribir mensajes largos
 */

// Lógica de respuestas simuladas según palabras clave y contexto reciente
const getAIResponse = (userMessage, lastAiMessageText) => {
  const msg = userMessage.toLowerCase().trim();

  // Respuestas genéricas responsables (para evitar repetición)
  const genericResponses = [
    'Gracias por compartir cómo te sientes. Recuerda que esta orientación no reemplaza una consulta médica presencial. ¿Puedes contarme un poco más sobre tus síntomas (duración, intensidad, otros signos)?',
    'Entiendo tu preocupación. Mi objetivo es orientarte de forma responsable, pero no puedo hacer diagnósticos. Describe por favor qué sientes, desde cuándo y si hay algo que lo empeora o alivia.',
    'Te acompaño en esta consulta. Para orientarte mejor necesito que me cuentes qué síntomas tienes (por ejemplo, dolor, fiebre, tos, dificultad para respirar, malestar general, etc.).',
  ];

  const withSafetyNote = (text) =>
    `${text} Ten en cuenta que esta información es orientativa y no reemplaza una valoración médica presencial.`;

  let response = '';

  // Saludos iniciales
  if (
    msg.includes('hola') ||
    msg.includes('buenos días') ||
    msg.includes('buenas tardes') ||
    msg.includes('buenas noches')
  ) {
    response =
      'Hola, soy el asistente médico virtual de MEDICAL corp. Puedo ayudarte a reflexionar sobre tus síntomas y cuándo es recomendable acudir a un profesional. ¿Qué es lo que más te preocupa ahora mismo?';
  }
  // Agradecimientos
  else if (msg.includes('gracias') || msg.includes('muchas gracias')) {
    response =
      'Con gusto. Me alegra poder orientarte. Si tus síntomas empeoran, aparecen otros nuevos o tienes dudas, por favor contacta con un profesional de salud.';
  }
  // Dolor de cabeza específico
  else if (msg.includes('me duele la cabeza') || (msg.includes('dolor') && msg.includes('cabeza'))) {
    response = withSafetyNote(
      'El dolor de cabeza puede tener muchas causas, desde tensión y estrés hasta otros orígenes. ¿Desde cuándo lo sientes, en qué zona de la cabeza y qué intensidad le darías del 1 al 10? Si el dolor es muy intenso, aparece de repente o se acompaña de visión borrosa, vómitos o dificultad para hablar, acude a urgencias de inmediato.'
    );
  }
  // Dolor en general
  else if (msg.includes('dolor')) {
    response = withSafetyNote(
      'Entiendo que sientas dolor. ¿En qué parte del cuerpo lo notas, desde cuándo, y si es continuo o aparece por momentos? También ayuda saber si el dolor aumenta al moverte o al respirar, o si cede con reposo.'
    );
  }
  // Fiebre / "tengo fiebre"
  else if (msg.includes('tengo fiebre') || msg.includes('fiebre')) {
    response = withSafetyNote(
      'La fiebre suele ser una respuesta del cuerpo ante una infección. ¿Sabes qué temperatura tienes aproximadamente y desde hace cuánto tiempo? Si la fiebre es mayor a 38.5°C, dura más de 3 días o se acompaña de dificultad para respirar, dolor en el pecho, convulsiones o desorientación, debes acudir a un servicio de urgencias.'
    );
  }
  // "Me siento mal" o malestar general
  else if (msg.includes('me siento mal') || msg.includes('mal en general') || msg.includes('malestar')) {
    response = withSafetyNote(
      'Lamento que te sientas así. Cuando dices que te sientes mal, ¿te refieres a cansancio extremo, mareos, náuseas, tristeza, ansiedad u otro tipo de malestar? Cuéntame un poco más sobre qué notas en tu cuerpo o en tu estado de ánimo.'
    );
  }
  // Tos
  else if (msg.includes('tos')) {
    response = withSafetyNote(
      'La tos puede ser seca o con flema y puede deberse a cuadros respiratorios leves o a algo más serio. ¿Llevas muchos días con tos? ¿Es seca o con mucosidad? Si se acompaña de dificultad para respirar, dolor en el pecho, coloración azulada en labios o fiebre alta, es importante acudir a un centro de salud cuanto antes.'
    );
  }
  // Preguntas del tipo "qué me recomiendas"
  else if (msg.includes('qué me recomiendas') || msg.includes('que me recomiendas')) {
    response = withSafetyNote(
      'Puedo orientarte con información general, pero no puedo indicar tratamientos concretos. Lo primero es entender mejor tus síntomas: ¿qué sientes exactamente, desde cuándo y si tomas algún medicamento actualmente? Con esa información puedo ayudarte a valorar si es algo que puede vigilarse en casa o requiere atención médica.'
    );
  }
  // Mención de medicamentos
  else if (msg.includes('medicamento') || msg.includes('medicina') || msg.includes('pastilla')) {
    response = withSafetyNote(
      'No puedo recetar ni indicar medicamentos específicos. Los fármacos deben ser valorados por un profesional de salud que conozca tu historia clínica. Cuéntame qué síntomas tienes y si ya estás tomando algún tratamiento para poder orientarte de forma más segura.'
    );
  }
  // Emergencias
  else if (msg.includes('emergencia') || msg.includes('urgencia') || msg.includes('auxilio')) {
    response =
      'Si sospechas que estás ante una emergencia (dolor en el pecho intenso, dificultad para respirar, pérdida de conocimiento, síntomas neurológicos agudos u otros signos graves), no esperes: llama de inmediato a los servicios de urgencias de tu país o acude al centro de salud más cercano.';
  }
  // Ansiedad / estrés / estado de ánimo
  else if (msg.includes('ansiedad') || msg.includes('estrés') || msg.includes('estres') || msg.includes('triste')) {
    response = withSafetyNote(
      'La ansiedad y el estrés también afectan muchísimo a cómo se siente nuestro cuerpo. ¿Has notado palpitaciones, dificultad para dormir, sensación de ahogo o preocupación constante? Si estos síntomas interfieren con tu vida diaria, sería recomendable hablar con un profesional de salud mental.'
    );
  }
  // Síntomas digestivos básicos
  else if (
    msg.includes('estómago') ||
    msg.includes('estomago') ||
    msg.includes('náusea') ||
    msg.includes('nausea') ||
    msg.includes('diarrea')
  ) {
    response = withSafetyNote(
      'Los síntomas digestivos pueden tener muchas causas, desde infecciones leves hasta cuadros que requieren atención. ¿Tienes dolor abdominal, vómitos, diarrea o sangre en las heces? Si hay deshidratación (mucha sed, poca orina, mareos) o sangre, es importante acudir pronto a un servicio médico.'
    );
  }
  // Mensajes muy cortos
  else if (msg.length < 3) {
    response = 'Para poder orientarte mejor, necesito que describas un poco más tu consulta o tus síntomas.';
  }
  // Genérico cuando no hay coincidencia clara
  else {
    const randomIndex = Math.floor(Math.random() * genericResponses.length);
    response = genericResponses[randomIndex];
  }

  // Evitar repetir exactamente la misma frase que el último mensaje de la IA
  if (lastAiMessageText && response === lastAiMessageText) {
    const alternatives = genericResponses.filter((r) => r !== lastAiMessageText);
    if (alternatives.length > 0) {
      const randomIndex = Math.floor(Math.random() * alternatives.length);
      response = alternatives[randomIndex];
    }
  }

  return response;
};

export default function IAMedicaScreen() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text:
        'Hola, soy el asistente médico virtual de MEDICAL corp. Puedo ayudarte a comprender mejor tus síntomas y a orientarte sobre cuándo consultar a un profesional. ' +
        'Esta información es solo orientativa y no reemplaza una consulta médica presencial. ¿Qué es lo que más te preocupa en este momento?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false); // Simula que la IA está "escribiendo"
  const scrollViewRef = useRef(null);

  // Scroll automático al agregar mensajes o al mostrar el indicador de escritura
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, [messages, isTyping]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userMsg = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Obtener el último mensaje de la IA para evitar respuestas idénticas seguidas
    const lastAiMessage = [...messages].reverse().find((m) => !m.isUser);

    // Simular breve delay antes de responder (experiencia más natural)
    setIsTyping(true);
    setTimeout(() => {
      const aiResponse = getAIResponse(text, lastAiMessage?.text);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800); // ligero aumento del delay para dar sensación de "pensar"
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.innerContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[styles.messageRow, msg.isUser ? styles.userRow : styles.aiRow]}
              >
                <View
                  style={[
                    styles.bubble,
                    msg.isUser ? styles.userBubble : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      msg.isUser ? styles.userText : styles.aiText,
                    ]}
                    allowFontScaling
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            ))}

            {isTyping && (
              <View style={[styles.messageRow, styles.aiRow]}>
                <View style={[styles.typingBubble]}>
                  <View style={styles.typingDots}>
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                    <View style={styles.typingDot} />
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu mensaje..."
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
              accessibilityLabel="Campo de mensaje para el asistente médico"
              allowFontScaling
            />
            <PressableScale
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!inputText.trim()}
              accessibilityRole="button"
              accessibilityLabel="Enviar mensaje"
              accessibilityState={{ disabled: !inputText.trim() }}
            >
              <Ionicons
                name="send-outline"
                size={ICON_SIZES.action}
                color={inputText.trim() ? colors.white : colors.textMuted}
              />
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const BUBBLE_RADIUS = 18;
const INPUT_MIN_HEIGHT = 44;
const SEND_BUTTON_SIZE = 44;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  innerContainer: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  messageRow: {
    marginBottom: spacing.lg,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  aiRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: BUBBLE_RADIUS,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bubbleText: {
    fontSize: fontSizes.base - 1,
    lineHeight: 23,
    letterSpacing: 0.2,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.text,
  },
  typingBubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: BUBBLE_RADIUS,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.cardMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 20 : 25,
    backgroundColor: colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: INPUT_MIN_HEIGHT / 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingRight: spacing.lg,
    fontSize: fontSizes.base - 1,
    color: colors.text,
    minHeight: INPUT_MIN_HEIGHT,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.buttonSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
});
