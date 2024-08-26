import React from 'react';
import useAICard from '~/helpers/hooks/useAICard';
import { qualityProps } from '~/constants/defaultValues';
import SanitizedHTML from 'react-sanitized-html';
import { Card } from '~/types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function AICardDetails({
  className,
  style,
  card,
  removeRightPadding
}: {
  className?: string;
  style?: React.CSSProperties;
  card: Card;
  removeRightPadding?: boolean;
}) {
  const { promptText, engine } = useAICard(card);

  const formattedDate = new Date(card.timeStamp * 1000).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  return (
    <div
      className={`${css`
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        padding: 2rem;
        box-sizing: border-box;
      `} ${className}`}
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
          flex-grow: 1;
        `}
      >
        <div
          className={css`
            font-size: 1.6rem;
            font-family: 'Montserrat', sans-serif;
            text-align: center;
            margin-bottom: 2rem;
            padding: 0 5rem;

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              padding: 0 2rem;
            }
          `}
        >
          <b style={qualityProps[card.quality]}>{card.quality}</b> card
        </div>
        <div
          className={css`
            font-family: 'Lato', 'Arial', sans-serif;
            font-size: 1.5rem;
            font-weight: 400;
            line-height: 1.6;
            text-align: center;
            margin: 2rem 0;
            padding: 0 5rem;
            color: ${Color.black()};

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
              padding: 0 2rem;
            }
          `}
        >
          <SanitizedHTML
            allowedAttributes={{ b: ['style'] }}
            html={`"${promptText}"`}
          />
        </div>
        <div
          className={css`
            text-align: center;
            margin-top: 5rem;

            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 2rem;
            }
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: bold;
              font-family: 'Poppins', sans-serif;
              color: ${Color.darkerGray()};
              margin-bottom: 0.5rem;

              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            {card.style}
          </div>
          {engine === 'DALL-E 3' && (
            <div
              className={css`
                font-size: 1.2rem;
                font-family: 'Orbitron', 'Roboto Mono', sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                font-weight: 700;
                color: ${Color.darkerGray()};
                margin-top: 0.5rem;
                text-shadow: 0 0 5px rgba(0, 0, 0, 0.1);

                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 1rem;
                }
              `}
            >
              DALL-E 3
            </div>
          )}
        </div>
      </div>
      <div
        className={css`
          font-size: 1rem;
          font-family: 'Lato', sans-serif;
          font-weight: 400;
          color: ${Color.gray()};
          padding: 0 5rem 1rem;
          text-align: center;

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 0.5rem;
            margin-top: 2rem;
            font-size: 0.9rem;
            padding: 0 2rem 1rem;
          }
        `}
        style={{
          paddingRight: removeRightPadding ? 0 : undefined
        }}
      >
        Summoned on {formattedDate}
      </div>
    </div>
  );
}
