import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Color, mobileMaxWidth } from '~/constants/css';
import { socket } from '~/constants/io';
import { useChatContext } from '~/contexts';
import { css } from '@emotion/css';
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
        height: '100%',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '100%'
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
            className={css`
              font-size: 1.2rem;
              margin-top: 0.5rem;
              color: ${Color.darkGray()};
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 0.8rem;
              }
            `}
          >
            at {displayedTime}, {displayedDate}
          </div>
        </div>
        <div
          className={css`
            width: 35rem;
            @media (max-width: ${mobileMaxWidth}) {
              width: 15rem;
            }
          `}
        >
          <AICard
            card={card}
            quality={card.quality}
            imagePath={card.imagePath}
          />
        </div>
        <div
          style={{
            width: '35%',
            height: '100%',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '100%',
              textAlign: 'center',
              fontWeight: 'bold'
            }}
            className={css`
              font-size: 1.6rem;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            #{card.id}
          </div>
          <div
            className={css`
              text-align: center;
              font-size: 1.6rem;
              padding: 5rem 0 6rem 0;
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 4rem;
                font-size: 1.1rem;
              }
            `}
          >
            <span
              style={{ fontFamily: 'Roboto Mono, monospace' }}
              dangerouslySetInnerHTML={{ __html: `"${promptText}"` }}
            />
          </div>
          <div
            className={css`
              text-align: center;
              font-size: 1.2rem;
              font-family: helvetica, sans-serif;
              text-transform: capitalize;
              font-weight: bold;
              color: ${Color.darkerGray()};
              @media (max-width: ${mobileMaxWidth}) {
                margin-top: 5rem;
                font-size: 1rem;
              }
            `}
          >
            {card.style}
          </div>
        </div>
      </div>
    </div>
  );
}
