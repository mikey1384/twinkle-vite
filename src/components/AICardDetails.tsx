import React from 'react';
import useAICard from '~/helpers/hooks/useAICard';
import { qualityProps } from '~/constants/defaultValues';
import SanitizedHTML from 'react-sanitized-html';
import { Card } from '~/types';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function AICardDetails({
  style,
  card,
  removeRightPadding
}: {
  style?: React.CSSProperties;
  card: Card;
  removeRightPadding?: boolean;
}) {
  const { promptText } = useAICard(card);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        alignItems: 'center',
        ...style
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center',
          minHeight: '100%',
          padding: '0 1rem'
        }}
      >
        <div
          className={`card-quality ${css`
            font-size: 1.6rem;
            font-family: Open Sans, sans-serif;
            text-align: center;
            padding: 0 ${removeRightPadding ? 0 : '5rem'} 0 5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
              padding: 0 ${removeRightPadding ? 0 : '2rem'} 0 2rem;
            }
          `}`}
        >
          <b
            style={{
              ...qualityProps[card.quality]
            }}
          >
            {card.quality}
          </b>{' '}
          card
        </div>
        <div
          className={css`
            padding: 3rem ${removeRightPadding ? 0 : '5rem'} 5rem 5rem;
            text-align: center;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 3rem ${removeRightPadding ? 0 : '2rem'} 4rem 2rem;
            }
          `}
        >
          <span
            className={css`
              font-family: Roboto Mono, monospace;
              font-size: 1.5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.1rem;
              }
            `}
          >
            <SanitizedHTML
              allowedAttributes={{ b: ['style'] }}
              html={`"${promptText}"`}
            />
          </span>
        </div>
        <div>
          <b
            className={css`
              font-size: 1.3rem;
              font-family: helvetica, sans-serif;
              color: ${Color.darkerGray()};
              padding: 0 ${removeRightPadding ? 0 : '5rem'} 0 5rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
                padding: 0 ${removeRightPadding ? 0 : '2rem'} 0 2rem;
              }
            `}
          >
            {card.style}
          </b>
        </div>
      </div>
    </div>
  );
}
