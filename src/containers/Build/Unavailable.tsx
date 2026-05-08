import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { displayFontFamily } from './styles';

export default function Unavailable({
  title,
  text,
  onBack,
  buttonLabel,
  buttonIcon
}: {
  title: string;
  text: string;
  onBack: () => void;
  buttonLabel?: string;
  buttonIcon?: string;
}) {
  return (
    <div
      className={css`
        width: 100%;
        max-width: 720px;
        margin: 3rem auto;
        padding: 0 2rem;
        @media (max-width: ${mobileMaxWidth}) {
          padding: 0 1rem;
        }
      `}
    >
      <div
        className={css`
          padding: 2rem;
          border-radius: 22px;
          background: #fff;
          border: 1px solid var(--ui-border);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        `}
      >
        <span
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.45rem 1rem;
            border-radius: 999px;
            background: rgba(245, 158, 11, 0.14);
            color: #b45309;
            border: 1px solid rgba(245, 158, 11, 0.25);
            font-weight: 900;
            font-size: 1.1rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-family: ${displayFontFamily};
          `}
        >
          <Icon icon="triangle-exclamation" />
          Build Workspace
        </span>
        <div>
          <h1
            className={css`
              margin: 0;
              font-size: 2.4rem;
              line-height: 1.1;
              color: var(--chat-text);
              font-family: ${displayFontFamily};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 2rem;
              }
            `}
          >
            {title}
          </h1>
          <p
            className={css`
              margin: 0.85rem 0 0;
              font-size: 1.1rem;
              line-height: 1.6;
              color: var(--chat-text);
              opacity: 0.8;
            `}
          >
            {text}
          </p>
        </div>
        <GameCTAButton
          variant="primary"
          size="lg"
          icon={buttonIcon || 'arrow-left'}
          onClick={onBack}
        >
          {buttonLabel || 'Back to Build Studio'}
        </GameCTAButton>
      </div>
    </div>
  );
}
