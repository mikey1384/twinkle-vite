import React, { useEffect, useState } from 'react';
import { useAppContext } from '~/contexts';
import { css, keyframes } from '@emotion/css';

export default function GeneratedImage() {
  const loadAIStoryListeningImage = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningImage
  );
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
    loadImage();

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
  }, []);

  return (
    <div>
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
            loading="lazy"
            fetchPriority="low"
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
