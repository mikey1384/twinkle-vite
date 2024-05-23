import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css, keyframes } from '@emotion/css';
import Questions from './Questions'; // Make sure to import the Questions component

export default function ListenSection({
  difficulty,
  topic,
  topicKey
}: {
  difficulty: number;
  topic: string;
  topicKey: string;
}) {
  const loadAIStoryListeningAudio = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningAudio
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false); // New state to check if audio is finished

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
        const audioBlob = await loadAIStoryListeningAudio({
          difficulty,
          topic,
          topicKey
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        setIsLoaded(true);

        audioRef.current.onended = () => {
          setIsPlaying(false);
          setIsFinished(true); // Set to true when audio finishes
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

  const handlePlayAudio = () => {
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      setCountdown(null);
    }
  }, [countdown]);

  if (isFinished) {
    return <Questions />;
  }

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
            text-align: center;
          `}
        >
          {isPlaying ? (
            <div
              className={css`
                font-family: 'Arial', sans-serif;
                font-size: 2em;
                font-weight: bold;
                color: ${Color.darkerGray()};
              `}
            >
              Listen
            </div>
          ) : isLoaded ? (
            countdown !== null ? (
              <div
                className={css`
                  font-size: 1.8em;
                  font-weight: bold;
                  color: ${Color.darkerGray()};
                `}
              >
                Playing in {countdown}
              </div>
            ) : (
              <button
                onClick={handlePlayAudio}
                disabled={!isLoaded}
                className={css`
                  background: linear-gradient(135deg, #6e8efb, #a777e3);
                  border: none;
                  color: white;
                  padding: 15px 30px;
                  font-size: 1em;
                  font-weight: bold;
                  border-radius: 5px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                  cursor: pointer;
                  transition: background 0.3s ease-in-out, transform 0.2s ease;

                  &:hover {
                    background: linear-gradient(135deg, #5a75f6, #945ad1);
                  }

                  &:disabled {
                    background: linear-gradient(135deg, #ddd, #ccc);
                    cursor: not-allowed;
                  }
                `}
              >
                Start Listening
              </button>
            )
          ) : (
            <div
              className={css`
                display: flex;
                justify-content: center;
                align-items: center;
                height: 50px;
              `}
            >
              <span
                style={{
                  fontFamily: "'Arial', sans-serif",
                  marginRight: '1rem',
                  fontWeight: 'bold',
                  color: Color.darkerGray()
                }}
              >
                Loading Story...
              </span>
              <div
                className={css`
                  border: 4px solid #f3f3f3;
                  border-top: 4px solid #3498db;
                  border-radius: 50%;
                  width: 30px;
                  height: 30px;
                  animation: ${keyframes`
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  `} 2s linear infinite;
                `}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
