import React, { useEffect, useMemo, useRef, useState } from 'react';
import RichText from '~/components/Texts/RichText';
import Image from '~/components/Image';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';

const aiStoryCSS = css`
  width: 100%;
  margin-top: 0;
  margin-bottom: 0.5rem;
  padding: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-family: 'Poppins', sans-serif;
  font-size: 1.6rem;
  transition: box-shadow 0.2s ease;
  line-height: 1.7;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }

  opacity: 0;
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

export default function AIStoryView({
  audioPath,
  difficulty,
  contentId,
  contentType,
  imagePath,
  imageStyle,
  isListening,
  story,
  theme
}: {
  audioPath?: string;
  difficulty?: number;
  contentId: number;
  contentType: string;
  imagePath?: string;
  imageStyle?: string;
  isListening?: boolean;
  story: string;
  theme?: string;
}) {
  const [fadeIn, setFadeIn] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const borderColor = useMemo(() => {
    const colors: {
      [key: number]: string;
    } = {
      1: '#B3D1E0',
      2: '#F2C1C6',
      3: '#E6B280',
      4: '#E1BAE8',
      5: '#E6C85F'
    };
    return colors[difficulty || 1] || '#a4b8c4';
  }, [difficulty]);
  const difficultyColor = useMemo(() => {
    switch (difficulty) {
      case 1:
        return '#D0EBFF';
      case 2:
        return '#FCE4EC';
      case 3:
        return '#FAD7A0';
      case 4:
        return '#F4D7FA';
      case 5:
        return Color.gold(0.5);
      default:
        return '#f0f8ff';
    }
  }, [difficulty]);
  const appliedImageUrl = useMemo(() => {
    if (imagePath) {
      return `${cloudFrontURL}/ai-story/${imagePath}`;
    }
    return '';
  }, [imagePath]);
  const appliedAudioUrl = useMemo(() => {
    if (audioPath) {
      return `${cloudFrontURL}/ai-story-audio/${audioPath}`;
    }
    return '';
  }, [audioPath]);

  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {appliedImageUrl && (
        <div
          className={css`
            margin-bottom: 2rem;
            text-align: center;
            position: relative;
          `}
        >
          <div
            className={css`
              height: 50vh;
            `}
          >
            <Image imageUrl={appliedImageUrl} backgroundColor="transparent" />
          </div>
          {imageStyle && (
            <p
              className={css`
                display: none;
                font-family: 'Playfair Display', serif;
                font-size: 1.4rem;
                font-style: italic;
                color: #666;
                margin-top: 1rem;
              `}
            >
              {imageStyle}
            </p>
          )}
        </div>
      )}
      {isListening ? (
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            padding: '5rem 0'
          }}
        >
          <audio ref={audioRef} src={appliedAudioUrl} />
          <button
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
            onClick={() => audioRef.current?.play()}
          >
            Listen
          </button>
        </div>
      ) : (
        <div
          style={{
            backgroundColor: difficultyColor,
            border: `1px solid ${borderColor}`,
            animation: fadeIn ? 'fadein 1s ease forwards' : 'none'
          }}
          className={aiStoryCSS}
        >
          <RichText
            contentId={contentId}
            contentType={contentType}
            section="description"
            theme={theme}
            style={{ color: '#000' }}
          >
            {story}
          </RichText>
        </div>
      )}
    </div>
  );
}
