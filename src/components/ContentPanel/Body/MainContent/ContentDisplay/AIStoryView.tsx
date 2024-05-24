import React, { useEffect, useMemo, useState } from 'react';
import { useSpring, animated } from '@react-spring/web';
import RichText from '~/components/Texts/RichText';
import Image from '~/components/Image';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { cloudFrontURL } from '~/constants/defaultValues';
import { audioRef } from '~/constants/state';
import { useViewContext } from '~/contexts';
import Icon from '~/components/Icon';

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

const getButtonColors = (difficulty: number) => {
  const buttonColors: { [key: number | string]: [string, string] } = {
    1: ['#6ea8ff', '#5a95e6'],
    2: ['#ff6f91', '#ff8aab'],
    3: ['#ffa726', '#ffb74d'],
    4: ['#ab47bc', '#ba68c8'],
    5: ['#ffd700', '#ffc107'],
    default: ['#f0f8ff', '#e0e7ff']
  };
  return buttonColors[difficulty] || buttonColors.default;
};

export default function AIStoryView({
  audioPath,
  difficulty = 0,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [hovered, setHovered] = useState(false);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const contentKey = `${contentId}-${contentType}`;

  useEffect(() => {
    setIsPlaying(
      audioKey === contentKey && audioRef.player && !audioRef.player.paused
    );
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

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

  const buttonColors = getButtonColors(difficulty);
  const buttonSpring = useSpring({
    background: hovered
      ? `linear-gradient(135deg, ${buttonColors[1]}, ${buttonColors[0]})`
      : `linear-gradient(135deg, ${buttonColors[0]}, ${buttonColors[1]})`,
    transform: hovered ? 'translateY(-2px)' : 'translateY(0px)',
    boxShadow: hovered
      ? '0 6px 8px rgba(0, 0, 0, 0.15)'
      : '0 4px 6px rgba(0, 0, 0, 0.1)',
    config: {
      duration: 100,
      easing: (t) => t * t
    }
  });

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
          <animated.button
            className={css`
              border: none;
              color: white;
              padding: 15px 30px;
              font-size: 1em;
              font-weight: bold;
              border-radius: 5px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              cursor: pointer;
              transition: transform 0.2s ease-in-out,
                box-shadow 0.3s ease-in-out;

              &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
              }

              &:disabled {
                background: linear-gradient(135deg, #ddd, #ccc);
                cursor: not-allowed;
              }
            `}
            style={{
              background: buttonSpring.background,
              transform: buttonSpring.transform,
              boxShadow: buttonSpring.boxShadow
            }}
            onClick={handlePlayPause}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <Icon icon={isPlaying ? 'stop' : 'volume'} />
            <span style={{ marginLeft: '0.7rem' }}>
              {isPlaying ? 'Stop' : 'Listen'}
            </span>
          </animated.button>
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

  function handlePlayPause() {
    if (audioRef.player) {
      audioRef.player.pause();
      if (contentKey !== audioRef.key) {
        audioRef.player = null;
      }
    }
    onSetAudioKey(contentKey);
    if (isPlaying) {
      return setIsPlaying(false);
    }
    if (!audioRef.player) {
      audioRef.player = new Audio(appliedAudioUrl);
    }
    audioRef.player.play();
    audioRef.player.onended = () => {
      setIsPlaying(false);
    };
    setIsPlaying(true);
  }
}
