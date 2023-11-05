import React, { useEffect, useMemo } from 'react';
import AICard from '~/components/AICard';
import UserInfo from './UserInfo';
import CardInfo from './CardInfo';
import useAICard from '~/helpers/hooks/useAICard';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/css';
import { Color, mobileMaxWidth } from '~/constants/css';

export default function SummonActivity({
  card,
  isLastActivity,
  myId,
  onReceiveNewActivity,
  onSetScrollToBottom
}: {
  card: any;
  isLastActivity: boolean;
  myId: number;
  onReceiveNewActivity: () => void;
  onSetScrollToBottom: () => void;
}) {
  const navigate = useNavigate();
  const displayedTime = useMemo(
    () => moment.unix(card.timeStamp).format('hh:mm a'),
    [card.timeStamp]
  );
  const displayedDate = useMemo(
    () => moment.unix(card.timeStamp).format('MMM D'),
    [card.timeStamp]
  );
  useEffect(() => {
    if (isLastActivity && !userisAdmin) {
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const userisAdmin = myId === card.creator.id;
  useEffect(() => {
    if (isLastActivity && userisAdmin) {
      onSetScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { promptText } = useAICard(card);

  return (
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
        <AICard card={card} onClick={() => navigate(`./?cardId=${card.id}`)} />
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
            padding: 5rem 0 6rem 1rem;
            @media (max-width: ${mobileMaxWidth}) {
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
              font-size: 1rem;
            }
          `}
        >
          {card.style}
        </div>
      </div>
    </div>
  );
}
