import React, { useEffect, useMemo, useState } from 'react';
import RichText from '~/components/Texts/RichText';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';

export default function AIStoryView({
  difficulty,
  contentId,
  contentType,
  story,
  theme
}: {
  difficulty?: number;
  contentId: number;
  contentType: string;
  story: string;
  theme?: string;
}) {
  const [fadeIn, setFadeIn] = useState(false);
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
  useEffect(() => {
    setFadeIn(true);
  }, []);

  return (
    <div style={{ width: '100%' }}>
      <div
        className={css`
          width: 100%;
          margin-top: 0;
          margin-bottom: 0.5rem;
          background-color: ${difficultyColor};
          padding: 1rem;
          border: 1px solid ${borderColor};
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
          animation: ${fadeIn ? 'fadein 1s ease forwards' : 'none'};
          @keyframes fadein {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
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
    </div>
  );
}
