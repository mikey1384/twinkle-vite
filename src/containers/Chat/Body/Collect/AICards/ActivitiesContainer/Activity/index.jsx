import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from '~/components/ErrorBoundary';
import SummonActivity from './SummonActivity';
import OfferActivity from './OfferActivity';
import { useNavigate } from 'react-router-dom';
import { Color } from '~/constants/css';
import { css } from '@emotion/css';
import TransferActivity from './TransferActivity';

Activity.propTypes = {
  cardObj: PropTypes.object.isRequired,
  feed: PropTypes.object.isRequired,
  isLastActivity: PropTypes.bool,
  myId: PropTypes.number,
  onReceiveNewActivity: PropTypes.func.isRequired,
  onSetScrollToBottom: PropTypes.func.isRequired
};

export default function Activity({
  isLastActivity,
  cardObj,
  feed,
  myId,
  onReceiveNewActivity,
  onSetScrollToBottom
}) {
  const [usermenuShown, setUsermenuShown] = useState(false);
  const navigate = useNavigate();
  const card = useMemo(() => {
    if (feed.type === 'summon') {
      return cardObj[feed.contentId];
    }
    if (feed.type === 'offer') {
      return cardObj[feed.offer?.cardId];
    }
    if (feed.type === 'transfer') {
      return cardObj[feed.transfer?.cardId];
    }
    return null;
  }, [cardObj, feed]);

  return (
    <ErrorBoundary componentPath="Chat/Body/Collect/AICards/ActivitiesContainer/Activity">
      <div
        style={{
          width: '100%',
          padding: '2rem 1rem',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
          marginTop: '2rem',
          marginBottom: '5rem'
        }}
        className={css`
          cursor: ${feed.type !== 'summon' ? 'pointer' : 'default'};
          background: ${Color.whiteGray()};
          &:hover {
            background: ${feed.type !== 'summon'
              ? Color.highlightGray()
              : Color.whiteGray()};
          }
        `}
        onClick={handleActivityClick}
      >
        {feed.type === 'summon' && (
          <SummonActivity
            card={card}
            isLastActivity={isLastActivity}
            myId={myId}
            onReceiveNewActivity={onReceiveNewActivity}
            onSetScrollToBottom={onSetScrollToBottom}
          />
        )}
        {feed.type === 'offer' && (
          <OfferActivity
            feed={feed}
            card={card}
            myId={myId}
            onSetUsermenuShown={setUsermenuShown}
            isLastActivity={isLastActivity}
            onReceiveNewActivity={onReceiveNewActivity}
            onSetScrollToBottom={onSetScrollToBottom}
          />
        )}
        {feed.type === 'transfer' && (
          <TransferActivity
            feed={feed}
            card={card}
            myId={myId}
            onSetUsermenuShown={setUsermenuShown}
            isLastActivity={isLastActivity}
            onReceiveNewActivity={onReceiveNewActivity}
            onSetScrollToBottom={onSetScrollToBottom}
          />
        )}
      </div>
    </ErrorBoundary>
  );

  function handleActivityClick() {
    if (usermenuShown) {
      return;
    }
    if (feed.type === 'offer') {
      navigate(`./?cardId=${feed.offer.cardId}`);
    }
    if (feed.type === 'transfer') {
      navigate(`./?cardId=${feed.transfer.cardId}`);
    }
  }
}
