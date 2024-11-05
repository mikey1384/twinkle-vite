import React, { useMemo } from 'react';
import Icon from '~/components/Icon';
import { css } from '@emotion/css';
import { tabletMaxWidth, mobileMaxWidth } from '~/constants/css';
import { useChatContext } from '~/contexts';

export default function AICards() {
  const aiCardFeedIds = useChatContext((v) => v.state.aiCardFeedIds);
  const aiCardFeedObj = useChatContext((v) => v.state.aiCardFeedObj);

  const aiCardFeeds = useMemo(
    () => aiCardFeedIds.map((id: number) => aiCardFeedObj[id]),
    [aiCardFeedIds, aiCardFeedObj]
  );

  const lastActivity = useMemo(
    () => aiCardFeeds?.[aiCardFeeds?.length - 1],
    [aiCardFeeds]
  );

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
        <Icon icon="cards-blank" />
        <span style={{ fontWeight: 'bold', marginLeft: '0.7rem' }}>
          AI Cards
        </span>
      </div>
      <div style={{ position: 'absolute' }}>
        <p
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }}
        >
          {lastActivity?.description}
        </p>
      </div>
    </div>
  );
}
