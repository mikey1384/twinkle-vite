import React from 'react';
import useAICard from '~/helpers/hooks/useAICard';
import { qualityProps } from '~/constants/defaultValues';
import {
  isTotalMysteryQuality,
  totalMysteryTextClass
} from '~/components/AICard/totalMysteryGlow';
import SanitizedHTML from 'react-sanitized-html';
import { Card } from '~/types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function AICardDetails({
  className,
  style,
  card,
  density = 'full',
  showIdentity = false
}: {
  className?: string;
  style?: React.CSSProperties;
  card: Partial<Card>;
  density?: 'full' | 'preview' | 'target';
  showIdentity?: boolean;
}) {
  const { promptText, engine, word, cardColor } = useAICard(card);
  const compact = density !== 'full';
  const target = density === 'target';
  const isNanoBananaEngine =
    engine === 'Nano Banana' || engine === 'Nano Banana 2';

  const formattedDate = card.timeStamp
    ? new Date(card.timeStamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: target ? 'short' : 'long',
        day: 'numeric'
      })
    : '';

  return (
    <div
      className={`ai-card-details ${compact ? 'ai-card-details--compact' : ''} ${css`
        display: flex;
        flex-direction: column;
        justify-content: ${compact ? 'center' : 'space-between'};
        align-items: center;
        height: 100%;
        padding: ${compact ? '0' : '2rem'};
        min-width: 0;
        gap: ${target ? '0.2rem' : compact ? '0.4rem' : '0'};
        ${compact ? 'font-weight: 400; line-height: 1.4;' : ''}
        box-sizing: border-box;
      `} ${className || ''}`}
      style={style}
    >
      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 800px;
          flex-grow: ${compact ? 0 : 1};
          min-width: 0;
          gap: ${target ? '0.15rem' : compact ? '0.35rem' : '0'};
        `}
      >
        {showIdentity && (
          <div
            className={`ai-card-details__identity ${css`
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              flex-wrap: wrap;
              gap: 0.3rem 0.7rem;
              text-align: center;
              overflow-wrap: anywhere;
              font-family: 'Lato', 'Arial', sans-serif;
            `}`}
          >
            <span style={{ color: cardColor, fontSize: '1.1rem' }}>
              Card #{card.id}
            </span>
            <strong
              style={{ fontSize: compact ? '1.6rem' : '2rem', lineHeight: 1.2 }}
            >
              {word}
            </strong>
          </div>
        )}
        <div
          className={`ai-card-details__quality ${css`
            font-size: ${compact ? '1.2rem' : '1.6rem'};
            font-family: 'Montserrat', sans-serif;
            text-align: center;
            margin-bottom: ${compact ? '0' : '2rem'};
            padding: ${compact ? '0' : '0 5rem'};
            ${compact ? 'line-height: 1.3;' : ''}

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
              padding: ${compact ? '0' : '0 2rem'};
            }
          `}`}
        >
          <b
            className={
              isTotalMysteryQuality(card.quality)
                ? totalMysteryTextClass
                : undefined
            }
            style={card.quality ? qualityProps[card.quality] : undefined}
          >
            {card.quality}
          </b>{' '}
          card
        </div>
        <div
          className={`ai-card-details__prompt ${css`
            font-family: 'Lato', 'Arial', sans-serif;
            font-size: ${compact ? '1.2rem' : '1.5rem'};
            font-weight: 400;
            line-height: ${compact ? '1.4' : '1.6'};
            text-align: center;
            margin: ${target ? '0.15rem 0' : compact ? '0.35rem 0' : '2rem 0'};
            padding: ${compact ? '0' : '0 5rem'};
            color: ${Color.black()};
            ${compact ? `display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${target ? 2 : 4}; overflow: hidden;` : ''}

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
              padding: ${compact ? '0' : '0 2rem'};
            }
          `}`}
        >
          <SanitizedHTML
            allowedAttributes={{ b: ['style'] }}
            html={`"${promptText || ''}"`}
          />
        </div>
        <div
          className={`ai-card-details__meta ${css`
            text-align: center;
            ${target ? 'display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center; gap: 0.1rem 0.65rem;' : ''}
            margin-top: ${compact ? '0.25rem' : '2.5rem'};

            @media (max-width: ${mobileMaxWidth}) {
              margin-top: ${compact ? '0.2rem' : '2rem'};
            }
          `}`}
        >
          <div
            className={css`
              font-size: ${compact ? '1.1rem' : '1.3rem'};
              font-weight: bold;
              font-family: 'Poppins', sans-serif;
              color: ${Color.darkerGray()};
              margin-bottom: ${compact ? '0.2rem' : '0.5rem'};

              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            {card.imagePath ? card.style : '???'}
          </div>
          {((compact && engine) ||
            engine === 'DALL-E 3' ||
            engine === 'image-1' ||
            engine === 'image-1.5' ||
            engine === 'image-2' ||
            engine === 'image-2.5' ||
            isNanoBananaEngine) && (
            <div
              className={css`
                font-size: ${compact ? '1.1rem' : isNanoBananaEngine ? '1.35rem' : '1.2rem'};
                font-family: ${
                  isNanoBananaEngine
                    ? `'Baloo 2', 'Poppins', sans-serif`
                    : engine === 'DALL-E 3'
                      ? `'Orbitron', 'Roboto Mono', sans-serif`
                      : `'Roboto Mono', monospace`
                };
                text-transform: ${engine === 'DALL-E 3' ? 'uppercase' : 'none'};
                letter-spacing: ${
                  isNanoBananaEngine
                    ? '0'
                    : engine === 'DALL-E 3'
                      ? '0.1em'
                      : '0.02em'
                };
                font-weight: ${isNanoBananaEngine ? 800 : 700};
                color: ${Color.darkerGray()};
                margin-top: ${compact ? '0.2rem' : '0.5rem'};
                line-height: 1;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.1);

                @media (max-width: ${mobileMaxWidth}) {
                  font-size: ${isNanoBananaEngine ? '1.12rem' : '1.1rem'};
                }
              `}
            >
              {engine === 'DALL-E 3' ? 'DALL·E 3' : engine}
            </div>
          )}
        </div>
      </div>
      {formattedDate && (
        <div
          className={`ai-card-details__summoned ${css`
            font-size: 1.1rem;
            font-family: 'Lato', sans-serif;
            font-weight: 400;
            color: ${Color.gray()};
            width: 100%;
            text-align: center;

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
              margin-top: ${compact ? '0.2rem' : '1rem'};
              padding: ${compact ? '0' : '0 2rem 1rem'};
            }
          `}`}
        >
          {target ? 'Summoned' : 'Summoned on'} {formattedDate}
        </div>
      )}
    </div>
  );
}
