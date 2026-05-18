import { spacing } from './spacing';
import { layout } from './layout';

/**
 * Tokens de layout del chat IA — alineados con Material / tema MEDICAL corp.
 */
export const chatLayout = {
  bubbleRadius: 20,
  bubbleTailRadius: 4,
  bubbleMaxWidthRatio: 0.82,
  bubbleMaxWidthRatioLandscape: 0.62,
  bubbleMaxWidthPx: 340,
  inputMinHeight: Math.max(46, spacing.minTouchTarget),
  inputMaxHeight: 120,
  inputBarPaddingTop: spacing.sm,
  inputBarPaddingH: layout.screenPaddingH,
  listPaddingTop: spacing.m,
  listPaddingBottom: spacing.m,
  listExtraScrollPadding: spacing.l,
  messageGap: spacing.m,
  /** Menor separación entre mensajes consecutivos del mismo emisor */
  messageGapGrouped: spacing.xs,
  avatarSize: 32,
  disclaimerPadding: spacing.m,
};

/** Ancho máximo de burbuja según orientación. */
export function getChatBubbleMaxWidth(windowWidth, windowHeight) {
  const landscape = windowWidth > windowHeight;
  const ratio = landscape
    ? chatLayout.bubbleMaxWidthRatioLandscape
    : chatLayout.bubbleMaxWidthRatio;
  return Math.min(windowWidth * ratio, chatLayout.bubbleMaxWidthPx);
}
