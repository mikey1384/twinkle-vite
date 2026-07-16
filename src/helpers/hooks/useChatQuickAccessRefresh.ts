import { useRef } from 'react';
import { useAppContext, useChatContext, useKeyContext } from '~/contexts';

export default function useChatQuickAccessRefresh() {
  const userId = useKeyContext((v) => v.myState.userId);
  const quickAccessRevision = useChatContext(
    (v) => v.state.quickAccess?.revision || 0
  );
  const quickAccessMode = useChatContext(
    (v) => v.state.quickAccess?.mode || 'automatic'
  );
  const loadChatQuickAccess = useAppContext(
    (v) => v.requestHelpers.loadChatQuickAccess
  );
  const onApplyCanonicalChatSidebarState = useChatContext(
    (v) => v.actions.onApplyCanonicalChatSidebarState
  );
  const userIdRef = useRef(userId);
  const quickAccessRevisionRef = useRef(quickAccessRevision);
  const quickAccessModeRef = useRef(quickAccessMode);
  userIdRef.current = userId;
  quickAccessRevisionRef.current = quickAccessRevision;
  quickAccessModeRef.current = quickAccessMode;

  async function refreshChatQuickAccess({
    automaticOnly = false
  }: { automaticOnly?: boolean } = {}) {
    if (automaticOnly && quickAccessModeRef.current !== 'automatic') {
      return null;
    }
    const requestedUserId = userIdRef.current;
    try {
      const quickAccess = await loadChatQuickAccess();
      if (userIdRef.current !== requestedUserId) return null;
      const incomingRevision = Number(quickAccess?.revision || 0);
      if (incomingRevision < quickAccessRevisionRef.current) return null;
      onApplyCanonicalChatSidebarState({
        quickAccess,
        userId: requestedUserId
      });
      quickAccessRevisionRef.current = incomingRevision;
      return quickAccess;
    } catch (error) {
      console.error('Failed to refresh chat quick access:', error);
      return null;
    }
  }

  return refreshChatQuickAccess;
}
