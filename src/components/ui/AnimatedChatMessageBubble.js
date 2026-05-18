import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { motion } from '../../theme/motion';
import ChatMessageBubble from './ChatMessageBubble';

/**
 * Burbuja con entrada suave (opacity + slide) — useNativeDriver: true.
 */
function AnimatedChatMessageBubble({
  text,
  isUser,
  timestamp,
  showTimestamp = true,
  isGrouped = false,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [text, isUser, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <ChatMessageBubble
        text={text}
        isUser={isUser}
        timestamp={timestamp}
        showTimestamp={showTimestamp}
        isGrouped={isGrouped}
      />
    </Animated.View>
  );
}

export default React.memo(AnimatedChatMessageBubble);
