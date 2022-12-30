import { useMemo } from 'react';
import Icon from '~/components/Icon';
import localize from '~/constants/localize';
import { useChatContext, useKeyContext } from '~/contexts';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { qualityProps } from '~/constants/defaultValues';

const youLabel = localize('You');

export default function AICards() {
  const { userId: myId } = useKeyContext((v) => v.myState);
  const aiCardFeeds = useChatContext((v) => v.state.aiCardFeeds);
  const cardObj = useChatContext((v) => v.state.cardObj);

  const card = useMemo(() => {
    const lastActivity = aiCardFeeds?.[aiCardFeeds?.length - 1];
    let cardId = lastActivity?.contentId;
    if (lastActivity?.type === 'offer') cardId = lastActivity?.offer?.cardId;
    return cardObj[cardId];
  }, [aiCardFeeds, cardObj]);

  const user = useMemo(() => {
    const lastActivity = aiCardFeeds?.[aiCardFeeds?.length - 1];
    if (lastActivity?.type === 'offer') return lastActivity?.offer?.user;
    return card?.creator;
  }, [aiCardFeeds, card]);

  const action = useMemo(() => {
    const lastActivity = aiCardFeeds?.[aiCardFeeds?.length - 1];
    if (lastActivity?.type === 'offer')
      return `offered ${addCommasToNumber(
        lastActivity?.offer?.offerPrice
      )} coin${lastActivity?.offer?.offerPrice > 1 ? 's' : ''} for a`;
    return 'summoned a';
  }, [aiCardFeeds]);

  return (
    <div style={{ height: '5rem', position: 'relative' }}>
      <div style={{ fontSize: '1.7rem' }}>
        <Icon icon="cards-blank" />
        <span style={{ fontWeight: 'bold', marginLeft: '0.7rem' }}>
          AI Cards
        </span>
      </div>
      {card && (
        <div style={{ position: 'absolute' }}>
          <p
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            {user.id === myId ? youLabel : user.username}: {action}{' '}
            <span style={{ ...qualityProps[card.quality] }}>
              {card.quality}
            </span>{' '}
            card
          </p>
        </div>
      )}
    </div>
  );
}
