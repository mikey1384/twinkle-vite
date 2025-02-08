import React, { useEffect } from 'react';
import { css, keyframes } from '@emotion/css';
import { Color } from '~/constants/css';
import { wordLevelHash } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useChatContext } from '~/contexts';

const bounceAnimation = keyframes`
  0% {
    transform: scale(1.5);
    opacity: 0;
  }
  60% {
    transform: scale(0.9);
    opacity: 1;
  }
  80% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

interface WordRegisterEntry {
  id: number;
  word: string;
  action: 'register' | 'hit';
  level: 1 | 2 | 3 | 4 | 5;
  xp: number;
  coins: number;
  timeStamp: number;
  isNew?: boolean;
  isSummonMsg?: false;
}

interface SummonMsgEntry {
  id: number;
  message: string;
  timeStamp: number;
  isNew?: boolean;
  isSummonMsg: true;
}

type WordLogEntry = WordRegisterEntry | SummonMsgEntry;

export default function WordRegisterStatus({ entry }: { entry: WordLogEntry }) {
  const onRemoveNewLogState = useChatContext(
    (v) => v.actions.onRemoveNewLogState
  );

  useEffect(() => {
    if (entry.isNew) {
      const timer = setTimeout(() => {
        onRemoveNewLogState(entry.id);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [entry, onRemoveNewLogState]);

  const containerStyle = css`
    padding: 0.5rem 1rem;
    color: #fff;
    font-size: 1.1rem;
    ${entry.isNew
      ? `animation: ${bounceAnimation} 0.6s ease-out;`
      : 'transform: scale(1); opacity: 1;'}
    transform: scale(1);
  `;

  const displayedTime = new Date(entry.timeStamp).toLocaleTimeString();

  if (entry.isSummonMsg) {
    return (
      <div className={containerStyle}>
        <span>[{displayedTime}]</span> {entry.message}
      </div>
    );
  } else {
    const { word, action, level, xp, coins } = entry;
    const wordLabel = /\s/.test(word) ? 'term' : 'word';
    const xpWithCommas = addCommasToNumber(xp);
    const coinsWithCommas = addCommasToNumber(coins);

    return (
      <div className={containerStyle}>
        <span>[{displayedTime}]</span>{' '}
        {action === 'register' ? 'Discovered' : 'Collected'}{' '}
        <span
          style={{
            color: Color[wordLevelHash[level].color](),
            fontWeight: 'bold'
          }}
        >
          {word}
        </span>{' '}
        ({wordLevelHash[level].label} {wordLabel}) •{' '}
        <span style={{ color: Color.gold() }}>{xpWithCommas} XP</span> •{' '}
        <Icon
          icon={['far', 'badge-dollar']}
          style={{ color: Color.brownOrange() }}
        />{' '}
        <span style={{ color: Color.brownOrange() }}>{coinsWithCommas}</span>
      </div>
    );
  }
}
