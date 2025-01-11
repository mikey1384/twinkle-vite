import React, { useEffect, useMemo, useState } from 'react';
import ProfilePic from '~/components/ProfilePic';
import UsernameText from '~/components/Texts/UsernameText';
import WordModal from '../WordModal';
import Icon from '~/components/Icon';
import moment from 'moment';
import { css } from '@emotion/css';
import { wordLevelHash } from '~/constants/defaultValues';
import { mobileMaxWidth, wideBorderRadius } from '~/constants/css';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { socket } from '~/constants/sockets/api';
import { useChatContext } from '~/contexts';

function getRGBA(colorName: string, opacity = 1) {
  switch (colorName) {
    case 'logoBlue':
      return `rgba(62, 138, 230, ${opacity})`;
    case 'pink':
      return `rgba(255, 179, 230, ${opacity})`;
    case 'orange':
      return `rgba(255, 183, 90, ${opacity})`;
    case 'red':
      return `rgba(255, 87, 87, ${opacity})`;
    case 'gold':
      return `rgba(255, 207, 102, ${opacity})`;
    case 'limeGreen':
      return `rgba(128, 227, 105, ${opacity})`;
    case 'passionFruit':
      return `rgba(255, 134, 174, ${opacity})`;
    default:
      return `rgba(153, 153, 153, ${opacity})`; // fallback gray
  }
}

function badgeStyle(colorName: string, bgOpacity = 0.85) {
  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
    border-radius: 1rem;
    min-width: 110px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    background-color: ${getRGBA(colorName, bgOpacity)};
    color: #fff; /* White text for higher contrast */

    .label {
      margin-left: 0.4rem;
    }
    svg {
      margin-right: 0.3rem;
    }
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  `;
}

export default function Feed({
  feed,
  feed: {
    content,
    isNewFeed,
    userId,
    username,
    profilePicUrl,
    timeStamp,
    wordLevel = 1,
    xpReward = 0,
    coinReward = 0,
    totalPoints = 0
  },
  setScrollToBottom,
  isLastFeed,
  myId,
  onReceiveNewFeed
}: {
  feed: any;
  setScrollToBottom: () => void;
  isLastFeed: boolean;
  myId: number;
  onReceiveNewFeed: () => void;
}) {
  const onRemoveNewActivityStatus = useChatContext(
    (v) => v.actions.onRemoveNewActivityStatus
  );
  const [wordModalShown, setWordModalShown] = useState(false);
  const userIsUploader = myId === userId;

  useEffect(() => {
    if (isLastFeed && userIsUploader) {
      setScrollToBottom();
    }
  }, [isLastFeed, userIsUploader, setScrollToBottom]);

  useEffect(() => {
    if (isNewFeed && isLastFeed && userIsUploader) {
      handleSendActivity();
    }
    async function handleSendActivity() {
      socket.emit('new_vocab_feed', feed);
      onRemoveNewActivityStatus(content);
    }
  }, [
    isNewFeed,
    isLastFeed,
    userIsUploader,
    feed,
    onRemoveNewActivityStatus,
    content
  ]);

  useEffect(() => {
    if (isLastFeed && isNewFeed && !userIsUploader) {
      onRemoveNewActivityStatus(content);
      onReceiveNewFeed();
    }
  }, [
    isLastFeed,
    isNewFeed,
    userIsUploader,
    onRemoveNewActivityStatus,
    content,
    onReceiveNewFeed
  ]);

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';

  // Keep the background subtle so the right-side badges pop more
  const backgroundColor = getRGBA(colorName, 0.08);
  const borderColor = getRGBA(colorName, 0.7);

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: 60px 1fr;
        grid-gap: 1rem;
        padding: 1.2rem 1rem;
        background-color: ${backgroundColor};
        border-left: 8px solid ${borderColor};
        border-radius: ${wideBorderRadius};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 50px 1fr;
          padding: 0.7rem;
          margin-bottom: 1rem;
        }
      `}
    >
      <div
        className={css`
          grid-row: 1 / 3;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        `}
      >
        <ProfilePic
          style={{ width: '100%' }}
          userId={userId}
          profilePicUrl={profilePicUrl}
        />
      </div>

      <div
        className={css`
          grid-column: 2 / 3;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          flex-wrap: wrap;

          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
            gap: 0.5rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            > span {
              font-size: 0.8rem;
              color: #666;
            }
          `}
        >
          <UsernameText
            className={css`
              font-size: 1.5rem;
              line-height: 1.3;
              color: #444;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.2rem;
              }
            `}
            user={{ id: userId, username }}
          />
          <span>{displayedTime}</span>
        </div>

        <div
          className={css`
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.4rem;

            @media (max-width: ${mobileMaxWidth}) {
              align-items: flex-start;
            }
          `}
        >
          <div className={badgeStyle('passionFruit')}>
            <span className="label">
              {addCommasToNumber(totalPoints)}{' '}
              {`${Number(totalPoints) === 1 ? 'pt' : 'pts'}`}
            </span>
          </div>

          {xpReward > 0 && (
            <div className={badgeStyle('limeGreen')}>
              <Icon icon={['far', 'star']} />
              <span className="label">{addCommasToNumber(xpReward)} XP</span>
            </div>
          )}

          {coinReward > 0 && (
            <div className={badgeStyle('gold')}>
              <Icon icon={['far', 'badge-dollar']} />
              <span className="label">{addCommasToNumber(coinReward)}</span>
            </div>
          )}
        </div>
      </div>

      <div
        className={css`
          grid-column: 2 / 3;
          margin-top: 0.2rem;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          word-break: break-word;

          @media (max-width: ${mobileMaxWidth}) {
            font-size: 1.1rem;
            margin-top: 0.3rem;
          }
        `}
      >
        <div>
          <span
            className={css`
              display: inline-block;
              padding: 0.4rem 0.8rem;
              border-radius: 1rem;
              margin-right: 0.6rem;
              font-size: 1rem;
              font-weight: 600;
              color: #fff;
              background: ${getRGBA(colorName, 1)};
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
            `}
          >
            {wordLevelHash[wordLevel]?.label || '???'}
          </span>
          <span
            className={css`
              font-weight: bold;
              cursor: pointer;
              margin-left: 0.5rem;
              color: ${getRGBA('logoBlue', 1)};

              &:hover {
                text-decoration: underline;
                transition: all 0.15s ease-in;
              }
            `}
            onClick={() => setWordModalShown(true)}
          >
            {content}
          </span>
        </div>
      </div>

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
