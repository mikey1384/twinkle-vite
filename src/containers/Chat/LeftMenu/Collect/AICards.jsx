import { useMemo } from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { useChatContext, useKeyContext } from '~/contexts';
import { qualityProps } from '~/constants/defaultValues';

const youLabel = localize('You');

export default function AICards() {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const aiCardFeeds = useChatContext((v) => v.state.aiCardFeeds);
  const cardObj = useChatContext((v) => v.state.cardObj);
  const aiCards = useMemo(
    () => aiCardFeeds.map((id) => cardObj[id]),
    [aiCardFeeds, cardObj]
  );

  const lastActivity = useMemo(() => {
    return aiCards?.[aiCards?.length - 1];
  }, [aiCards]);

  return (
    <div style={{ height: '5rem', position: 'relative' }}>
      <div style={{ fontSize: '1.7rem' }}>
        <Icon icon="cards-blank" />
        <span style={{ fontWeight: 'bold', marginLeft: '0.7rem' }}>
          AI Cards
        </span>
      </div>
      {lastActivity && (
        <div style={{ position: 'absolute' }}>
          <p
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            {lastActivity.userId === myId
              ? youLabel
              : lastActivity.creator.username}
            : created a{' '}
            <span style={{ ...qualityProps[lastActivity.quality] }}>
              {lastActivity.quality}
            </span>{' '}
            card
          </p>
        </div>
      )}
    </div>
  );
}
