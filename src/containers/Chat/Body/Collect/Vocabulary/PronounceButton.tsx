import React, {
  CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import { audioRef } from '~/constants/state';

interface PronounceButtonProps {
  text: string;
  voice?: string;
  contentKeyPrefix?: string;
  locale?: string;
  style?: CSSProperties;
  color?: string;
  opacity?: number;
  ariaLabel?: string;
  skeuomorphic?: boolean;
}

export default function PronounceButton({
  text,
  voice = 'echo',
  contentKeyPrefix = 'pronounce',
  locale = 'en-US',
  style,
  color = 'darkerGray',
  opacity = 0.8,
  ariaLabel = 'Play pronunciation',
  skeuomorphic
}: PronounceButtonProps) {
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);

  const contentKey = useMemo(
    () => `${contentKeyPrefix}-${text}-${voice}-${locale}`,
    [contentKeyPrefix, text, voice, locale]
  );

  const [preparing, setPreparing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const preloadPromiseRef = useRef<Promise<void> | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const playing =
      audioKey === contentKey && audioRef.player && !audioRef.player.paused;
    setIsPlaying(!!playing);
    if (playing) {
      audioRef.player.onended = () => setIsPlaying(false);
    }
  }, [audioKey, contentKey]);

  // Preload on mount or when word/voice/locale changes (direct TTS)
  useEffect(() => {
    let canceled = false;
    // capture refs to satisfy lints and avoid surprises in cleanup
    const preloadPromise = preloadPromiseRef;
    const audioEl = audioElRef;
    const audioUrl = audioUrlRef;

    const promise = (async () => {
      try {
        const data = await textToSpeech(`"[pause]${text}"`, voice);
        if (canceled) return;
        const blob =
          data instanceof Blob ? data : new Blob([data], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.preload = 'auto';
        audioEl.current = audio;
        audioUrl.current = url;
      } catch {
        if (canceled) return;
        audioEl.current = null;
        audioUrl.current = null;
      }
    })();

    preloadPromise.current = promise;

    return () => {
      canceled = true;
      try {
        if (audioEl.current) audioEl.current.pause();
        if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
      } catch {}
      audioEl.current = null;
      audioUrl.current = null;
      preloadPromise.current = null;
    };
  }, [text, voice, locale, textToSpeech, contentKeyPrefix]);

  return (
    <Button
      skeuomorphic={skeuomorphic}
      onClick={handleClick}
      loading={preparing}
      style={style}
      color={color}
      opacity={opacity}
      aria-label={ariaLabel}
    >
      <Icon icon={isPlaying ? 'stop' : 'volume'} />
    </Button>
  );

  async function handleClick() {
    try {
      // Stop if currently playing
      if (audioRef.player && isPlaying) {
        audioRef.player.pause();
        setIsPlaying(false);
        return;
      }
      // Stop any existing audio
      if (audioRef.player) {
        audioRef.player.pause();
      }

      // Ensure preloaded
      if (!audioElRef.current) {
        if (preloadPromiseRef.current) {
          setPreparing(true);
          await preloadPromiseRef.current;
        } else {
          // Try to fetch now if preload failed
          setPreparing(true);
          const data = await textToSpeech(text, voice);
          const blob =
            data instanceof Blob
              ? data
              : new Blob([data], { type: 'audio/mp3' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'auto';
          audioElRef.current = audio;
          audioUrlRef.current = url;
        }
      }

      const player = audioElRef.current;
      if (!player) return;

      onSetAudioKey(contentKey);
      audioRef.player = player;
      audioRef.key = contentKey;
      player.currentTime = 0;
      setIsPlaying(true);
      player.play();
      player.onended = () => setIsPlaying(false);
    } catch (error) {
      console.error(error);
    } finally {
      setPreparing(false);
    }
  }
}
