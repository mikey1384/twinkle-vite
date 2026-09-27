import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject
} from 'react';
import { useAppContext } from '~/contexts';
import type {
  AppHelperBridge,
  AppHelperEvents,
  AppHelperRelayState,
  AppHelperSessionStatus
} from '../types/appHelperTypes';

export type AppHelperPhase =
  | 'idle'
  | 'creating'
  | 'waiting'
  | 'attached'
  | 'expired'
  | 'ended'
  | 'error';

export interface AppHelperPairingState {
  phase: AppHelperPhase;
  code: string;
  codeExpiresAt: number | null;
  sessionId: string | null;
  helperName: string | null;
  allowEdits: boolean;
  allowEditsPending: boolean;
  message: string;
}

export interface AppHelperPairing {
  available: boolean;
  buildId: number;
  state: AppHelperPairingState;
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  start: () => Promise<void>;
  disconnect: () => Promise<void>;
  setAllowEdits: (allowEdits: boolean) => Promise<void>;
}

interface StoredPairing {
  sessionId: string;
  connectionId: string;
  code: string;
  codeExpiresAt: number | null;
}

const IDLE_STATE: AppHelperPairingState = {
  phase: 'idle',
  code: '',
  codeExpiresAt: null,
  sessionId: null,
  helperName: null,
  allowEdits: false,
  allowEditsPending: false,
  message: ''
};

function storageKey(buildId: number, source: string) {
  return `twinkle:app-helper:${buildId}:${source}`;
}

// sessionStorage is per tab, so a reload resumes THIS tab's pairing and a new
// tab never inherits it.
function readStoredPairing(key: string): StoredPairing | null {
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(key) || 'null');
    if (
      parsed &&
      /^[0-9a-f-]{36}$/i.test(String(parsed.sessionId || '')) &&
      /^[0-9a-f-]{36}$/i.test(String(parsed.connectionId || ''))
    ) {
      return parsed;
    }
  } catch {
    // Private mode or blocked storage: pairing simply won't survive reloads.
  }
  return null;
}

function writeStoredPairing(key: string, value: StoredPairing | null) {
  try {
    if (value) window.sessionStorage.setItem(key, JSON.stringify(value));
    else window.sessionStorage.removeItem(key);
  } catch {
    // Optional convenience only.
  }
}

function errorMessage(error: any, fallback: string) {
  return String(error?.message || '').trim() || fallback;
}

export default function useAppHelperPairing({
  buildId,
  userId,
  source,
  artifactVersionId,
  enabled,
  relayStateRef,
  bridgeRef,
  eventsRef
}: {
  buildId: number;
  userId: number | null;
  source: 'published' | 'workspace';
  artifactVersionId: number | null;
  enabled: boolean;
  relayStateRef: MutableRefObject<AppHelperRelayState>;
  bridgeRef: MutableRefObject<AppHelperBridge | null>;
  eventsRef: MutableRefObject<AppHelperEvents | null>;
}): AppHelperPairing {
  const createPairing = useAppContext(
    (v) => v.requestHelpers.createBuildAppMcpPairing
  );
  const setAllowEditsRequest = useAppContext(
    (v) => v.requestHelpers.setBuildAppMcpAllowEdits
  );
  const closeSessionRequest = useAppContext(
    (v) => v.requestHelpers.closeBuildAppMcpSession
  );
  const [toolsAvailable, setToolsAvailable] = useState(
    Boolean(relayStateRef.current.announcement)
  );
  const [state, setState] = useState<AppHelperPairingState>(IDLE_STATE);
  const [panelOpen, setPanelOpen] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const key = storageKey(buildId, source);
  const keyRef = useRef(key);
  keyRef.current = key;
  const closeSessionRef = useRef(closeSessionRequest);
  closeSessionRef.current = closeSessionRequest;

  const endLocally = useCallback(
    (phase: AppHelperPhase, message: string) => {
      bridgeRef.current?.detach();
      relayStateRef.current.paired = null;
      sessionIdRef.current = null;
      writeStoredPairing(keyRef.current, null);
      setState({ ...IDLE_STATE, phase, message });
    },
    [bridgeRef, relayStateRef]
  );

  eventsRef.current = {
    onToolsAvailableChange: setToolsAvailable,
    onSessionStatus(status: AppHelperSessionStatus) {
      if (!status?.id || status.id !== sessionIdRef.current) return;
      setState((current) => ({
        ...current,
        phase: status.helperAttachedAt ? 'attached' : current.phase,
        helperName: status.helperName,
        allowEdits: Boolean(status.allowEdits),
        codeExpiresAt: status.helperAttachedAt
          ? null
          : status.pairingExpiresAt ?? current.codeExpiresAt
      }));
    },
    onSessionEnded() {
      if (!sessionIdRef.current) return;
      endLocally(
        'ended',
        'The AI helper disconnected. Connect again whenever you like.'
      );
    }
  };

  const closeServerSession = useCallback(
    (sessionId: string) =>
      closeSessionRef.current({ buildId, sessionId }).catch(() => {}),
    [buildId]
  );

  const start = useCallback(async () => {
    if (!enabled || !userId) return;
    const previous = sessionIdRef.current;
    if (previous) {
      endLocally('idle', '');
      void closeServerSession(previous);
    }
    setState({ ...IDLE_STATE, phase: 'creating' });
    let createdSessionId = '';
    try {
      const data = await createPairing({
        buildId,
        source,
        artifactVersionId
      });
      createdSessionId = String(data?.session?.id || '');
      const code = String(data?.pairing?.code || '');
      if (!createdSessionId || !code) {
        throw new Error('Twinkle did not return a pairing code.');
      }
      if (!bridgeRef.current) {
        throw new Error('The app is still loading. Try again in a moment.');
      }
      sessionIdRef.current = createdSessionId;
      const { connectionId } = await bridgeRef.current.attach({
        sessionId: createdSessionId
      });
      const codeExpiresAt = Number(data?.pairing?.codeExpiresAt || 0) || null;
      writeStoredPairing(keyRef.current, {
        sessionId: createdSessionId,
        connectionId,
        code,
        codeExpiresAt
      });
      setState({
        ...IDLE_STATE,
        phase: 'waiting',
        code,
        codeExpiresAt,
        sessionId: createdSessionId,
        allowEdits: Boolean(data?.session?.allowEdits)
      });
    } catch (error: any) {
      if (createdSessionId) {
        bridgeRef.current?.detach();
        void closeServerSession(createdSessionId);
      }
      sessionIdRef.current = null;
      setState({
        ...IDLE_STATE,
        phase: 'error',
        message: errorMessage(error, 'Could not make a code. Try again.')
      });
    }
  }, [
    artifactVersionId,
    bridgeRef,
    buildId,
    closeServerSession,
    createPairing,
    enabled,
    endLocally,
    source,
    userId
  ]);

  const disconnect = useCallback(async () => {
    const sessionId = sessionIdRef.current;
    endLocally('idle', '');
    if (sessionId) await closeServerSession(sessionId);
  }, [closeServerSession, endLocally]);

  const setAllowEdits = useCallback(
    async (allowEdits: boolean) => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      setState((current) => ({
        ...current,
        allowEditsPending: true,
        message: ''
      }));
      try {
        const data = await setAllowEditsRequest({
          buildId,
          sessionId,
          allowEdits
        });
        if (sessionIdRef.current !== sessionId) return;
        // Canonical server value only; never the requested one.
        setState((current) => ({
          ...current,
          allowEdits: Boolean(data?.session?.allowEdits),
          allowEditsPending: false
        }));
      } catch (error: any) {
        if (sessionIdRef.current !== sessionId) return;
        if (Number(error?.status) === 404) {
          endLocally('ended', 'This AI helper connection has ended.');
          return;
        }
        setState((current) => ({
          ...current,
          allowEditsPending: false,
          message: errorMessage(error, 'Could not change that. Try again.')
        }));
      }
    },
    [buildId, endLocally, setAllowEditsRequest]
  );

  // Resume this tab's pairing after a reload, once the app offers its tools.
  useEffect(() => {
    if (!enabled || !userId || !toolsAvailable || sessionIdRef.current) return;
    const stored = readStoredPairing(key);
    if (!stored || !bridgeRef.current) return;
    sessionIdRef.current = stored.sessionId;
    setState({
      ...IDLE_STATE,
      phase: 'waiting',
      code: stored.code,
      codeExpiresAt: stored.codeExpiresAt,
      sessionId: stored.sessionId
    });
    bridgeRef.current
      .attach({
        sessionId: stored.sessionId,
        connectionId: stored.connectionId
      })
      .catch(() => {
        if (sessionIdRef.current !== stored.sessionId) return;
        endLocally('idle', '');
      });
  }, [bridgeRef, enabled, endLocally, key, toolsAvailable, userId]);

  // An unclaimed code ends when it expires.
  useEffect(() => {
    if (state.phase !== 'waiting' || !state.codeExpiresAt) return;
    const remainingMs = state.codeExpiresAt * 1000 - Date.now();
    const sessionId = state.sessionId;
    const timer = window.setTimeout(
      () => {
        if (!sessionId || sessionIdRef.current !== sessionId) return;
        endLocally('expired', 'That code expired. Get a new one.');
        void closeServerSession(sessionId);
      },
      Math.max(0, remainingMs)
    );
    return () => window.clearTimeout(timer);
  }, [
    closeServerSession,
    endLocally,
    state.codeExpiresAt,
    state.phase,
    state.sessionId
  ]);

  // Signing out, switching accounts, or turning the feature off ends it.
  const pairedUserIdRef = useRef(userId);
  useEffect(() => {
    if (pairedUserIdRef.current === userId && enabled) return;
    pairedUserIdRef.current = userId;
    const sessionId = sessionIdRef.current;
    if (!sessionId) return;
    endLocally('idle', '');
    void closeServerSession(sessionId);
  }, [closeServerSession, enabled, endLocally, userId]);

  // Leaving the app (in-site navigation unmounts it) disconnects the helper.
  // A full reload skips this and resumes from sessionStorage instead.
  useEffect(() => {
    return () => {
      const sessionId = sessionIdRef.current;
      if (!sessionId) return;
      // These are plain mutable holders, not DOM refs: the live value at
      // unmount is exactly what must be cleared.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      bridgeRef.current?.detach();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      relayStateRef.current.paired = null;
      sessionIdRef.current = null;
      writeStoredPairing(keyRef.current, null);
      void closeSessionRef.current({ buildId, sessionId }).catch(() => {});
    };
  }, [bridgeRef, buildId, relayStateRef]);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setState((current) =>
      current.phase === 'ended' ||
      current.phase === 'expired' ||
      current.phase === 'error'
        ? current
        : { ...current, message: '' }
    );
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  return {
    available: Boolean(enabled && userId && toolsAvailable),
    buildId,
    state,
    panelOpen,
    openPanel,
    closePanel,
    start,
    disconnect,
    setAllowEdits
  };
}
