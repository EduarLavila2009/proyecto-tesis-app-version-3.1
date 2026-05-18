import { useState, useCallback } from 'react';

/**
 * Mensaje temporal tras guardar (parear con SaveFeedbackBanner).
 */
export function useSaveFeedback() {
  const [message, setMessage] = useState(null);

  const showSuccess = useCallback((text = 'Cambios guardados correctamente') => {
    setMessage(text);
  }, []);

  const clear = useCallback(() => setMessage(null), []);

  return { feedbackMessage: message, showSuccess, clearFeedback: clear };
}
