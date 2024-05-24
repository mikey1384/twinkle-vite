import React, { useEffect, useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext, useViewContext } from '~/contexts';
import { audioRef } from '~/constants/state';
import { isMobile } from '~/helpers';

const deviceIsMobile = isMobile(navigator);

export default function AIAudioButton({
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
  const [preparing, setPreparing] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(
      !deviceIsMobile || (audioRef.key === contentKey && audioRef.player)
    );
  }, [contentKey]);

  useEffect(() => {
    setIsPlaying(
      audioKey === contentKey && audioRef.player && !audioRef.player.paused
    );
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

  return (
    <div style={{ position: 'absolute', bottom: '-3rem', right: 0 }}>
      <Button loading={preparing} skeuomorphic onClick={handleAudioClick}>
        <Icon icon={isPlaying ? 'stop' : isLoaded ? 'volume' : 'volume-mute'} />
      </Button>
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
        const audioUrl = URL.createObjectURL(data);
        const audio = new Audio(audioUrl);
        audioRef.player = audio;
      }
      if (!isLoaded) return setIsLoaded(true);
      setIsPlaying(true);
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
}
