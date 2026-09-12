import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext, useViewContext } from '~/contexts';
import { audioRef, claimAudioIntent, isCurrentAudioIntent } from '~/constants/state';

// Keep at most the shared player's current generated source. Unmounting a
// message must not stop intentional playback, but replacing it releases its URL.
let preparedAudio: {
  identity: string;
  key: string;
  url: string;
  player: HTMLAudioElement;
} | null = null;

const SILENT_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAA';
const initialState = {
  identity: '', preparing: false, playing: false, prepared: false,
  ended: false, url: null as string | null, error: '', hint: ''
};

export default function useVoicePlayback({ text, voice, contentKey }: {
  text: string;
  voice?: string;
  contentKey: string;
}) {
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const audioKey = useViewContext((v) => v.state.audioKey);
  // Use assistant identity at the API boundary. The server owns each voice.
  // Revision also expires prepared clips from the previous voice configuration.
  const speechVoice = voice === 'nova' || voice === 'marin' ? 'ciel'
    : !voice || voice === 'echo' || voice === 'cedar' ? 'zero' : voice;
  const identity = useMemo(() => JSON.stringify([contentKey, text, speechVoice, 'echo-marin-v2']), [contentKey, text, speechVoice]);
  const latestIdentity = useRef(identity);
  latestIdentity.current = identity;
  const mounted = useRef(false);
  const pending = useRef<{ intent: number; player: HTMLAudioElement } | null>(null);
  const unsubscribe = useRef<(() => void) | null>(null);
  const [state, setState] = useState(initialState);

  useEffect(() => {
    mounted.current = true;
    setState({ ...initialState, identity });
    return () => {
      mounted.current = false;
      cancelPreparation();
      unsubscribe.current?.();
      unsubscribe.current = null;
    };
  }, [identity]);

  useEffect(() => {
    audioRef.key = audioKey;
    if (preparedAudio && (
      preparedAudio.player !== audioRef.player ||
      preparedAudio.key !== audioKey ||
      (preparedAudio.key === contentKey && preparedAudio.identity !== identity)
    )) releasePreparedAudio();
    if (audioKey !== contentKey) cancelPreparation();
    observePlayer(audioKey === contentKey ? audioRef.player : null);
    // Player subscriptions own no timers and are detached on identity/key change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioKey, contentKey, identity]);

  const visible = state.identity === identity ? state : initialState;
  return { ...visible, playOrPause, downloadUrl: visible.url };

  function update(patch: Partial<typeof initialState>) {
    if (mounted.current && latestIdentity.current === identity) {
      setState((previous) => ({ ...previous, ...patch, identity }));
    }
  }

  function observePlayer(player: HTMLAudioElement | null) {
    unsubscribe.current?.();
    unsubscribe.current = null;
    update({
      playing: Boolean(player && !player.paused && !player.ended),
      prepared: Boolean(player), ended: Boolean(player?.ended),
      url: preparedAudio?.player === player ? preparedAudio.url : null,
      ...(audioRef.key !== contentKey ? { preparing: false, error: '', hint: '' } : {})
    });
    if (!player) return;
    const ownsPlayer = () => audioRef.player === player && audioRef.key === contentKey;
    const playing = () => { if (ownsPlayer()) update({ playing: true, ended: false, error: '', hint: '' }); };
    const paused = () => { if (ownsPlayer()) update({ playing: false }); };
    const ended = () => { if (ownsPlayer()) update({ playing: false, ended: true }); };
    const failed = () => { if (ownsPlayer()) update({ playing: false, error: 'Could not play voice audio. Try again.' }); };
    const events = { play: playing, pause: paused, ended, error: failed };
    for (const [name, listener] of Object.entries(events)) player.addEventListener(name, listener);
    unsubscribe.current = () => {
      for (const [name, listener] of Object.entries(events)) player.removeEventListener(name, listener);
    };
  }

  function cancelPreparation() {
    const request = pending.current;
    if (!request) return;
    pending.current = null;
    if (isCurrentAudioIntent(request.intent)) claimAudioIntent();
    request.player.pause();
  }

  async function playOrPause() {
    if (pending.current || !text.trim()) return;
    const intent = claimAudioIntent();
    const isCurrent = () => mounted.current && latestIdentity.current === identity && isCurrentAudioIntent(intent);
    update({ error: '', hint: '' });
    const currentPlayer = audioRef.key === contentKey ? audioRef.player : null;
    if (currentPlayer && (!preparedAudio || preparedAudio.player !== currentPlayer || preparedAudio.identity === identity)) {
      observePlayer(currentPlayer);
      if (!currentPlayer.paused && !currentPlayer.ended) {
        currentPlayer.pause();
        update({ playing: false });
      } else {
        await play(currentPlayer, isCurrent);
      }
      return;
    }

    releasePreparedAudio();
    if (audioRef.player) {
      audioRef.player.pause();
      audioRef.player = null;
    }
    audioRef.key = contentKey;
    onSetAudioKey(contentKey);
    update({ preparing: true, prepared: false, playing: false, ended: false, url: null });
    let player: HTMLAudioElement | null = null;
    try {
      // Synchronous gesture activation is retained for iOS before the TTS await.
      player = new Audio(SILENT_AUDIO_DATA_URI);
      pending.current = { intent, player };
      player.play().catch(() => {});
      const data = await textToSpeech(text, speechVoice);
      if (!isCurrent()) return;
      if (!(data instanceof Blob || data instanceof ArrayBuffer || ArrayBuffer.isView(data))) {
        throw new Error('Invalid voice response');
      }
      const blob = data instanceof Blob ? data : new Blob([data as BlobPart], { type: 'audio/mpeg' });
      if (!blob.size) throw new Error('Empty voice response');
      const url = URL.createObjectURL(blob);
      player.pause();
      player.src = url;
      preparedAudio = { identity, key: contentKey, url, player };
      audioRef.player = player;
      audioRef.key = contentKey;
      observePlayer(player);
      await play(player, isCurrent);
    } catch {
      if (isCurrent()) update({ playing: false, prepared: false, error: 'Could not prepare voice audio. Try again.' });
    } finally {
      if (player && audioRef.player !== player) player.pause();
      if (pending.current?.intent === intent) {
        pending.current = null;
        update({ preparing: false });
      }
    }
  }

  async function play(player: HTMLAudioElement, isCurrent: () => boolean) {
    try {
      await player.play();
      if (isCurrent() && audioRef.player === player) update({ playing: !player.paused && !player.ended, ended: player.ended });
    } catch (error) {
      if (!isCurrent() || audioRef.player !== player) return;
      update({ playing: false });
      if (isInterruptedPlaybackError(error)) return;
      if (error instanceof Error && error.name === 'NotAllowedError') {
        update({ hint: 'Audio is ready. Select Listen to play.' });
      } else {
        update({ error: 'Could not play voice audio. Try again.' });
      }
    }
  }
}

function releasePreparedAudio() {
  const previous = preparedAudio;
  if (!previous) return;
  preparedAudio = null;
  previous.player.pause();
  if (audioRef.player === previous.player) audioRef.player = null;
  previous.player.removeAttribute('src');
  previous.player.load();
  URL.revokeObjectURL(previous.url);
}

function isInterruptedPlaybackError(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || /interrupted|abort|pause/i.test(error.message));
}
