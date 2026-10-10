import React from 'react';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

// The frame around a full-width chat card that has no author row (a trade,
// a gift, an AI card offer or sale, a game result, a Wordle result). It gives
// the card the same message actions and reaction row as any other message:
// the actions sit in a strip above the card, so they never cover the card's
// own header, and the reactions sit under it.
export default function InteractiveCardFrame({
  label,
  highlighted,
  actions,
  reactions,
  children
}: {
  label: string;
  highlighted: boolean;
  actions: React.ReactNode;
  reactions: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      role="article"
      aria-label={label}
      tabIndex={0}
      data-chat-message
      data-interactive-card
      className={css`
        position: relative;
        width: 100%;
        ${highlighted ? `background-color: ${Color.whiteGray()};` : ''}
        .menu-button {
          display: ${highlighted ? 'block' : 'none'};
        }
        &:hover,
        &:focus-within {
          background-color: ${Color.whiteGray()};
          .menu-button {
            display: block;
          }
        }
        @media (max-width: 1024px), (pointer: coarse) {
          .menu-button {
            display: block;
          }
        }
        @media (max-width: ${mobileMaxWidth}) {
          &:hover {
            background-color: transparent;
          }
        }
      `}
    >
      <div className={actionsStripClass}>{actions}</div>
      {children}
      {reactions ? <div className={reactionsClass}>{reactions}</div> : null}
    </div>
  );
}

const actionsStripClass = css`
  position: relative;
  height: 3.4rem;
  margin: 0 1.2rem;
  z-index: 2;
  @media (max-width: ${mobileMaxWidth}) {
    margin: 0 0.8rem;
  }
`;

const reactionsClass = css`
  padding: 0 1.2rem 0.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    padding: 0 0.8rem 0.6rem;
  }
`;
