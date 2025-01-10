import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { css } from '@emotion/css';
import { mobileMaxWidth, tabletMaxWidth } from '~/constants/css';
import { useChatContext, useKeyContext } from '~/contexts';

const vocabularyLabel = localize('vocabulary');
const youLabel = localize('You');

const actionLabel: Record<string, string> = {
  register: 'discovered',
  hit: 'collected',
  apply: 'applied',
  answer: 'answered a question about'
};

export default function Vocabulary() {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const vocabFeedIds = useChatContext((v) => v.state.vocabFeedIds);
  const vocabFeedObj = useChatContext((v) => v.state.vocabFeedObj);

  const vocabFeeds = vocabFeedIds.map((id: number) => vocabFeedObj[id] || null);
  const lastFeed = useMemo(() => {
    return vocabFeeds[vocabFeeds.length - 1];
  }, [vocabFeeds]);

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
          {vocabularyLabel}
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
            {actionLabel[lastFeed.action]} <b>{lastFeed.content}</b>
          </p>
        </div>
      )}
    </div>
  );
}
