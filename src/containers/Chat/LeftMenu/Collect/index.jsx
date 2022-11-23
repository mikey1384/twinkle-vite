import { memo } from 'react';
import PropTypes from 'prop-types';
import { useKeyContext } from '~/contexts';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import {
  AI_DRAWING_CHAT_TYPE,
  VOCAB_CHAT_TYPE
} from '~/constants/defaultValues';
import ErrorBoundary from '~/components/ErrorBoundary';
import AICards from './AICards';
import Vocabulary from './Vocabulary';

Collect.propTypes = {
  aiCardSelected: PropTypes.bool,
  vocabSelected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

function Collect({ aiCardSelected, vocabSelected, onClick }) {
  const { collectType } = useKeyContext((v) => v.myState);

  return (
    <ErrorBoundary componentPath="Chat/LeftMenu/Collect">
      <div
        style={{
          cursor: 'pointer',
          padding: '1rem',
          borderBottom: `1px solid ${Color.borderGray()}`,
          background: (aiCardSelected || vocabSelected) && Color.highlightGray()
        }}
        className={`unselectable ${css`
          &:hover {
            background: ${Color.checkboxAreaGray()};
          }
        `}`}
        onClick={onClick}
      >
        {collectType === VOCAB_CHAT_TYPE && <Vocabulary />}
        {collectType === AI_DRAWING_CHAT_TYPE && <AICards />}
      </div>
    </ErrorBoundary>
  );
}

export default memo(Collect);
