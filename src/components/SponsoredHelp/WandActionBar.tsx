import React from 'react';
import { css } from '@emotion/css';
import GameCTAButton from '~/components/Buttons/GameCTAButton';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import type { WandActionModel } from './wandActions';

// Every wand card's action area (wandActions.ts): the chapter chips (when
// the card has chapters), then the main button, which runs the whole plan
// and has a gentle shine (none with reduced motion), the quiet backup text
// button beside it (when the card has one), and any of the card's own
// state actions (Confirm, Change, Open in chat, ...). Only the main button
// is essential: missing parts take no room.
export default function WandActionBar({
  model,
  variant,
  onMain,
  mainLabel,
  mainProgress,
  mainIcon,
  mainPortrait,
  mainLoading = false,
  onChapter,
  chapterMarks,
  onBackup,
  backupLoading = false,
  extras,
  size = 'md'
}: {
  model: WandActionModel;
  variant: 'logoBlue' | 'pink';
  // no handler: the main button isn't actionable in this state (hidden)
  onMain?: () => void;
  // the state's own wording of the main action ("Continue the tour")
  mainLabel?: string;
  mainProgress?: string;
  mainIcon?: string;
  mainPortrait?: string;
  mainLoading?: boolean;
  onChapter?: (id: string) => void;
  chapterMarks?: Record<string, 'done' | 'current'>;
  onBackup?: () => void;
  backupLoading?: boolean;
  extras?: React.ReactNode;
  size?: 'sm' | 'md';
}) {
  const chapters = onChapter ? model.chapters || [] : [];
  const showBackup = !!(model.backup && onBackup);
  if (!onMain && !chapters.length && !showBackup && !extras) return null;
  return (
    <div className={barClass} data-wand-actions="">
      {chapters.length ? (
        <div className={chaptersClass} data-wand-chapters="">
          {model.chaptersTitle ? <span className="title">{model.chaptersTitle}</span> : null}
          <div className="chips">
            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                data-mark={chapterMarks?.[chapter.id]}
                onClick={() => onChapter?.(chapter.id)}
              >
                {chapterMarks?.[chapter.id] === 'done' ? <Icon icon="check" /> : null}
                {chapter.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {onMain || showBackup || extras ? (
        <div className={rowClass}>
          {onMain ? (
            <span className={mainWrapClass} data-wand-main="">
              <GameCTAButton
                variant={variant}
                size={size}
                shiny
                icon={mainPortrait ? '' : mainIcon || ''}
                loading={mainLoading}
                onClick={onMain}
              >
                <span className={mainInnerClass}>
                  {mainPortrait ? <img src={mainPortrait} alt="" /> : null}
                  {mainLabel || model.mainAction.label}
                  {mainProgress ? <small>{mainProgress}</small> : null}
                </span>
              </GameCTAButton>
            </span>
          ) : null}
          {showBackup ? (
            <button
              type="button"
              className={backupClass}
              disabled={backupLoading}
              aria-busy={backupLoading || undefined}
              onClick={onBackup}
            >
              {model.backup!.label}
            </button>
          ) : null}
          {extras}
        </div>
      ) : null}
    </div>
  );
}

// A quiet text action next to the main button (the backup's look): a card's
// own extra actions such as Take back, Change or Open "My First Game".
export function WandQuietButton({
  onClick,
  loading = false,
  children
}: {
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={backupClass} disabled={loading} aria-busy={loading || undefined} onClick={onClick}>
      {children}
    </button>
  );
}

const barClass = css`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const chaptersClass = css`
  .title {
    display: block;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${Color.darkerGray()};
    margin-bottom: 0.5rem;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid ${Color.borderGray()};
    background: #fff;
    border-radius: 999px;
    padding: 0.35rem 0.9rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: ${Color.darkerGray()};
    cursor: pointer;
    &:hover {
      border-color: ${Color.logoBlue()};
      color: ${Color.logoBlue()};
    }
    &:focus-visible {
      outline: 2px solid ${Color.logoBlue()};
      outline-offset: 1px;
    }
    &[data-mark='done'] {
      background: ${Color.highlightGray()};
    }
    &[data-mark='current'] {
      border-color: ${Color.logoBlue()};
      color: ${Color.logoBlue()};
    }
  }
  @media (max-width: ${mobileMaxWidth}) {
    button {
      font-size: 1.2rem;
    }
  }
`;

const rowClass = css`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem 1rem;
`;

// the main button's sheen: slower than GameCTAButton's default so it reads
// as a gentle invitation, and none at all with reduced motion
const mainWrapClass = css`
  display: inline-flex;
  button::after {
    animation-duration: 4.2s !important;
  }
  @media (prefers-reduced-motion: reduce) {
    button::after {
      animation: none !important;
      display: none !important;
    }
  }
`;

const mainInnerClass = css`
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  img {
    width: 2.6rem;
    height: 2.6rem;
    margin: -0.3rem 0 -0.3rem -0.4rem;
    border-radius: 50%;
    object-fit: cover;
    object-position: 50% 8%;
    background: rgba(255, 255, 255, 0.25);
    border: 2px solid rgba(255, 255, 255, 0.7);
  }
  small {
    font-size: 0.85em;
    font-weight: 700;
    opacity: 0.85;
  }
`;

const backupClass = css`
  background: none;
  border: none;
  padding: 0.4rem 0.2rem;
  cursor: pointer;
  font-size: 1.35rem;
  font-weight: 600;
  color: ${Color.darkerGray()};
  text-decoration: underline;
  text-decoration-color: ${Color.borderGray()};
  text-underline-offset: 0.3rem;
  &:hover {
    color: ${Color.logoBlue()};
    text-decoration-color: currentColor;
  }
  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
