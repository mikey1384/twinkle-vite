import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';
import { css, keyframes } from '@emotion/css';

export default function ListenSection({ difficulty }: { difficulty: number }) {
  const loadAIStoryListeningAudio = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningAudio
  );
  const loadAIStoryListeningImage = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningImage
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    loadAudio();
    loadImage();

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

    async function loadImage() {
      try {
        const storyText = 'dummy_story_text'; // Replace with the actual story text if available
        const userId = 'dummy_user_id'; // Replace with the actual user ID
        const imageUrl = await loadAIStoryListeningImage(storyText, userId);
        setImageUrl(imageUrl);
      } catch (error) {
        console.error('Error loading image:', error);
        setImageError('Failed to load image.');
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
      <div
        className={css`
          position: relative;
          width: 80%;
          max-width: 600px;
          height: 300px;
          background-color: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        {!imageLoaded && !imageError && (
          <div
            className={css`
              width: 100%;
              height: 100%;
              background-color: #e0e0e0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2em;
              color: #888;
            `}
          >
            <div
              className={css`
                border: 4px solid rgba(0, 0, 0, 0.1);
                width: 36px;
                height: 36px;
                border-radius: 50%;
                border-left-color: #09f;
                animation: ${keyframes`
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                `} 1s linear infinite;
              `}
            ></div>
          </div>
        )}
        {imageError && (
          <div
            className={css`
              width: 100%;
              height: 100%;
              background-color: #e0e0e0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 1.2em;
              color: #888;
            `}
          >
            {imageError}
          </div>
        )}
        {imageUrl && (
          <img
            src={imageUrl}
            alt="Story"
            className={css`
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
              display: ${imageLoaded ? 'block' : 'none'};
            `}
            onLoad={() => setImageLoaded(true)}
          />
        )}
      </div>
    </div>
  );
}
