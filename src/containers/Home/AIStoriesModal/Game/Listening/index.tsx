import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';

export default function Listening({ difficulty }: { difficulty: number }) {
  const loadAIStoryListening = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListening
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    async function loadAudio() {
      try {
        const { audio } = await loadAIStoryListening({ difficulty });
        const audioSrc = `data:audio/wav;base64,${audio}`;
        audioRef.current = new Audio(audioSrc);
        audioRef.current.play();
        setIsPlaying(true);

        audioRef.current.onended = () => {
          setIsPlaying(false);
        };

        audioRef.current.onerror = (e) => {
          console.error('Error playing audio:', e);
          setIsPlaying(false);
        };
      } catch (error) {
        console.error('Error loading audio:', error);
      }
    }

    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [difficulty, loadAIStoryListening]);

  return <div>{isPlaying ? 'playing' : `loading`}</div>;
}
