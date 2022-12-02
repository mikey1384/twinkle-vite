import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color } from '~/constants/css';
import { socket } from '~/constants/io';
import { useChatContext } from '~/contexts';
import useAICard from '~/helpers/hooks/useAICard';
import AICard from '~/components/AICard';
import UserInfo from './UserInfo';
import CardInfo from './CardInfo';
import moment from 'moment';

Activity.propTypes = {
  card: PropTypes.object.isRequired,
  isLastActivity: PropTypes.bool,
  myId: PropTypes.number,
  onReceiveNewActivity: PropTypes.func.isRequired,
  onSetScrollToBottom: PropTypes.func.isRequired
};

export default function Activity({
  isLastActivity,
  card,
  myId,
  onReceiveNewActivity,
  onSetScrollToBottom
}) {
  const { cardCss, promptText } = useAICard(card);
  const onRemoveNewlyPostedCardStatus = useChatContext(
    (v) => v.actions.onRemoveNewlyPostedCardStatus
  );
  const userIsCreator = myId === card.creator.id;
  const displayedTime = useMemo(
    () => moment.unix(card.timeStamp).format('hh:mm a'),
    [card.timeStamp]
  );
  const displayedDate = useMemo(
    () => moment.unix(card.timeStamp).format('MMM D'),
    [card.timeStamp]
  );
  useEffect(() => {
    if (isLastActivity && userIsCreator) {
      onSetScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (card.isNewlyPosted && isLastActivity && userIsCreator) {
      handleSendActivity();
    }
    async function handleSendActivity() {
      socket.emit('new_ai_card_activity', card);
      onRemoveNewlyPostedCardStatus(card.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLastActivity && card.isNewlyPosted && !userIsCreator) {
      onRemoveNewlyPostedCardStatus(card.id);
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        width: '100%',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        marginTop: '2rem',
        marginBottom: '5rem'
      }}
      className={cardCss}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <div
          style={{
            width: '30%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            paddingLeft: '1rem'
          }}
        >
          <UserInfo style={{ marginTop: '3rem' }} user={card.creator} />
          <CardInfo quality={card.quality} style={{ marginTop: '3rem' }} />
          <div
            style={{
              color: Color.darkGray(),
              marginTop: '0.5rem',
              fontSize: '1.2rem'
            }}
          >
            at {displayedTime}, {displayedDate}
          </div>
        </div>
        <AICard card={card} quality={card.quality} imagePath={card.imagePath} />
        <div
          style={{
            width: '35%',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              width: '100%',
              marginTop: '3rem',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
          >
            #{card.id}
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: '10rem'
            }}
          >
            <span
              style={{ fontFamily: 'Roboto Mono, monospace' }}
              dangerouslySetInnerHTML={{ __html: `"${promptText}"` }}
            />
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: '12rem',
              fontSize: '1.2rem',
              fontFamily: 'helvetica, sans-serif',
              textTransform: 'capitalize',
              fontWeight: 'bold',
              color: Color.darkerGray()
            }}
          >
            {card.style}
          </div>
        </div>
      </div>
    </div>
  );
}
