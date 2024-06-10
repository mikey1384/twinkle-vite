import React from 'react';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import { AI_CARD_CHAT_TYPE } from '~/constants/defaultValues';
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
  const { collectType } = useKeyContext((v) => v.myState);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Collect">
      <div
        style={{
          cursor: 'pointer',
          padding: '1rem',
          borderBottom: `1px solid ${Color.borderGray()}`,
          background:
            aiCardSelected || vocabSelected ? Color.highlightGray() : undefined
        }}
        className={`unselectable ${css`
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
        `}`}
        onClick={onClick}
      >
        {collectType === AI_CARD_CHAT_TYPE ? <AICards /> : <Vocabulary />}
      </div>
    </ErrorBoundary>
  );
}
