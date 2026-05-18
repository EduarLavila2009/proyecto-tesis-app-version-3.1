import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenContainer from './ScreenContainer';
import { layout, screenScrollContent } from '../../theme';

/**
 * Layout estándar para pantallas dentro de Bottom Tabs (sin header nativo).
 */
export default function TabScreenLayout({
  children,
  scroll = true,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
  ...rest
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = layout.screenPaddingBottom + insets.bottom;

  return (
    <ScreenContainer
      scroll={scroll}
      edges={edges}
      contentContainerStyle={[
        screenScrollContent({ paddingBottom: bottomPad }),
        contentContainerStyle,
      ]}
      {...rest}
    >
      {children}
    </ScreenContainer>
  );
}
