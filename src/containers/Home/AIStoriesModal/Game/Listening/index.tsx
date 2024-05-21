import React, { useEffect, useRef, useState } from 'react';
import { useAppContext } from '~/contexts';

export default function Listening({ difficulty }: { difficulty: number }) {
  const loadAIStoryListeningAudio = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningAudio
  );
  const loadAIStoryListeningImage = useAppContext(
    (v) => v.requestHelpers.loadAIStoryListeningImage
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  useEffect(() => {
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

    loadAudio();
    loadImage();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [difficulty]);

  return (
    <div>
      {audioError && <div>{audioError}</div>}
      {isPlaying ? 'playing' : 'loading audio'}
      {imageError && <div>{imageError}</div>}
      {imageUrl && <img src={imageUrl} alt="Story" />}
    </div>
  );
}
