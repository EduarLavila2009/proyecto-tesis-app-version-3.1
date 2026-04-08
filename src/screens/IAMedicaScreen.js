import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import { PressableScale } from '../components';
import { spacing, typography, useTheme } from '../theme';

/**
 * IA médica simulada — layout tipo WhatsApp/Telegram:
 * SafeArea → KeyboardAvoiding (solo iOS) → columna flex → lista + input absoluto al pie.
 */

const getAIResponse = (userMessage, lastAiMessageText) => {
  const msg = userMessage.toLowerCase().trim();

  const genericResponses = [
    'Gracias por compartir cómo te sientes. Recuerda que esta orientación no reemplaza una consulta médica presencial. ¿Puedes contarme un poco más sobre tus síntomas (duración, intensidad, otros signos)?',
    'Entiendo tu preocupación. Mi objetivo es orientarte de forma responsable, pero no puedo hacer diagnósticos. Describe por favor qué sientes, desde cuándo y si hay algo que lo empeora o alivia.',
    'Te acompaño en esta consulta. Para orientarte mejor necesito que me cuentes qué síntomas tienes (por ejemplo, dolor, fiebre, tos, dificultad para respirar, malestar general, etc.).',
  ];

  const withSafetyNote = (text) =>
    `${text} Ten en cuenta que esta información es orientativa y no reemplaza una valoración médica presencial.`;

  let response = '';

  if (
    msg.includes('hola') ||
    msg.includes('buenos días') ||
    msg.includes('buenas tardes') ||
    msg.includes('buenas noches')
  ) {
    response =
      'Hola, soy el asistente médico virtual de MEDICAL corp. Puedo ayudarte a reflexionar sobre tus síntomas y cuándo es recomendable acudir a un profesional. ¿Qué es lo que más te preocupa ahora mismo?';
  } else if (msg.includes('gracias') || msg.includes('muchas gracias')) {
    response =
      'Con gusto. Me alegra poder orientarte. Si tus síntomas empeoran, aparecen otros nuevos o tienes dudas, por favor contacta con un profesional de salud.';
  } else if (msg.includes('me duele la cabeza') || (msg.includes('dolor') && msg.includes('cabeza'))) {
    response = withSafetyNote(
      'El dolor de cabeza puede tener muchas causas, desde tensión y estrés hasta otros orígenes. ¿Desde cuándo lo sientes, en qué zona de la cabeza y qué intensidad le darías del 1 al 10? Si el dolor es muy intenso, aparece de repente o se acompaña de visión borrosa, vómitos o dificultad para hablar, acude a urgencias de inmediato.'
    );
  } else if (msg.includes('dolor')) {
    response = withSafetyNote(
      'Entiendo que sientas dolor. ¿En qué parte del cuerpo lo notas, desde cuándo, y si es continuo o aparece por momentos? También ayuda saber si el dolor aumenta al moverte o al respirar, o si cede con reposo.'
    );
  } else if (msg.includes('tengo fiebre') || msg.includes('fiebre')) {
    response = withSafetyNote(
      'La fiebre suele ser una respuesta del cuerpo ante una infección. ¿Sabes qué temperatura tienes aproximadamente y desde hace cuánto tiempo? Si la fiebre es mayor a 38.5°C, dura más de 3 días o se acompaña de dificultad para respirar, dolor en el pecho, convulsiones o desorientación, debes acudir a un servicio de urgencias.'
    );
  } else if (msg.includes('me siento mal') || msg.includes('mal en general') || msg.includes('malestar')) {
    response = withSafetyNote(
      'Lamento que te sientas así. Cuando dices que te sientes mal, ¿te refieres a cansancio extremo, mareos, náuseas, tristeza, ansiedad u otro tipo de malestar? Cuéntame un poco más sobre qué notas en tu cuerpo o en tu estado de ánimo.'
    );
  } else if (msg.includes('tos')) {
    response = withSafetyNote(
      'La tos puede ser seca o con flema y puede deberse a cuadros respiratorios leves o a algo más serio. ¿Llevas muchos días con tos? ¿Es seca o con mucosidad? Si se acompaña de dificultad para respirar, dolor en el pecho, coloración azulada en labios o fiebre alta, es importante acudir a un centro de salud cuanto antes.'
    );
  } else if (msg.includes('qué me recomiendas') || msg.includes('que me recomiendas')) {
    response = withSafetyNote(
      'Puedo orientarte con información general, pero no puedo indicar tratamientos concretos. Lo primero es entender mejor tus síntomas: ¿qué sientes exactamente, desde cuándo y si tomas algún medicamento actualmente? Con esa información puedo ayudarte a valorar si es algo que puede vigilarse en casa o requiere atención médica.'
    );
  } else if (msg.includes('medicamento') || msg.includes('medicina') || msg.includes('pastilla')) {
    response = withSafetyNote(
      'No puedo recetar ni indicar medicamentos específicos. Los fármacos deben ser valorados por un profesional de salud que conozca tu historia clínica. Cuéntame qué síntomas tienes y si ya estás tomando algún tratamiento para poder orientarte de forma más segura.'
    );
  } else if (msg.includes('emergencia') || msg.includes('urgencia') || msg.includes('auxilio')) {
    response =
      'Si sospechas que estás ante una emergencia (dolor en el pecho intenso, dificultad para respirar, pérdida de conocimiento, síntomas neurológicos agudos u otros signos graves), no esperes: llama de inmediato a los servicios de urgencias de tu país o acude al centro de salud más cercano.';
  } else if (msg.includes('ansiedad') || msg.includes('estrés') || msg.includes('estres') || msg.includes('triste')) {
    response = withSafetyNote(
      'La ansiedad y el estrés también afectan muchísimo a cómo se siente nuestro cuerpo. ¿Has notado palpitaciones, dificultad para dormir, sensación de ahogo o preocupación constante? Si estos síntomas interfieren con tu vida diaria, sería recomendable hablar con un profesional de salud mental.'
    );
  } else if (
    msg.includes('estómago') ||
    msg.includes('estomago') ||
    msg.includes('náusea') ||
    msg.includes('nausea') ||
    msg.includes('diarrea')
  ) {
    response = withSafetyNote(
      'Los síntomas digestivos pueden tener muchas causas, desde infecciones leves hasta cuadros que requieren atención. ¿Tienes dolor abdominal, vómitos, diarrea o sangre en las heces? Si hay deshidratación (mucha sed, poca orina, mareos) o sangre, es importante acudir pronto a un servicio médico.'
    );
  } else if (msg.length < 3) {
    response = 'Para poder orientarte mejor, necesito que describas un poco más tu consulta o tus síntomas.';
  } else {
    const randomIndex = Math.floor(Math.random() * genericResponses.length);
    response = genericResponses[randomIndex];
  }

  if (lastAiMessageText && response === lastAiMessageText) {
    const alternatives = genericResponses.filter((r) => r !== lastAiMessageText);
    if (alternatives.length > 0) {
      const randomIndex = Math.floor(Math.random() * alternatives.length);
      response = alternatives[randomIndex];
    }
  }

  return response;
};

const BUBBLE_RADIUS = 20;
const INPUT_MIN_HEIGHT = Math.max(46, spacing.minTouchTarget);
const SEND_BUTTON_SIZE = Math.max(46, spacing.minTouchTarget);
export default function IAMedicaScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

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
  const [isTyping, setIsTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const flatListRef = useRef(null);

  const keyboardVerticalOffset = Platform.OS === 'ios' ? headerHeight + insets.top : 0;

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEYS.AI_MEDICAL_CHAT);
        if (cancelled) return;
        if (!raw) {
          setHydrated(true);
          return;
        }
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const normalized = parsed
            .filter((m) => m && typeof m === 'object')
            .map((m) => ({
              id: String(m.id ?? Date.now()),
              text: String(m.text ?? ''),
              isUser: Boolean(m.isUser),
              timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
            }))
            .filter((m) => m.text.trim().length > 0);
          if (normalized.length > 0) setMessages(normalized);
        }
      } catch (e) {
        console.error('IAMedicaScreen.hydrate', e);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      AsyncStorage.setItem(
        STORAGE_KEYS.AI_MEDICAL_CHAT,
        JSON.stringify(
          messages.map((m) => ({
            id: m.id,
            text: m.text,
            isUser: m.isUser,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date().toISOString(),
          }))
        )
      ).catch((e) => console.error('IAMedicaScreen.persist', e));
    }, 220);
    return () => clearTimeout(t);
  }, [messages, hydrated]);

  useEffect(() => {
    const t = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(t);
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text) return;

    Keyboard.dismiss();
    const userMsg = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setInputText('');

    let lastAiText = '';
    setMessages((prev) => {
      const lastAi = [...prev].reverse().find((m) => !m.isUser);
      lastAiText = lastAi?.text || '';
      return [...prev, userMsg];
    });

    setIsTyping(true);
    setTimeout(() => {
      const aiResponse = getAIResponse(text, lastAiText);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  const renderMessage = useCallback(({ item }) => (
    <View
      style={[styles.messageRow, item.isUser ? styles.userRow : styles.aiRow]}
    >
      <View
        style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}
      >
        <Text
          style={[
            styles.bubbleText,
            item.isUser ? styles.userText : styles.aiText,
          ]}
          allowFontScaling
        >
          {item.text}
        </Text>
      </View>
    </View>
  ), [styles]);

  const ListTyping = useCallback(
    () => (
      <View style={[styles.messageRow, styles.aiRow]}>
        <View style={styles.typingBubble}>
          <Text style={styles.typingLabel} allowFontScaling>
            Escribiendo…
          </Text>
          <View style={styles.typingDots}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </View>
        </View>
      </View>
    ),
    [styles]
  );

  const chatBody = (
    <View style={styles.mainColumn}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        ListFooterComponent={isTyping ? <ListTyping /> : null}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: spacing.md },
        ]}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        onContentSizeChange={() => scrollToBottom()}
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          style={styles.input}
          placeholder="Escribe tu mensaje..."
          placeholderTextColor={colors.textPlaceholder}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          blurOnSubmit={false}
          selectionColor={colors.primary}
          {...(Platform.OS === 'android' && { cursorColor: colors.primary })}
          accessibilityLabel="Campo de mensaje para el asistente médico"
          allowFontScaling
        />
        <PressableScale
          style={[
            styles.sendButton,
            !inputText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !inputText.trim() }}
        >
          <Ionicons
            name="send"
            size={22}
            color={inputText.trim() ? colors.onPrimary : colors.textSecondary}
          />
        </PressableScale>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled
      >
        {chatBody}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  mainColumn: {
    flex: 1,
    position: 'relative',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  messageRow: {
    marginBottom: spacing.md,
  },
  userRow: {
    alignItems: 'flex-end',
  },
  aiRow: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '86%',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.md,
    borderRadius: BUBBLE_RADIUS,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bubbleText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.fontSize * 1.5,
    letterSpacing: 0.15,
  },
  userText: {
    color: colors.onPrimary,
  },
  aiText: {
    color: colors.textPrimary,
  },
  typingBubble: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: BUBBLE_RADIUS,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  typingLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: '700',
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
    backgroundColor: colors.textSecondary,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: spacing.radiusXl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    lineHeight: 22,
    color: colors.textPrimary,
    minHeight: INPUT_MIN_HEIGHT,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sendButton: {
    width: SEND_BUTTON_SIZE,
    height: SEND_BUTTON_SIZE,
    borderRadius: SEND_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
  });
}
