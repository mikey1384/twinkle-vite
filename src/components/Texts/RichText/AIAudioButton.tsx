import React, { memo, useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import { audioRef } from '~/constants/state';
import { Color } from '~/constants/css';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

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
    audioKey === contentKey && audioRef.player && !audioRef.player.paused
  );
  const [isDownloadButtonShown, setIsDownloadButtonShown] = useState(
    audioKey === contentKey && audioRef.player
  );
  const [preparing, setPreparing] = useState(false);
  const [isPrepared, setIsPrepared] = useState(
    audioKey === contentKey && Boolean(audioRef.player)
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState('');

  useEffect(() => {
    const isPlaying =
      audioKey === contentKey && audioRef.player && !audioRef.player.paused;
    const hasPreparedAudio = audioKey === contentKey && Boolean(audioRef.player);
    setIsPlaying(isPlaying);
    setIsPrepared(hasPreparedAudio);
    if (isPlaying) {
      audioRef.player.onended = () => {
        setIsPlaying(false);
      };
    }
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

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
      {isDownloadButtonShown && (
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
    const hasCurrentAudio =
      audioRef.key === contentKey && Boolean(audioRef.player);
    if (audioRef.player) {
      audioRef.player.pause();
      if (!hasCurrentAudio) {
        audioRef.player = null;
      }
    }
    onSetAudioKey(contentKey);

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setPreparing(true);
    try {
      let preparedAudioOnThisClick = false;
      if (!audioRef.player) {
        const data = await textToSpeech(text, voice);
        const audioBlob = new Blob([data], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.player = audio;
        setAudioUrl(audioUrl);
        setIsPrepared(true);
        preparedAudioOnThisClick = true;
      }
      if (deviceIsMobile && preparedAudioOnThisClick) {
        return;
      }
      const player = audioRef.player as HTMLAudioElement;
      setIsPlaying(true);
      player.onended = () => {
        setIsPlaying(false);
      };
      try {
        await player.play();
      } catch (error) {
        if (
          isInterruptedPlaybackError(error) ||
          audioRef.player !== player ||
          audioRef.key !== contentKey
        ) {
          setIsPlaying(false);
          return;
        }
        throw error;
      }
      setIsDownloadButtonShown(true);
    } catch (error) {
      console.error(error);
      setIsPlaying(false);
      setIsPrepared(false);
      setAudioError('Could not prepare voice audio.');
    } finally {
      setPreparing(false);
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

function isInterruptedPlaybackError(error: unknown) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (!(error instanceof Error)) {
    return false;
  }

  return /interrupted|abort|pause/i.test(error.message);
}

export default memo(AIAudioButton);
