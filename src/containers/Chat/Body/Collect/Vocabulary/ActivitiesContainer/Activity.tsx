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
      return `rgba(65,140,235,${opacity})`;
    case 'pink':
      return `rgba(255,105,180,${opacity})`;
    case 'orange':
      return `rgba(255,140,0,${opacity})`;
    case 'red':
      return `rgba(255,65,54,${opacity})`;
    case 'gold':
      return `rgba(255,203,50,${opacity})`;
    default:
      return `rgba(153,153,153,${opacity})`;
  }
}

export default function Activity({
  activity,
  activity: {
    content,
    isNewActivity,
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
  isLastActivity,
  myId,
  onReceiveNewActivity
}: {
  activity: any;
  setScrollToBottom: () => void;
  isLastActivity: boolean;
  myId: number;
  onReceiveNewActivity: () => void;
}) {
  const onRemoveNewActivityStatus = useChatContext(
    (v) => v.actions.onRemoveNewActivityStatus
  );
  const [wordModalShown, setWordModalShown] = useState(false);
  const userIsUploader = myId === userId;

  useEffect(() => {
    if (isLastActivity && userIsUploader) {
      setScrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isNewActivity && isLastActivity && userIsUploader) {
      handleSendActivity();
    }
    async function handleSendActivity() {
      socket.emit('new_vocab_feed', activity);
      onRemoveNewActivityStatus(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLastActivity && isNewActivity && !userIsUploader) {
      onRemoveNewActivityStatus(content);
      onReceiveNewActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.06);
  const borderColor = getRGBA(colorName, 0.8);

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: 60px 1fr;
        grid-template-rows: auto auto;
        grid-gap: 1rem;
        padding: 1rem;
        background-color: ${backgroundColor};
        border-left: 8px solid ${borderColor};
        border-radius: ${wideBorderRadius};
        margin-bottom: 1.5rem;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 50px 1fr;
          padding: 0.5rem;
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
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;

          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.3rem;
          }
        `}
      >
        <div
          className={css`
            display: flex;
            flex-direction: column;
            > span {
              font-size: 1.2rem;
              color: rgba(100, 100, 100, 0.9);
            }
          `}
        >
          <UsernameText
            className={css`
              font-size: 1.5rem;
              line-height: 1.2;
              @media (max-width: ${mobileMaxWidth}) {
                font-size: 1.3rem;
              }
            `}
            user={{ id: userId, username }}
          />
          <span>{displayedTime}</span>
        </div>
        <div
          className={css`
            display: flex;
            align-items: center;
            background-color: ${getRGBA('orange', 0.1)};
            color: rgba(255, 140, 0, 1);
            font-weight: bold;
            font-size: 1.2rem;
            padding: 0.3rem 0.6rem;
            border-radius: 2rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            @media (max-width: ${mobileMaxWidth}) {
              margin-top: 0.5rem;
            }
            > span {
              margin-left: 0.5rem;
            }
          `}
        >
          Total Points: <span>{addCommasToNumber(totalPoints)}</span>
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
            font-size: 1.3rem;
            margin-top: 0.3rem;
          }
        `}
      >
        <div>
          <span
            className={css`
              display: inline-block;
              padding: 0.3rem 0.6rem;
              border-radius: 1rem;
              margin-right: 0.6rem;
              font-size: 1.1rem;
              font-weight: 600;
              color: #fff;
              background: ${getRGBA(colorName, 1)};
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
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
              }
            `}
            onClick={() => setWordModalShown(true)}
          >
            {content}
          </span>
        </div>
        <div
          className={css`
            display: inline-flex;
            align-items: center;
            gap: 1rem;
          `}
        >
          {xpReward > 0 && (
            <div
              className={css`
                display: flex;
                align-items: center;
                background-color: ${getRGBA('pink', 0.15)};
                color: ${getRGBA('pink', 1)};
                font-weight: bold;
                padding: 0.2rem 0.4rem;
                border-radius: 1rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                .label {
                  margin-left: 0.3rem;
                }
              `}
            >
              <Icon icon={['far', 'star']} />
              <span className="label">+{addCommasToNumber(xpReward)} XP</span>
            </div>
          )}
          {coinReward > 0 && (
            <div
              className={css`
                display: flex;
                align-items: center;
                background-color: ${getRGBA('gold', 0.15)};
                color: ${getRGBA('gold', 1)};
                font-weight: bold;
                padding: 0.2rem 0.4rem;
                border-radius: 1rem;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
                .label {
                  margin-left: 0.3rem;
                }
                svg {
                  margin-right: 0.2rem;
                }
              `}
            >
              <Icon icon={['far', 'badge-dollar']} />
              <span className="label">+{addCommasToNumber(coinReward)}</span>
            </div>
          )}
        </div>
      </div>

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
