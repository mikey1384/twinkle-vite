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
        const { audioBlob, imageUrl } = await loadAIStoryListening({
          difficulty
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log(imageUrl);
        audioRef.current = new Audio(audioUrl);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return <div>{isPlaying ? 'playing' : `loading`}</div>;
}
