export interface VoiceConversation {
  channelId: number;
  topicId?: number;
  assistant?: 'Zero' | 'Ciel';
  askedAbout?: unknown;
  continuation?: boolean;
}

export interface VoiceSessionSnapshot {
  phase: 'text' | 'connecting' | 'voice' | 'ending';
  callId: string | null;
  channelId: number;
  topicId: number;
  assistant: 'Zero' | 'Ciel' | null;
  muted: boolean;
  speaking: boolean;
  microphonePaused: boolean;
  error: string;
}

const EMPTY: VoiceSessionSnapshot = {
  phase: 'text',
  callId: null,
  channelId: 0,
  topicId: 0,
  assistant: null,
  muted: false,
  speaking: false,
  microphonePaused: false,
  error: ''
};

// One owner for a tab's call. Server receipts own connection state; local
// intent owns connecting/ending and immediate microphone/playback shutdown.
export function createVoiceSessionController(deps: {
  id(): string;
  microphone(): Promise<MediaStream>;
  connect(input: VoiceConversation & { callId: string }): Promise<{
    started: boolean;
    assistantName?: 'Zero' | 'Ciel';
    error?: string;
  }>;
  disconnect(callId: string, handoff: boolean): Promise<void>;
  stopPlayback(): void;
}) {
  let state = EMPTY;
  let stream: MediaStream | null = null;
  let remoteCallId: string | null = null;
  let pending: Promise<void> | null = null;
  let ending: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  function set(patch: Partial<VoiceSessionSnapshot>) {
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  }
  function stopMedia() {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    deps.stopPlayback();
  }
  function matches(callId?: string) {
    return !!callId && callId === state.callId;
  }
  function ended(callId?: string, error = state.error) {
    if (!matches(callId)) return false;
    stopMedia();
    set({
      phase: 'text',
      callId: null,
      muted: false,
      speaking: false,
      microphonePaused: false,
      error
    });
    return true;
  }
  function end(handoff = true, reason = ''): Promise<void> {
    const callId = state.callId;
    if (!callId || state.phase === 'text') return Promise.resolve();
    if (remoteCallId !== callId) {
      ended(callId, reason);
      return Promise.resolve();
    }
    if (state.phase === 'ending' && ending && handoff) return ending;
    stopMedia();
    set({
      phase: 'ending',
      muted: false,
      speaking: false,
      microphonePaused: false,
      error: reason
    });
    const operation = deps.disconnect(callId, handoff).then(
      () => {
        ended(callId, reason);
      },
      (error) => {
        if (matches(callId))
          set({
            error:
              error instanceof Error
                ? error.message
                : 'The call is still ending. Please retry.'
          });
        throw error;
      }
    );
    ending = operation;
    void operation
      .finally(() => {
        if (ending === operation) ending = null;
      })
      .catch(() => {});
    return operation;
  }
  function start(input: VoiceConversation) {
    if (
      state.phase === 'connecting' &&
      state.channelId === input.channelId &&
      state.topicId === (input.topicId || 0)
    )
      return pending!;
    if (state.phase !== 'text')
      return Promise.reject(
        new Error('Finish the current call before starting another.')
      );
    const callId = deps.id();
    set({
      phase: 'connecting',
      callId,
      channelId: input.channelId,
      topicId: input.topicId || 0,
      assistant: input.assistant || null,
      muted: false,
      error: ''
    });
    const operation = (async () => {
      try {
        const acquired = await deps.microphone();
        if (!matches(callId) || state.phase !== 'connecting') {
          acquired.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = acquired;
        remoteCallId = callId;
        const result = await deps.connect({ ...input, callId });
        if (!matches(callId) || state.phase !== 'connecting') return;
        if (!result.started)
          throw new Error(
            result.error || 'Unable to connect. You can keep typing.'
          );
        set({
          phase: 'voice',
          assistant: result.assistantName || state.assistant
        });
      } catch (error) {
        if (!matches(callId) || state.phase !== 'connecting') return;
        stopMedia();
        if (remoteCallId !== callId) {
          ended(
            callId,
            error instanceof Error
              ? error.message
              : 'Unable to use the microphone. You can keep typing.'
          );
          throw error;
        }
        // An ambiguous start may have reached the server. Keep its identity
        // until shutdown is acknowledged; never let a retry overlap it.
        set({
          phase: 'ending',
          error: error instanceof Error ? error.message : 'Unable to connect.'
        });
        try {
          await deps.disconnect(callId, false);
          ended(callId, state.error);
        } catch {
          /* Retain ending + retry control. */
        }
        throw error;
      }
    })();
    pending = operation;
    void operation
      .finally(() => {
        if (pending === operation) pending = null;
      })
      .catch(() => {});
    return operation;
  }
  return {
    start,
    end,
    ended,
    matches,
    started(callId: string | undefined, assistant: 'Zero' | 'Ciel') {
      if (!matches(callId) || !['connecting', 'voice'].includes(state.phase))
        return false;
      set({ phase: 'voice', assistant });
      return true;
    },
    getSnapshot: () => state,
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getStream: () => stream,
    setSpeaking(callId: string | undefined, speaking: boolean) {
      if (
        matches(callId) &&
        state.phase === 'voice' &&
        state.speaking !== speaking
      )
        set({ speaking });
    },
    setMicrophonePaused(callId: string | undefined, microphonePaused: boolean) {
      if (
        matches(callId) &&
        state.phase === 'voice' &&
        state.microphonePaused !== microphonePaused
      )
        set({ microphonePaused });
    },
    setMuted(muted: boolean) {
      if (state.phase !== 'voice') return;
      stream?.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      set({ muted });
    },
    disconnected() {
      stopMedia();
      if (!state.callId) return;
      set({
        phase: 'ending',
        muted: false,
        speaking: false,
        microphonePaused: false,
        error:
          'The connection dropped. Your draft is kept while we finish saving the call.'
      });
    },
    reset() {
      stopMedia();
      remoteCallId = null;
      state = EMPTY;
      listeners.forEach((fn) => fn());
    }
  };
}
