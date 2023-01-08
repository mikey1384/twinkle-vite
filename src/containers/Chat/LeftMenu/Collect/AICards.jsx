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
    if (lastActivity?.type === 'transfer')
      cardId = lastActivity?.transfer?.cardId;
    return cardObj[cardId];
  }, [aiCardFeeds, cardObj]);

  const user = useMemo(() => {
    const lastActivity = aiCardFeeds?.[aiCardFeeds?.length - 1];
    if (lastActivity?.type === 'offer') {
      return lastActivity?.offer?.user;
    }
    if (lastActivity?.type === 'transfer') {
      if (!!lastActivity?.transfer?.askId) {
        return lastActivity?.transfer?.to;
      }
      if (!!lastActivity?.transfer?.offerId) {
        return lastActivity?.transfer?.from;
      }
    }
    return card?.creator;
  }, [aiCardFeeds, card]);

  const action = useMemo(() => {
    const lastActivity = aiCardFeeds?.[aiCardFeeds?.length - 1];
    if (lastActivity?.type === 'offer') {
      return `offered ${addCommasToNumber(lastActivity?.offer?.price)} coin${
        lastActivity?.offer?.price > 1 ? 's' : ''
      } for a${card?.quality === 'elite' ? 'n' : ''}`;
    }
    if (lastActivity?.type === 'transfer') {
      if (!!lastActivity?.transfer?.askId) {
        return `bought a${card?.quality === 'elite' ? 'n' : ''}`;
      }
      if (!!lastActivity?.transfer?.offerId) {
        return `sold a${card?.quality === 'elite' ? 'n' : ''}`;
      }
    }
    return `summoned a${card?.quality === 'elite' ? 'n' : ''}`;
  }, [aiCardFeeds, card?.quality]);

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
