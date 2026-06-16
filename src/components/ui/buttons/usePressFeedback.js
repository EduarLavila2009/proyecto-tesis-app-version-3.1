import { useRef, useCallback } from 'react';

import { Animated } from 'react-native';

import { motion } from '../../../theme/motion';



/**

 * Escala al presionar (feedback táctil unificado) — scale 0.95 → 1.

 */

export function usePressFeedback(disabled = false) {

  const scale = useRef(new Animated.Value(1)).current;



  const springTo = useCallback(

    (value) => {

      Animated.spring(scale, {

        toValue: value,

        ...motion.spring.press,

      }).start();

    },

    [scale]

  );



  const onPressIn = useCallback(() => {

    if (!disabled) {

      try {

        const Haptics = require('expo-haptics');

        Haptics.selectionAsync();

      } catch (_) {}

      springTo(motion.scale.pressed);

    }

  }, [disabled, springTo]);



  const onPressOut = useCallback(() => {

    springTo(1);

  }, [springTo]);



  return { scale, onPressIn, onPressOut };

}


