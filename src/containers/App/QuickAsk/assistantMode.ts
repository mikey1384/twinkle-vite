import { useEffect, useSyncExternalStore } from 'react';
import { useAppContext } from '~/contexts';
import {
  closeAssistantDock,
  openAssistantDock,
  type AssistantAskContext
} from '../AssistantDock/dockState';
import { closeQuickAsk, openQuickAsk } from './state';

// One account-wide choice of how Zero and Ciel open when the member summons
// them anywhere (Ask buttons, the Home box, the floating window): 'saved'
// (their main chat, the default) or 'temporary' (Quick Ask, kept out of the
// history). It lives in the account's settings (assistantMode), so it
// follows the member to every device; useAssistantModeSync mirrors it here
// for click handlers.
export type AssistantMode = 'saved' | 'temporary';
let mode: AssistantMode = 'saved';
const listeners = new Set<() => void>();

function setLocalMode(next: AssistantMode) {
  if (mode === next) return;
  mode = next;
  listeners.forEach((listener) => listener());
}

export function getAssistantMode() {
  return mode;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function readAssistantModeSetting(settings: unknown): AssistantMode {
  let parsed: any = settings;
  if (typeof settings === 'string') {
    try {
      parsed = JSON.parse(settings);
    } catch {
      parsed = null;
    }
  }
  return parsed?.assistantMode === 'temporary' ? 'temporary' : 'saved';
}

// Mounted once (QuickAsk/Host): copies the account's choice into this store.
export function useAssistantModeSync() {
  const accountMode = useAppContext((v) => {
    const id = Number(v.user.state.myState.userId || 0);
    return readAssistantModeSetting(
      v.user.state.userObj[id]?.settings ?? v.user.state.myState.settings
    );
  });
  useEffect(() => {
    setLocalMode(accountMode);
  }, [accountMode]);
  useEffect(() => () => setLocalMode('saved'), []);
}

// The current mode, and a setter that saves it on the account. The server's
// returned settings are the canonical value (no optimistic state).
export function useAssistantMode() {
  const current = useSyncExternalStore(subscribe, getAssistantMode);
  const userId = useAppContext((v) => Number(v.user.state.myState.userId || 0));
  const updateAssistantMode = useAppContext(
    (v) => v.requestHelpers.updateAssistantMode
  );
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  async function saveMode(next: AssistantMode) {
    if (!userId) return false;
    const result = await updateAssistantMode(next);
    if (!result?.settings) return false;
    onSetUserState({ userId, newState: { settings: result.settings } });
    setLocalMode(readAssistantModeSetting(result.settings));
    return true;
  }
  return { mode: current, saveMode };
}

// Every "summon Zero/Ciel" entry point goes through here: the member's mode
// decides between their main chat (the floating window) and a temporary
// Quick Ask. What they pressed Ask on comes along either way.
export function summonAssistant(
  assistant: 'Zero' | 'Ciel',
  context?: AssistantAskContext | null,
  {
    topicId,
    question = ''
  }: { topicId?: number; question?: string } = {}
) {
  if (mode === 'temporary') {
    closeAssistantDock();
    openQuickAsk({ agent: assistant, context: context || null, question });
    return 'temporary' as const;
  }
  closeQuickAsk();
  openAssistantDock(assistant, context, topicId);
  return 'saved' as const;
}
