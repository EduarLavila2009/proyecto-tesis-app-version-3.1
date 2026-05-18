import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, useTheme, getChatBubbleMaxWidth, chatLayout } from '../../theme';
import { spacing } from '../../theme/spacing';

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Burbuja de chat — usuario (primary, derecha) vs IA (secondaryMuted, izquierda + avatar).
 */
function ChatMessageBubble({
  text,
  isUser,
  timestamp,
  showTimestamp = true,
  isGrouped = false,
}) {
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, isGrouped), [colors, isGrouped]);

  const maxBubbleWidth = getChatBubbleMaxWidth(width, height);
  const timeLabel = showTimestamp ? formatMessageTime(timestamp) : '';

  if (isUser) {
    return (
      <View style={[styles.row, styles.rowUser]}>
        <View style={[styles.columnUser, { maxWidth: maxBubbleWidth }]}>
          <View style={[styles.bubble, styles.bubbleUser]}>
            <Text style={[styles.text, styles.textUser]} allowFontScaling selectable>
              {text}
            </Text>
          </View>
          {timeLabel ? (
            <Text style={styles.timestampUser} allowFontScaling>
              {timeLabel}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowAi]}>
      <View
        style={[styles.avatar, isGrouped && styles.avatarGrouped]}
        accessibilityElementsHidden
      >
        {!isGrouped ? (
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        ) : null}
      </View>
      <View style={[styles.columnAi, { maxWidth: maxBubbleWidth }]}>
        {!isGrouped ? (
          <Text style={styles.senderLabel} allowFontScaling>
            Asistente IA
          </Text>
        ) : null}
        <View style={[styles.bubble, styles.bubbleAi]}>
          <Text style={[styles.text, styles.textAi]} allowFontScaling selectable>
            {text}
          </Text>
        </View>
        {timeLabel ? (
          <Text style={styles.timestampAi} allowFontScaling>
            {timeLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export default React.memo(ChatMessageBubble);

function createStyles(colors, isGrouped) {
  return StyleSheet.create({
    row: {
      marginBottom: isGrouped ? chatLayout.messageGapGrouped : chatLayout.messageGap,
      width: '100%',
    },
    rowUser: {
      alignItems: 'flex-end',
    },
    rowAi: {
      flexDirection: 'row',
      alignItems: 'flex-end',
    },
    columnUser: {
      alignItems: 'flex-end',
    },
    columnAi: {
      flex: 1,
      minWidth: 0,
      alignItems: 'flex-start',
    },
    avatar: {
      width: chatLayout.avatarSize,
      height: chatLayout.avatarSize,
      borderRadius: chatLayout.avatarSize / 2,
      backgroundColor: colors.secondaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
      marginBottom: spacing.xs,
    },
    avatarGrouped: {
      backgroundColor: 'transparent',
    },
    senderLabel: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      marginLeft: spacing.xs / 2,
    },
    bubble: {
      paddingVertical: spacing.m - 2,
      paddingHorizontal: spacing.m,
      borderRadius: chatLayout.bubbleRadius,
    },
    bubbleUser: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: chatLayout.bubbleTailRadius,
    },
    bubbleAi: {
      backgroundColor: colors.secondaryMuted,
      borderBottomLeftRadius: chatLayout.bubbleTailRadius,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    text: {
      fontSize: typography.body.fontSize,
      lineHeight: typography.body.lineHeight,
      flexShrink: 1,
    },
    textUser: {
      color: colors.onPrimary,
      fontWeight: typography.body.fontWeight,
    },
    textAi: {
      color: colors.textPrimary,
      fontWeight: typography.body.fontWeight,
    },
    timestampUser: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginTop: spacing.xs,
      marginRight: spacing.xs / 2,
      fontSize: 11,
    },
    timestampAi: {
      ...typography.caption,
      color: colors.textPlaceholder,
      marginTop: spacing.xs,
      marginLeft: spacing.xs / 2,
      fontSize: 11,
    },
  });
}
