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

// Assign distinct colors to each action to help them stand out
function getActionColor(action: string) {
  switch (action) {
    case 'register':
      return 'limeGreen';
    case 'hit':
      return 'orange';
    case 'apply':
      return 'pink';
    case 'spell':
      return 'logoBlue';
    case 'answer':
      return 'red';
    default:
      return 'passionFruit'; // fallback
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
    color: #fff;

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
    action,
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

  // Provide a more descriptive label for each action
  const actionLabel = useMemo(() => {
    switch (action) {
      case 'register':
        return 'Registered a New Word';
      case 'hit':
        return 'Revisited an Existing Word';
      case 'apply':
        return 'Used the Word in a Sentence';
      case 'spell':
        return 'Spelled the Word';
      case 'answer':
        return 'Answered a Question';
      default:
        return 'Performed an Action';
    }
  }, [action]);

  // For apply & answer, show placeholders:
  const actionDetails = useMemo(() => {
    switch (action) {
      case 'apply':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Example sentence:</strong>
            <br />
            “I can <b>{content}</b> my skills in everyday life by practicing
            regularly.”
          </div>
        );
      case 'answer':
        return (
          <div
            className={css`
              margin-top: 0.8rem;
              border-radius: 0.5rem;
              background: #f5f5f5;
              padding: 0.8rem;
              font-style: italic;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            `}
          >
            <strong>Multiple choice question:</strong>
            <br />
            “What does <b>{content}</b> mean?”
            <ul
              className={css`
                list-style-type: none;
                margin-top: 0.5rem;
                padding-left: 0;
                li {
                  margin-bottom: 0.3rem;
                }
              `}
            >
              <li>A) [Placeholder definition 1]</li>
              <li>B) [Placeholder definition 2]</li>
              <li>C) [Placeholder definition 3]</li>
              <li>D) [Placeholder definition 4]</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  }, [action, content]);

  // Derive colors from the action
  const actionColor = getActionColor(action);
  // For the overall container background, we still use wordLevel color
  const colorName = wordLevelHash[wordLevel]?.color || 'logoBlue';
  const backgroundColor = getRGBA(colorName, 0.08);
  const borderColor = getRGBA(colorName, 0.7);

  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: 60px 1fr 140px;
        grid-gap: 1rem;
        padding: 1.2rem 1rem;
        background-color: ${backgroundColor};
        border-left: 8px solid ${borderColor};
        border-radius: ${wideBorderRadius};
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        margin-bottom: 1.5rem;

        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: 50px 1fr;
          grid-template-rows: auto auto; /* fallback for smaller screens */
          padding: 0.7rem;
          margin-bottom: 1rem;
        }
      `}
    >
      <div
        className={css`
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;

          @media (max-width: ${mobileMaxWidth}) {
            grid-row: 1 / 2;
          }
        `}
      >
        <ProfilePic
          style={{ width: '100%' }}
          userId={userId}
          profilePicUrl={profilePicUrl}
        />
        {/* Username with truncation and a smaller-larger size */}
        <div
          className={css`
            width: 100%;
            max-width: 100%;
            margin-top: 0.4rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: center;
          `}
        >
          <UsernameText
            className={css`
              font-weight: 600;
              color: #444;
              font-size: 1.2rem; /* Smaller than previous 1.4/1.5 but bigger than old ~1rem */
            `}
            user={{ id: userId, username }}
          />
        </div>
      </div>

      {/* CENTER COLUMN: Action + Word Info */}
      <div
        className={css`
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 0.6rem;

          @media (max-width: ${mobileMaxWidth}) {
            order: 3;
            grid-column: 1 / 3;
          }
        `}
      >
        {/* ACTION Label (big and colorful) */}
        <div
          className={css`
            display: inline-block;
            background-color: ${getRGBA(actionColor, 0.85)};
            color: #fff;
            font-size: 1.4rem;
            font-weight: 700;
            padding: 0.4rem 0.8rem;
            border-radius: 0.5rem;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
            text-align: center;
            width: fit-content;

            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.2rem;
            }
          `}
        >
          {actionLabel}
        </div>

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
              font-size: 1.3rem; /* Larger to make the word stand out */
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 90vw;

              &:hover {
                text-decoration: underline;
                transition: all 0.15s ease-in;
              }

              @media (max-width: ${mobileMaxWidth}) {
                max-width: 70vw; /* adjust for small screens */
              }
            `}
            onClick={() => setWordModalShown(true)}
            title={content} // optional to show full content in a tooltip
          >
            {content}
          </span>
        </div>

        {/* ACTION DETAILS (placeholders for apply/answer) */}
        {actionDetails}

        {/* TIME */}
        <div
          className={css`
            margin-top: 0.4rem;
            font-size: 0.9rem;
            color: #666;
          `}
        >
          <span>{displayedTime}</span>
        </div>
      </div>

      <div
        className={css`
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.5rem;

          @media (max-width: ${mobileMaxWidth}) {
            flex-direction: row;
            justify-content: flex-start;
            gap: 0.5rem;
            order: 2;
          }
        `}
      >
        {/* Single-activity points */}
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

      {wordModalShown && (
        <WordModal word={content} onHide={() => setWordModalShown(false)} />
      )}
    </div>
  );
}
