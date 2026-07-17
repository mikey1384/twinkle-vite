import React, { memo, useEffect, useRef, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import {
  audioRef,
  claimAudioIntent,
  isCurrentAudioIntent
} from '~/constants/state';
import { Color } from '~/constants/css';

function AIAudioButton({
  text,
  voice,
  contentKey
}: {
  text: string;
  voice?: string;
  contentKey: string;
}) {
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const [isPlaying, setIsPlaying] = useState(
    Boolean(
      audioKey === contentKey &&
        audioRef.player &&
        !audioRef.player.paused
    )
  );
  const [preparing, setPreparing] = useState(false);
  const [isPrepared, setIsPrepared] = useState(
    audioKey === contentKey && Boolean(audioRef.player)
  );
  const pendingAudioIntentRef = useRef<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    const player =
      audioKey === contentKey
        ? (audioRef.player as HTMLAudioElement | null)
        : null;
    const hasPreparedAudio = Boolean(player);
    setIsPlaying(Boolean(player && !player.paused && !player.ended));
    setIsPrepared(hasPreparedAudio);
    if (player) {
      bindPlayerEvents({ player, setAudioError, setIsPlaying });
    }
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

  useEffect(() => {
    return () => {
      const pendingAudioIntentId = pendingAudioIntentRef.current;
      if (
        pendingAudioIntentId !== null &&
        isCurrentAudioIntent(pendingAudioIntentId)
      ) {
        claimAudioIntent();
      }
    };
  }, []);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}
    >
      <Button
        loading={preparing}
        variant="soft"
        tone="raised"
        onClick={handleAudioClick}
        style={{
          padding: '0.5rem 0.7rem',
          lineHeight: 1
        }}
        color={
          audioError ? 'redOrange' : isPrepared ? 'logoBlue' : 'darkerGray'
        }
      >
        <Icon icon={isPlaying ? 'stop' : 'volume'} />
      </Button>
      {audioUrl && (
        <Button
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem 0.7rem',
            lineHeight: 1
          }}
          variant="soft"
          tone="raised"
          onClick={handleDownloadClick}
          color="darkerGray"
        >
          <Icon icon="download" />
        </Button>
      )}
      {audioError && (
        <span
          role="alert"
          style={{
            color: Color.redOrange(),
            fontSize: '1.1rem',
            fontWeight: 700,
            lineHeight: 1.2
          }}
        >
          {audioError}
        </span>
      )}
    </span>
  );

  async function handleAudioClick() {
    setAudioError('');
    const audioIntentId = claimAudioIntent();
    const currentPlayer =
      audioKey === contentKey
        ? (audioRef.player as HTMLAudioElement | null)
        : null;

    if (currentPlayer) {
      bindPlayerEvents({
        player: currentPlayer,
        setAudioError,
        setIsPlaying
      });
      if (!currentPlayer.paused && !currentPlayer.ended) {
        currentPlayer.pause();
        return;
      }
      await playAudio(currentPlayer);
      return;
    }

    if (audioRef.player) {
      audioRef.player.pause();
      audioRef.player = null;
    }
    onSetAudioKey(contentKey);
    pendingAudioIntentRef.current = audioIntentId;
    setPreparing(true);
    try {
      const data = await textToSpeech(text, voice);
      if (!isCurrentAudioIntent(audioIntentId)) {
        return;
      }
      const audioBlob =
        data instanceof Blob
          ? data
          : new Blob([data], { type: 'audio/mpeg' });
      const nextAudioUrl = URL.createObjectURL(audioBlob);
      const player = new Audio(nextAudioUrl);
      audioRef.player = player;
      setAudioUrl(nextAudioUrl);
      setIsPrepared(true);
      bindPlayerEvents({ player, setAudioError, setIsPlaying });
      await playAudio(player);
    } catch (error) {
      if (!isCurrentAudioIntent(audioIntentId)) {
        return;
      }
      console.error(error);
      setIsPlaying(false);
      setIsPrepared(false);
      setAudioError('Could not prepare voice audio.');
    } finally {
      if (pendingAudioIntentRef.current === audioIntentId) {
        pendingAudioIntentRef.current = null;
        setPreparing(false);
      }
    }
  }

  async function playAudio(player: HTMLAudioElement) {
    try {
      await player.play();
      if (audioRef.player === player) {
        setIsPlaying(!player.paused && !player.ended);
      }
    } catch (error) {
      if (isInterruptedPlaybackError(error) || audioRef.player !== player) {
        setIsPlaying(false);
        return;
      }
      console.error(error);
      setIsPlaying(false);
      setAudioError(
        isPlaybackPermissionError(error)
          ? 'Voice audio is ready. Tap the speaker again to play.'
          : 'Could not play voice audio.'
      );
    }
  }

  function handleDownloadClick() {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${contentKey}.mp3`;
      try {
        document.body.appendChild(link);
        link.click();
      } finally {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      }
    }
  }
}

function bindPlayerEvents({
  player,
  setAudioError,
  setIsPlaying
}: {
  player: HTMLAudioElement;
  setAudioError: React.Dispatch<React.SetStateAction<string>>;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  player.onplay = () => {
    if (audioRef.player === player) {
      setAudioError('');
      setIsPlaying(true);
    }
  };
  player.onpause = () => {
    if (audioRef.player === player) {
      setIsPlaying(false);
    }
  };
  player.onended = () => {
    if (audioRef.player === player) {
      setIsPlaying(false);
    }
  };
  player.onerror = () => {
    if (audioRef.player === player) {
      setIsPlaying(false);
      setAudioError('Could not play voice audio.');
    }
  };
}

function isInterruptedPlaybackError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /interrupted|abort|pause/i.test(error.message);
}

function isPlaybackPermissionError(error: unknown) {
  return error instanceof Error && error.name === 'NotAllowedError';
}

export default memo(AIAudioButton);
