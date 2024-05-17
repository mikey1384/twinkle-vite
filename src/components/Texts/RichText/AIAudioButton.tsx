import React, { useState } from 'react';
import Button from '~/components/Button';
import Icon from '~/components/Icon';
import { useAppContext } from '~/contexts';
import { audioRef } from '~/constants/state';

export default function AIAudioButton({
  text,
  voice
}: {
  text: string;
  voice?: string;
}) {
  const textToSpeech = useAppContext((v) => v.requestHelpers.textToSpeech);
  const [isPlaying, setIsPlaying] = useState(false);
  const [preparing, setPreparing] = useState(false);

  return (
    <div style={{ position: 'absolute', bottom: '-3rem', right: 0 }}>
      <Button loading={preparing} skeuomorphic onClick={handleAudioClick}>
        <Icon icon={isPlaying ? 'stop' : 'volume'} />
      </Button>
    </div>
  );

  async function handleAudioClick() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setPreparing(true);
      try {
        const data = await textToSpeech(text, voice);
        const audioUrl = URL.createObjectURL(data);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audioRef.current.play();
        audioRef.current.onended = () => {
          audioRef.current = null;
          setIsPlaying(false);
        };
        setIsPlaying(true);
      } catch (error) {
        console.error(error);
      } finally {
        setPreparing(false);
      }
    }
  }
}
