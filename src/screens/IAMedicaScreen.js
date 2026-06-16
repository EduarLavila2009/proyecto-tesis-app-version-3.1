import React, { useState, useRef, useEffect, useCallback, useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage';
import {
  AnimatedChatMessageBubble,
  ChatComposer,
  ChatHeaderTitle,
  ChatTypingIndicator,
} from '../components';
import { spacing, typography, chatLayout, useTheme } from '../theme';
import { useChatKeyboard } from '../hooks/useChatKeyboard';

const QUICK_REPLIES = [
  "Tengo dolor de cabeza",
  "Tengo fiebre alta",
  "Me duele el estómago",
  "Siento ansiedad",
  "¿Cuándo es una emergencia?"
];

/**
 * IA médica simulada — chat tipo mensajería.
 * Layout: KAV (iOS) + FlatList + barra de composición fija con ajuste de teclado en Android.
 * Lógica de respuestas: getAIResponse (sin cambios).
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
      'Lamento que te sientas así. Cuando dices que te sientas mal, ¿te refieres a cansancio extremo, mareos, náuseas, tristeza, ansiedad u otro tipo de malestar? Cuéntame un poco más sobre qué notas en tu cuerpo o en tu estado de ánimo.'
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

const LIST_PERF = {
  initialNumToRender: 12,
  maxToRenderPerBatch: 8,
  windowSize: 9,
  removeClippedSubviews: Platform.OS === 'android',
};

export default function IAMedicaScreen() {
  const navigation = useNavigation();
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
  const [inputBarHeight, setInputBarHeight] = useState(72);

  const flatListRef = useRef(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => <ChatHeaderTitle />,
    });
  }, [navigation]);

  const keyboardVerticalOffset =
    Platform.OS === 'ios' ? headerHeight : 0;

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  const { keyboardHeight, isKeyboardVisible } = useChatKeyboard(() => {
    scrollToBottom(true);
  });

  const listPaddingBottom = useMemo(() => {
    return inputBarHeight + spacing.m + spacing.sm;
  }, [inputBarHeight]);

  const listContentStyle = useMemo(
    () => [styles.listContent, { paddingBottom: listPaddingBottom }],
    [styles.listContent, listPaddingBottom]
  );

  /** En Android con `softwareKeyboardLayoutMode: resize` el sistema redimensiona la ventana. */
  const inputBarBottomPad = useMemo(() => {
    return isKeyboardVisible ? spacing.sm : Math.max(insets.bottom, spacing.sm);
  }, [insets.bottom, isKeyboardVisible]);

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
            timestamp:
              m.timestamp instanceof Date
                ? m.timestamp.toISOString()
                : new Date().toISOString(),
          }))
        )
      ).catch((e) => console.error('IAMedicaScreen.persist', e));
    }, 220);
    return () => clearTimeout(t);
  }, [messages, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => scrollToBottom(false), 120);
    return () => clearTimeout(t);
  }, [hydrated, scrollToBottom]);

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom(true), 80);
    return () => clearTimeout(t);
  }, [messages, isTyping, scrollToBottom, inputBarHeight, keyboardHeight]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isTyping) return;

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

    Keyboard.dismiss();
    scrollToBottom(true);

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

  const renderMessage = useCallback(
    ({ item, index }) => {
      const prev = index > 0 ? messages[index - 1] : null;
      const isGrouped = prev != null && prev.isUser === item.isUser;

      return (
        <AnimatedChatMessageBubble
          text={item.text}
          isUser={item.isUser}
          timestamp={item.timestamp}
          isGrouped={isGrouped}
        />
      );
    },
    [messages]
  );

  const ListDisclaimer = useCallback(
    () => (
      <View style={styles.disclaimer} accessibilityRole="text">
        <Text style={styles.disclaimerText} allowFontScaling>
          Orientación informativa · No sustituye consulta médica presencial
        </Text>
      </View>
    ),
    [styles]
  );

  const onInputBarLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && Math.abs(h - inputBarHeight) > 2) {
      setInputBarHeight(h);
    }
  }, [inputBarHeight]);

  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={keyboardVerticalOffset}
        enabled={Platform.OS === 'ios'}
      >
        <View style={styles.mainColumn}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            ListHeaderComponent={ListDisclaimer}
            ListFooterComponent={isTyping ? <ChatTypingIndicator /> : null}
            contentContainerStyle={listContentStyle}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            onContentSizeChange={() => scrollToBottom(false)}
            automaticallyAdjustKeyboardInsets={true}
            maintainVisibleContentPosition={
              Platform.OS === 'ios'
                ? { minIndexForVisible: 0, autoscrollToTopThreshold: 24 }
                : undefined
            }
            extraData={{ messages, isTyping }}
            {...LIST_PERF}
          />

          <View
            onLayout={onInputBarLayout}
            style={[
              styles.inputBar,
              { paddingBottom: inputBarBottomPad },
            ]}
          >
            {/* Chips de respuestas rápidas horizontal */}
            {!isTyping && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.quickRepliesScroll}
                contentContainerStyle={styles.quickRepliesContent}
              >
                {QUICK_REPLIES.map((q, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickReplyChip}
                    onPress={() => setInputText(q)}
                  >
                    <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
                    <Text style={styles.quickReplyText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <ChatComposer
              value={inputText}
              onChangeText={setInputText}
              onSend={handleSend}
              sendDisabled={isTyping}
              placeholder="Escribe tu síntoma o consulta…"
            />
          </View>
        </View>
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
    },
    list: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      flexGrow: 1,
      paddingHorizontal: chatLayout.inputBarPaddingH,
      paddingTop: chatLayout.listPaddingTop,
    },
    disclaimer: {
      alignSelf: 'center',
      backgroundColor: colors.secondaryMuted,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.m,
      borderRadius: spacing.radiusLg,
      marginBottom: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    disclaimerText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    inputBar: {
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSubtle,
      paddingHorizontal: chatLayout.inputBarPaddingH,
      paddingTop: chatLayout.inputBarPaddingTop,
    },
    quickRepliesScroll: {
      marginBottom: spacing.sm,
    },
    quickRepliesContent: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    quickReplyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.borderSubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm - 2,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    quickReplyText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
