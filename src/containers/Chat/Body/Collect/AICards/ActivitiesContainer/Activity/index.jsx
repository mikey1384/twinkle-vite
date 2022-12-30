import { useMemo } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SummonActivity from './SummonActivity';
import OfferActivity from './OfferActivity';

Activity.propTypes = {
  cardObj: PropTypes.object.isRequired,
  feed: PropTypes.object.isRequired,
  isLastActivity: PropTypes.bool,
  myId: PropTypes.number,
  onReceiveNewActivity: PropTypes.func.isRequired,
  onSetScrollToBottom: PropTypes.func.isRequired,
  onSetAICardModalCardId: PropTypes.func.isRequired
};

export default function Activity({
  isLastActivity,
  cardObj,
  feed,
  myId,
  onReceiveNewActivity,
  onSetScrollToBottom,
  onSetAICardModalCardId
}) {
  const card = useMemo(() => {
    if (feed.type === 'summon') {
      return cardObj[feed.contentId];
    }
    if (feed.type === 'offer') {
      return cardObj[feed.offer?.cardId];
    }
    return null;
  }, [cardObj, feed]);

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/AICards/ActivitiesContainer/Activity">
      <div
        style={{
          width: '100%',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          marginTop: '2rem',
          marginBottom: isLastActivity ? '3rem' : '5rem'
        }}
      >
        {feed.type === 'summon' && (
          <SummonActivity
            card={card}
            feed={feed}
            isLastActivity={isLastActivity}
            myId={myId}
            onReceiveNewActivity={onReceiveNewActivity}
            onSetAICardModalCardId={onSetAICardModalCardId}
            onSetScrollToBottom={onSetScrollToBottom}
          />
        )}
        {feed.type === 'offer' && <OfferActivity feed={feed} card={card} />}
      </div>
    </ErrorBoundary>
  );
}
