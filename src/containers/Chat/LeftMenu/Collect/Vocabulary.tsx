import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';

const youLabel = localize('You');

const actionLabel: Record<string, string> = {
  register: 'discovered',
  hit: 'collected',
  apply: 'applied',
  answer: 'answered a question about',
  reward: 'received an'
};

export default function Vocabulary() {
  const myId = useKeyContext((v) => v.myState.userId);
  const vocabFeedIds = useChatContext((v) => v.state.vocabFeedIds);
  const vocabFeedObj = useChatContext((v) => v.state.vocabFeedObj);

  const vocabFeeds = vocabFeedIds.map((id: number) => vocabFeedObj[id] || null);
  const lastFeed = useMemo(() => {
    return vocabFeeds[0] || {};
  }, [vocabFeeds]);
  const target = useMemo(() => {
    if (lastFeed.action === 'reward') {
      return 'AI Card';
    }
    return lastFeed?.content;
  }, [lastFeed]);

  return (
    <div style={{ height: '5rem', position: 'relative' }}>
      <div
        className={css`
          font-size: 1.7rem;
          @media (min-width: ${mobileMaxWidth}) and (max-width: ${tabletMaxWidth}) {
            font-size: 1.3rem;
          }
        `}
      >
        <Icon icon="book" />
        <span style={{ fontWeight: 'bold', marginLeft: '0.7rem' }}>
          Word Master
        </span>
      </div>
      {lastFeed && (
        <div style={{ position: 'absolute' }}>
          <p
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            {lastFeed.userId === myId ? youLabel : lastFeed.username}{' '}
            {actionLabel[lastFeed.action]} <b>{target}</b>
          </p>
        </div>
      )}
    </div>
  );
}
