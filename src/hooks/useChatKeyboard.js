import { useEffect, useCallback, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Altura del teclado y scroll — solo UX del chat.
 * @param {(event?: import('react-native').KeyboardEvent) => void} [onShow]
 */
export function useChatKeyboard(onShow) {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const stableOnShow = useCallback(
    (event) => {
      const h = event?.endCoordinates?.height ?? 0;
      setKeyboardHeight(h);
      onShow?.(event);
    },
    [onShow]
  );

  const onHide = useCallback(() => {
    setKeyboardHeight(0);
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, stableOnShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [stableOnShow, onHide]);

  return {
    keyboardHeight,
    isKeyboardVisible: keyboardHeight > 0,
  };
}
