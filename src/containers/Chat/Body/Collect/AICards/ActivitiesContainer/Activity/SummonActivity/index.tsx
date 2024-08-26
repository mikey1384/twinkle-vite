import React, { useEffect, useMemo } from 'react';
import AICard from '~/components/AICard';
import UserInfo from './UserInfo';
import CardInfo from './CardInfo';
import useAICard from '~/helpers/hooks/useAICard';
import moment from 'moment';
import SanitizedHTML from 'react-sanitized-html';
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
  const isMyActivity = myId === card.creator.id;
  useEffect(() => {
    if (isLastActivity && !isMyActivity) {
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isLastActivity && isMyActivity) {
      onSetScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { promptText } = useAICard(card);

  return (
    <div
      className={css`
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 100%;
        font-family: 'Lato', 'Arial', sans-serif;
        font-size: 1.5rem;
        line-height: 1.6;
        @media (max-width: ${mobileMaxWidth}) {
          font-size: 1.1rem;
        }
      `}
    >
      <div
        className={css`
          width: 30%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-left: 1rem;
        `}
      >
        <UserInfo style={{ marginTop: '3rem' }} user={card.creator} />
        <CardInfo quality={card.quality} style={{ marginTop: '3rem' }} />
        <div
          className={css`
            margin-top: 0.5rem;
            color: ${Color.gray()};
            font-size: 1rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 0.9rem;
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
        className={css`
          width: 35%;
          height: 100%;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        `}
      >
        <div
          className={css`
            width: 100%;
            text-align: center;
            font-weight: bold;
            font-size: 1.6rem;
            font-family: 'Montserrat', sans-serif;
            margin-bottom: 2rem;
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
            padding: 2rem 0;
            font-family: 'Lato', 'Arial', sans-serif;
            font-size: 1.5rem;
            font-weight: 400;
            line-height: 1.6;
            color: ${Color.black()};
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.1rem;
              padding: 1rem;
            }
          `}
        >
          <SanitizedHTML
            allowedAttributes={{ b: ['style'] }}
            html={`"${promptText}"`}
          />
        </div>
        <div
          className={css`
            margin-top: 2rem;
            text-align: center;
            font-size: 1.3rem;
            font-weight: bold;
            font-family: 'Poppins', sans-serif;
            color: ${Color.darkerGray()};
            margin-bottom: 0.5rem;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1rem;
            }
          `}
        >
          {card.style}
        </div>
        {card.engine === 'DALL-E 3' && (
          <div
            className={css`
              text-align: center;
              font-size: 1.2rem;
              font-family: 'Orbitron', 'Roboto Mono', sans-serif;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              font-weight: 700;
              color: ${Color.darkerGray()};
              margin-top: 0.5rem;
              text-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1rem;
              }
            `}
          >
            DALL-E 3
          </div>
        )}
      </div>
    </div>
  );
}
