import React, { useMemo } from 'react';
import { Color } from '~/constants/css';
import { wordLevelHash } from '~/constants/defaultValues';
import Icon from '~/components/Icon';
import { addCommasToNumber } from '~/helpers/stringHelpers';

export default function WordRegisterStatus({
  entry
}: {
  entry: {
    word: string;
    level: 1 | 2 | 3 | 4 | 5;
    xp: number;
    coins: number;
    timestamp: string;
  };
}) {
  const { word, level, xp, coins, timestamp } = entry;
  const wordLabel = /\s/.test(word) ? 'term' : 'word';
  const xpWithCommas = useMemo(() => addCommasToNumber(xp), [xp]);
  const coinsWithCommas = useMemo(() => addCommasToNumber(coins), [coins]);

  return (
    <div style={{ padding: '0.5rem 1rem', color: '#fff', fontSize: '1.1rem' }}>
      <span>[{timestamp}]</span> Discovered{' '}
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
        style={{
          color: Color.brownOrange()
        }}
      />{' '}
      <span style={{ color: Color.brownOrange() }}>{coinsWithCommas}</span>
    </div>
  );
}
