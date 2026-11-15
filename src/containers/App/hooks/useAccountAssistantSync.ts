import { useEffect, useRef } from 'react';
import { useAppContext } from '~/contexts';
import {
  HOME_CALL_ASSISTANT_EVENT,
  getHomeCallAssistant,
  saveHomeCallAssistant,
  type HomeCallAssistant
} from '~/helpers/aiVoiceCall';

// The member's own Zero or Ciel lives on the account (Mikey, 11-15), so
// every device and the server (in-character replies under AI Prompt posts)
// use the same one. This browser's saved pick stays as the copy the screens
// read (assistantVoice.ts, Home's chooser):
// - the account's pick is copied to this browser when the session loads;
// - an account without one takes this browser's earlier pick, once;
// - a new pick here (on Home, or by calling one of them) is saved to the
//   account.
export default function useAccountAssistantSync() {
  const userId = useAppContext((v) => Number(v.user.state.myState.userId || 0));
  const sessionLoaded = useAppContext((v) => !!v.user.state.loaded);
  const accountSettings = useAppContext((v) => {
    const id = Number(v.user.state.myState.userId || 0);
    return v.user.state.userObj[id]?.settings ?? v.user.state.myState.settings;
  });
  const updateHomeAssistant = useAppContext(
    (v) => v.requestHelpers.updateHomeAssistant
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const accountAssistant = readAccountAssistant(accountSettings);
  const accountAssistantRef = useRef(accountAssistant);
  accountAssistantRef.current = accountAssistant;
  const saveToAccountRef = useRef<(assistant: HomeCallAssistant) => void>(
    () => {}
  );
  saveToAccountRef.current = async (assistant: HomeCallAssistant) => {
    if (!userId) return;
    try {
      const result = await updateHomeAssistant(assistant);
      if (result?.settings) {
        onSetUserState({ userId, newState: { settings: result.settings } });
      }
    } catch {
      // Kept on this device; the next pick or session load tries again.
    }
  };

  useEffect(() => {
    if (!userId) return;
    function handleChange(event: Event) {
      const { userId: changedFor, assistant } =
        (event as CustomEvent).detail || {};
      if (Number(changedFor || 0) !== userId) return;
      if (assistant !== 'Zero' && assistant !== 'Ciel') return;
      if (assistant === accountAssistantRef.current) return;
      saveToAccountRef.current(assistant);
    }
    window.addEventListener(HOME_CALL_ASSISTANT_EVENT, handleChange);
    return () =>
      window.removeEventListener(HOME_CALL_ASSISTANT_EVENT, handleChange);
  }, [userId]);

  useEffect(() => {
    if (!userId || !sessionLoaded) return;
    const devicePick = getHomeCallAssistant(userId);
    if (accountAssistant) {
      if (devicePick !== accountAssistant) {
        saveHomeCallAssistant(userId, accountAssistant);
      }
      return;
    }
    if (devicePick) saveToAccountRef.current(devicePick);
  }, [accountAssistant, sessionLoaded, userId]);
}

function readAccountAssistant(settings: unknown): HomeCallAssistant | null {
  let parsed: any = settings;
  if (typeof settings === 'string') {
    try {
      parsed = JSON.parse(settings);
    } catch {
      parsed = null;
    }
  }
  const value = parsed && typeof parsed === 'object' && parsed.homeAssistant;
  return value === 'Zero' || value === 'Ciel' ? value : null;
}
