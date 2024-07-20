import React, { memo, useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import { audioRef } from '~/constants/state';
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    setIsLoaded(
      !deviceIsMobile || (audioRef.key === contentKey && audioRef.player)
    );
  }, [contentKey]);

  useEffect(() => {
    const isPlaying =
      audioKey === contentKey && audioRef.player && !audioRef.player.paused;
    setIsPlaying(isPlaying);
    if (isPlaying) {
      audioRef.player.onended = () => {
        setIsPlaying(false);
      };
    }
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '-3rem',
        right: 0,
        display: 'flex',
        alignItems: 'center'
      }}
    >
      <Button loading={preparing} skeuomorphic onClick={handleAudioClick}>
        <Icon icon={isPlaying ? 'stop' : isLoaded ? 'volume' : 'volume-mute'} />
      </Button>
      {isDownloadButtonShown && (
        <Button
          style={{ marginLeft: '1rem' }}
          skeuomorphic
          onClick={handleDownloadClick}
        >
          <Icon icon="download" />
        </Button>
      )}
    </div>
  );

  async function handleAudioClick() {
    if (audioRef.player) {
      audioRef.player.pause();
      if (contentKey !== audioRef.key) {
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
      if (!audioRef.player) {
        const data = await textToSpeech(text, voice);
        const audioBlob = new Blob([data], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioRef.player = audio;
        setAudioUrl(audioUrl);
      }
      if (!isLoaded) return setIsLoaded(true);
      setIsPlaying(true);
      setIsDownloadButtonShown(true);
      audioRef.player.play();
      audioRef.player.onended = () => {
        setIsPlaying(false);
      };
    } catch (error) {
      console.error(error);
    } finally {
      setPreparing(false);
    }
  }

  function handleDownloadClick() {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `${contentKey}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
}

export default memo(AIAudioButton);
