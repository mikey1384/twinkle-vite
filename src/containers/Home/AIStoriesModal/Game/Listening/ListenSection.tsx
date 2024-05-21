import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { css } from '@emotion/css';

export default function ListenSection({ difficulty }: { difficulty: number }) {
  const loadAIStoryListeningAudio = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningAudio
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    loadAudio();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };

    async function loadAudio() {
      try {
        const audioBlob = await loadAIStoryListeningAudio(difficulty);
        const audioUrl = URL.createObjectURL(audioBlob);
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
        setAudioError('Failed to load audio.');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  return (
    <div>
      {audioError ? (
        <div
          className={css`
            margin: 20px;
            font-size: 1.2em;
            color: red;
          `}
        >
          {audioError}
        </div>
      ) : (
        <div
          className={css`
            margin: 20px;
            font-size: 1.2em;
            color: #333;
          `}
        >
          {isPlaying ? 'Playing audio...' : 'Audio loaded'}
        </div>
      )}
    </div>
  );
}
