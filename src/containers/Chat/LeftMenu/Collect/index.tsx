import React from 'react';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { AI_CARD_CHAT_TYPE, VOCAB_CHAT_TYPE } from '~/constants/defaultValues';
import ErrorBoundary from '~/components/ErrorBoundary';
import AICards from './AICards';
import Vocabulary from './Vocabulary';

export default function Collect({
  aiCardSelected,
  vocabSelected,
  onClick
}: {
  aiCardSelected: boolean;
  vocabSelected: boolean;
  onClick: () => void;
}) {
  const collectType = useKeyContext((v) => v.myState.collectType);
  const displayedCollectType = vocabSelected
    ? VOCAB_CHAT_TYPE
    : aiCardSelected
      ? AI_CARD_CHAT_TYPE
      : collectType;

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Collect">
      <div
        role="button"
        tabIndex={0}
        aria-label={displayedCollectType === AI_CARD_CHAT_TYPE ? 'AI Cards' : 'Word Master'}
        style={{
          cursor: 'pointer',
          borderBottom: '1px solid var(--ui-border)',
          background:
            aiCardSelected || vocabSelected ? Color.highlightGray() : undefined
        }}
        className={`unselectable ${css`
          padding: 1rem;
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
          &:focus-visible { outline: 2px solid #64748b; outline-offset: -2px; }
          @container chat-channels (max-width: 180px) {
            padding: 0.7rem 0.6rem;
            > div > div:first-child {
              font-size: 14px;
              display: flex;
              align-items: center;
              > svg { flex-shrink: 0; }
            }
            p { font-size: 12px; }
          }
        `}`}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
          }
        }}
      >
        {displayedCollectType === AI_CARD_CHAT_TYPE ? (
          <AICards />
        ) : (
          <Vocabulary />
        )}
      </div>
    </ErrorBoundary>
  );
}
