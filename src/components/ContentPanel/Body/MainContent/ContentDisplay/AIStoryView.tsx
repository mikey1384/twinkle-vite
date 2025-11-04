import React, { useEffect, useMemo, useState } from 'react';
import { useSpring, animated } from 'react-spring';
import RichText from '~/components/Texts/RichText';
import Image from '~/components/Image';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { cardLevelHash, cloudFrontURL } from '~/constants/defaultValues';
import { audioRef } from '~/constants/state';
import { useViewContext } from '~/contexts';
import Icon from '~/components/Icon';
import { useRoleColor } from '~/theme/useRoleColor';

function adjustColor(color: string, amount: number) {
  const match = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i
  );
  if (!match) return color;
  const [, rStr, gStr, bStr, aStr] = match;
  const clamp = (value: number) => Math.min(255, Math.max(0, value));
  const r = clamp(Number(rStr) + amount);
  const g = clamp(Number(gStr) + amount);
  const b = clamp(Number(bStr) + amount);
  const alpha = aStr !== undefined ? parseFloat(aStr) : 1;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const readingContentClass = css`
  width: 100%;
  margin: 0;
  padding: 0;
  opacity: 0;
  animation: fadein 0.85s ease forwards;
  line-height: 1.65;

  @keyframes fadein {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const AnimatedButton = animated.button as any;

export default function AIStoryView({
  audioPath,
  difficulty = 0,
  contentId,
  contentType,
  imagePath,
  imageStyle,
  isListening,
  title,
  topic,
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
  title?: string;
  topic?: string;
  story: string;
  theme?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const onSetAudioKey = useViewContext((v) => v.actions.onSetAudioKey);
  const audioKey = useViewContext((v) => v.state.audioKey);
  const contentKey = `${contentId}-${contentType}`;
  const storyTitle = useMemo(() => {
    const rawTitle = title || topic || 'AI Story';
    const uppercaseSet = new Set(['AI', 'USA', 'UK', 'NASA', 'SAT', 'GRE']);

    return rawTitle
      .split(/\s+/)
      .map((word) => {
        if (!word) return word;
        const candidate = word.toUpperCase();
        if (uppercaseSet.has(candidate)) return candidate;

        const lower = word.toLowerCase();
        const match = lower.match(/[a-z]/i);
        if (!match || match.index === undefined) return word;
        const idx = match.index;
        return (
          lower.slice(0, idx) +
          lower.charAt(idx).toUpperCase() +
          lower.slice(idx + 1)
        );
      })
      .join(' ');
  }, [title, topic]);
  const { getColor: getFilterColor } = useRoleColor('filter', {
    themeName: theme,
    fallback: 'logoBlue'
  });

  const filterColor = useMemo(
    () => getFilterColor() || Color.logoBlue(),
    [getFilterColor]
  );
  const filterSoft = useMemo(() => {
    const match = filterColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
    );
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.5)`;
    }
    return filterColor;
  }, [filterColor]);

  const filterStrong = useMemo(() => {
    const match = filterColor.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
    );
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.7)`;
    }
    return filterColor;
  }, [filterColor]);

  // Shadow color
  const cardShadow = useMemo(() => Color.black(0.2), []);

  const { buttonBaseColor, buttonHoverColor } = useMemo(() => {
    const level = difficulty || 1;
    const colorKey = cardLevelHash[level]?.color || 'logoBlue';
    const colorFn = Color[colorKey] || Color.logoBlue;
    const base = colorFn();
    const hover = adjustColor(base, -35);
    return {
      buttonBaseColor: base,
      buttonHoverColor: hover
    };
  }, [difficulty]);

  useEffect(() => {
    const isPlaying =
      audioKey === contentKey && audioRef.player && !audioRef.player.paused;
    setIsPlaying(isPlaying);
    if (isPlaying) {
      audioRef.player.onended = () => {
        setIsPlaying(false);
      };
    }
    audioRef.key = audioKey;
  }, [audioKey, contentKey]);

  const listeningCardClass = css`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 3.2rem 2.8rem;
    border-radius: 16px;
    background: #fff;
    border: 1px solid ${filterSoft};
    box-shadow: 0 24px 48px -34px ${cardShadow};
    text-align: center;
    color: ${Color.darkerGray()};
  `;

  const listeningTitleClass = css`
    font-size: 1.45rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${buttonBaseColor};
  `;

  const listeningDescriptionClass = css`
    font-size: 1.9rem;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    color: ${Color.darkGray()};
    max-width: 36rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `;

  const listeningButtonClass = css`
    border: none;
    color: #fff;
    padding: 1.1rem 2.6rem;
    font-size: 1.6rem;
    font-weight: 700;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    transition: transform 0.2s ease, box-shadow 0.25s ease;
    will-change: transform, box-shadow, background;

    &:disabled {
      background: linear-gradient(135deg, #cbd5f5, #a8b5f0);
      cursor: not-allowed;
      box-shadow: none;
    }
  `;

  const readingCardClass = css`
    position: relative;
    width: 100%;
    background: #fff;
    border: 1px solid ${filterSoft};
    border-radius: 20px;
    box-shadow: none;
    padding: 2.4rem 2.6rem;
    color: ${Color.darkerGray()};
    transition: border-color 0.15s ease;

    &:hover {
      border-color: ${filterStrong};
    }
  `;

  const readingHeaderClass = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2rem;
    margin-bottom: 1.8rem;
    flex-wrap: wrap;
  `;

  const levelChipClass = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.45rem 1.2rem;
    border-radius: 999px;
    font-size: 1.25rem;
    font-weight: 600;
    background: ${buttonBaseColor};
    color: #fff;
  `;

  const readingHintClass = css`
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 1.4rem;
    font-weight: 600;
    color: ${Color.darkGray(0.7)};
  `;

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

  const buttonSpring = useSpring({
    background: hovered ? buttonHoverColor : buttonBaseColor,
    transform: hovered ? 'translateY(-1px)' : 'translateY(0px)',
    boxShadow: hovered
      ? `0 16px 28px -22px ${buttonHoverColor}`
      : `0 12px 22px -24px ${buttonBaseColor}`,
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
        <div className={listeningCardClass}>
          <div className={listeningTitleClass}>Listening</div>
          <div className={listeningDescriptionClass}>{storyTitle}</div>
          <AnimatedButton
            className={listeningButtonClass}
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
            <span>{isPlaying ? 'Stop Listening' : 'Listen Now'}</span>
          </AnimatedButton>
        </div>
      ) : (
        <div className={readingCardClass}>
          <div className={readingHeaderClass}>
            <div className={readingHintClass}>
              <Icon icon="book-open" />
              Reading
            </div>
            <div className={levelChipClass}>
              <Icon icon="layer-group" />
              Level {difficulty || 1}
            </div>
          </div>
          <div
            className={readingContentClass}
            style={{
              backgroundColor: 'rgba(255,255,255,0.68)',
              borderRadius: 14,
              padding: '1.6rem'
            }}
          >
            <RichText
              contentId={contentId}
              contentType={contentType}
              section="description"
              theme={theme}
              style={{ color: Color.darkerGray() }}
            >
              {story}
            </RichText>
          </div>
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
