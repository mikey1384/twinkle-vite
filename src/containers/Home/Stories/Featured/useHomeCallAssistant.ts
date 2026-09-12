import { useEffect, useState } from 'react';
import {
  getHomeCallAssistant,
  saveHomeCallAssistant,
  type HomeCallAssistant
} from '~/helpers/aiVoiceCall';

function readSelection(userId: number | null) {
  const preferred = getHomeCallAssistant(userId);
  let assistant: HomeCallAssistant = preferred || 'Zero';
  if (!preferred) {
    try {
      assistant =
        sessionStorage.getItem(`homeCallLastShown:${userId || 'guest'}`) ===
        'Zero'
          ? 'Ciel'
          : 'Zero';
    } catch {
      /* Discovery still rotates without storage. */
    }
  }
  return { userId, preferred, assistant };
}

export default function useHomeCallAssistant(
  userId: number | null,
  paused: boolean
) {
  const [selection, setSelection] = useState(() => readSelection(userId));
  // Reset account-owned preferences before rendering a different account.
  if (selection.userId !== userId) setSelection(readSelection(userId));

  useEffect(() => {
    if (selection.userId !== userId || selection.preferred) return;
    try {
      sessionStorage.setItem(
        `homeCallLastShown:${userId || 'guest'}`,
        selection.assistant
      );
    } catch {
      /* Automatic discovery never saves a preferred assistant. */
    }
  }, [selection.assistant, selection.preferred, selection.userId, userId]);

  useEffect(() => {
    if (paused || selection.preferred || selection.userId !== userId) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      setSelection((current) => ({
        ...current,
        assistant: current.assistant === 'Zero' ? 'Ciel' : 'Zero'
      }));
    }, 8_000);
    return () => window.clearInterval(timer);
  }, [paused, selection.preferred, selection.userId, userId]);

  return {
    assistant: selection.assistant,
    chooseAssistant(assistant: HomeCallAssistant) {
      setSelection({ userId, assistant, preferred: assistant });
      saveHomeCallAssistant(userId, assistant);
    }
  };
}
